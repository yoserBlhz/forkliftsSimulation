from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import DispatchPlan, Order, Forklift
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/plans", tags=["plans"])

class PlanBase(BaseModel):
    forklift_id: Optional[int]
    order_id: Optional[int]
    start_time: Optional[str]
    end_time: Optional[str]

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    forklift_id: Optional[int]
    order_id: Optional[int]
    start_time: Optional[str]
    end_time: Optional[str]

class PlanOut(PlanBase):
    id: int
    class Config:
        orm_mode = True

def to_dict(obj):
    if obj is None:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

# @router.get("/", response_model=List[PlanOut])
# async def list_plans(session: AsyncSession = Depends(get_session)):
#     result = await session.execute(select(DispatchPlan))
#     return result.scalars().all()

@router.get("/all", response_model=List[dict])
async def list_plans(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(DispatchPlan))
    plans = result.scalars().all()
    # Fetch related orders and forklifts
    order_ids = [p.order_id for p in plans]
    forklift_ids = [p.forklift_id for p in plans]
    orders = (await session.execute(select(Order).where(Order.id.in_(order_ids)))).scalars().all()
    forklifts = (await session.execute(select(Forklift).where(Forklift.id.in_(forklift_ids)))).scalars().all()
    order_map = {o.id: o for o in orders}
    forklift_map = {f.id: f for f in forklifts}
    return [
        {
            "id": p.id,
            "forklift_id": p.forklift_id,
            "order_id": p.order_id,
            "start_time": p.start_time,
            "end_time": p.end_time,
            "simulation_id": p.simulation_id,
            "order": to_dict(order_map.get(p.order_id)),
            "forklift": to_dict(forklift_map.get(p.forklift_id))
        } for p in plans
    ]

@router.get("/{plan_id}", response_model=PlanOut)
async def get_plan(plan_id: int, session: AsyncSession = Depends(get_session)):
    plan = await session.get(DispatchPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.post("/", response_model=PlanOut)
async def create_plan(plan: PlanCreate, session: AsyncSession = Depends(get_session)):
    db_plan = DispatchPlan(**plan.dict())
    session.add(db_plan)
    await session.commit()
    await session.refresh(db_plan)
    return db_plan

@router.put("/{plan_id}", response_model=PlanOut)
async def update_plan(plan_id: int, plan: PlanUpdate, session: AsyncSession = Depends(get_session)):
    db_plan = await session.get(DispatchPlan, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, value in plan.dict(exclude_unset=True).items():
        setattr(db_plan, field, value)
    await session.commit()
    await session.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, session: AsyncSession = Depends(get_session)):
    db_plan = await session.get(DispatchPlan, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await session.delete(db_plan)
    await session.commit()
    return {"ok": True}

@router.post("/reset_times")
async def reset_plan_times(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(DispatchPlan).order_by(DispatchPlan.id))
    plans = result.scalars().all()
    now = datetime.now()  # Use local time
    interval = timedelta(seconds=10)  # Each plan lasts 10 seconds
    for i, plan in enumerate(plans):
        plan.start_time = now + i * interval
        plan.end_time = now + (i + 1) * interval
    await session.commit()
    return {"message": "Plan times reset to start from now."} 