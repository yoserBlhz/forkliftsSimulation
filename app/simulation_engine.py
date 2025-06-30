import asyncio
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Forklift, Order, DispatchPlan, OperationLog, KPI, Simulation
from app.db import AsyncSessionLocal
from datetime import datetime

class SimulationEngine:
    def __init__(self):
        self.running_simulations: Dict[int, asyncio.Task] = {}

    async def start_simulation(self, simulation_id: int):
        if simulation_id in self.running_simulations:
            return  # Already running
        task = asyncio.create_task(self.run_simulation(simulation_id))
        self.running_simulations[simulation_id] = task

    async def stop_simulation(self, simulation_id: int):
        task = self.running_simulations.get(simulation_id)
        if task:
            task.cancel()
            del self.running_simulations[simulation_id]
            # Optionally update simulation status in DB
            async with AsyncSessionLocal() as session:
                sim = await session.get(Simulation, simulation_id)
                if sim:
                    sim.status = 'stopped'
                    sim.end_time = datetime.utcnow()
                    await session.commit()

    async def run_simulation(self, simulation_id: int):
        try:
            async with AsyncSessionLocal() as session:
                # Set simulation status to running
                sim = await session.get(Simulation, simulation_id)
                if sim:
                    sim.status = 'running'
                    sim.start_time = datetime.utcnow()
                    await session.commit()

            while True:
                async with AsyncSessionLocal() as session:
                    # Fetch all active plans for this simulation
                    plans = (await session.execute(
                        select(DispatchPlan).where(DispatchPlan.simulation_id == simulation_id)
                    )).scalars().all()
                    # Fetch forklifts and orders
                    forklifts = (await session.execute(
                        select(Forklift)
                    )).scalars().all()
                    orders = (await session.execute(
                        select(Order)
                    )).scalars().all()

                    # Simulate movement and update statuses
                    for plan in plans:
                        # Example: Move forklift towards pickup/delivery (simple logic)
                        forklift = next((f for f in forklifts if f.id == plan.forklift_id), None)
                        order = next((o for o in orders if o.id == plan.order_id), None)
                        if not forklift or not order:
                            continue
                        # Move towards pickup if not at pickup
                        if order.status == 'pending':
                            dx = order.pickup_x - forklift.x
                            dy = order.pickup_y - forklift.y
                            if dx != 0:
                                forklift.x += 1 if dx > 0 else -1
                            elif dy != 0:
                                forklift.y += 1 if dy > 0 else -1
                            else:
                                order.status = 'in_progress'
                                # Log pickup
                                session.add(OperationLog(
                                    timestamp=datetime.utcnow(),
                                    forklift_id=forklift.id,
                                    event='pickup',
                                    details=f'Order {order.id} picked up',
                                    simulation_id=simulation_id
                                ))
                        # Move towards delivery if at pickup
                        elif order.status == 'in_progress':
                            dx = order.delivery_x - forklift.x
                            dy = order.delivery_y - forklift.y
                            if dx != 0:
                                forklift.x += 1 if dx > 0 else -1
                            elif dy != 0:
                                forklift.y += 1 if dy > 0 else -1
                            else:
                                order.status = 'done'
                                plan.end_time = datetime.utcnow()
                                # Log delivery
                                session.add(OperationLog(
                                    timestamp=datetime.utcnow(),
                                    forklift_id=forklift.id,
                                    event='delivery',
                                    details=f'Order {order.id} delivered',
                                    simulation_id=simulation_id
                                ))
                    # Update KPIs (simple example: count done orders)
                    done_orders = sum(1 for o in orders if o.status == 'done')
                    session.add(KPI(
                        timestamp=datetime.utcnow(),
                        execution_time=done_orders,  # Placeholder
                        block_time=0,  # Placeholder
                        simulation_id=simulation_id
                    ))
                    await session.commit()

                    # Check for completion
                    if all(o.status == 'done' for o in orders):
                        sim = await session.get(Simulation, simulation_id)
                        if sim:
                            sim.status = 'completed'
                            sim.end_time = datetime.utcnow()
                            await session.commit()
                        break
                await asyncio.sleep(1)  # Time step
        except asyncio.CancelledError:
            pass

# Global simulation engine instance
simulation_engine = SimulationEngine() 