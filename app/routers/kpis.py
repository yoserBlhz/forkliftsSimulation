from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import KPI
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/kpis", tags=["kpis"])

class KPIBase(BaseModel):
    timestamp: Optional[str]
    execution_time: Optional[float]
    block_time: Optional[float]

class KPICreate(KPIBase):
    pass

class KPIUpdate(BaseModel):
    timestamp: Optional[str]
    execution_time: Optional[float]
    block_time: Optional[float]

class KPIOut(KPIBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/", response_model=List[KPIOut])
async def list_kpis(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(KPI))
    return result.scalars().all()

@router.get("/{kpi_id}", response_model=KPIOut)
async def get_kpi(kpi_id: int, session: AsyncSession = Depends(get_session)):
    kpi = await session.get(KPI, kpi_id)
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    return kpi

@router.post("/", response_model=KPIOut)
async def create_kpi(kpi: KPICreate, session: AsyncSession = Depends(get_session)):
    db_kpi = KPI(**kpi.dict())
    session.add(db_kpi)
    await session.commit()
    await session.refresh(db_kpi)
    return db_kpi

@router.put("/{kpi_id}", response_model=KPIOut)
async def update_kpi(kpi_id: int, kpi: KPIUpdate, session: AsyncSession = Depends(get_session)):
    db_kpi = await session.get(KPI, kpi_id)
    if not db_kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    for field, value in kpi.dict(exclude_unset=True).items():
        setattr(db_kpi, field, value)
    await session.commit()
    await session.refresh(db_kpi)
    return db_kpi

@router.delete("/{kpi_id}")
async def delete_kpi(kpi_id: int, session: AsyncSession = Depends(get_session)):
    db_kpi = await session.get(KPI, kpi_id)
    if not db_kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    await session.delete(db_kpi)
    await session.commit()
    return {"ok": True} 