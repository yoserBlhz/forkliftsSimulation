from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import DispatchPlan
from pydantic import BaseModel
from typing import List, Optional

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

@router.get("/", response_model=List[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(DispatchPlan))
    return result.scalars().all()

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