from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import Simulation
from app.simulation_engine import simulation_engine
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/simulations", tags=["simulations"])

class SimulationBase(BaseModel):
    name: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    status: Optional[str]

class SimulationCreate(SimulationBase):
    pass

class SimulationUpdate(BaseModel):
    name: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    status: Optional[str]

class SimulationOut(SimulationBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/", response_model=List[SimulationOut])
async def list_simulations(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Simulation))
    return result.scalars().all()

@router.get("/{simulation_id}", response_model=SimulationOut)
async def get_simulation(simulation_id: int, session: AsyncSession = Depends(get_session)):
    simulation = await session.get(Simulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation

@router.post("/", response_model=SimulationOut)
async def create_simulation(simulation: SimulationCreate, session: AsyncSession = Depends(get_session)):
    db_simulation = Simulation(**simulation.dict())
    session.add(db_simulation)
    await session.commit()
    await session.refresh(db_simulation)
    return db_simulation

@router.put("/{simulation_id}", response_model=SimulationOut)
async def update_simulation(simulation_id: int, simulation: SimulationUpdate, session: AsyncSession = Depends(get_session)):
    db_simulation = await session.get(Simulation, simulation_id)
    if not db_simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    for field, value in simulation.dict(exclude_unset=True).items():
        setattr(db_simulation, field, value)
    await session.commit()
    await session.refresh(db_simulation)
    return db_simulation

@router.delete("/{simulation_id}")
async def delete_simulation(simulation_id: int, session: AsyncSession = Depends(get_session)):
    db_simulation = await session.get(Simulation, simulation_id)
    if not db_simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    await session.delete(db_simulation)
    await session.commit()
    return {"ok": True}

@router.post("/{simulation_id}/start")
async def start_simulation(simulation_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulation_engine.start_simulation, simulation_id)
    return {"message": f"Simulation {simulation_id} started."}

@router.post("/{simulation_id}/stop")
async def stop_simulation(simulation_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulation_engine.stop_simulation, simulation_id)
    return {"message": f"Simulation {simulation_id} stopped."} 