from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import OperationLog
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/operation_logs", tags=["operation_logs"])

class OperationLogBase(BaseModel):
    timestamp: Optional[str]
    forklift_id: Optional[int]
    event: str
    details: Optional[str]

class OperationLogCreate(OperationLogBase):
    pass

class OperationLogUpdate(BaseModel):
    timestamp: Optional[str]
    forklift_id: Optional[int]
    event: Optional[str]
    details: Optional[str]

class OperationLogOut(OperationLogBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/", response_model=List[OperationLogOut])
async def list_operation_logs(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(OperationLog))
    return result.scalars().all()

@router.get("/{log_id}", response_model=OperationLogOut)
async def get_operation_log(log_id: int, session: AsyncSession = Depends(get_session)):
    log = await session.get(OperationLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Operation log not found")
    return log

@router.post("/", response_model=OperationLogOut)
async def create_operation_log(log: OperationLogCreate, session: AsyncSession = Depends(get_session)):
    db_log = OperationLog(**log.dict())
    session.add(db_log)
    await session.commit()
    await session.refresh(db_log)
    return db_log

@router.put("/{log_id}", response_model=OperationLogOut)
async def update_operation_log(log_id: int, log: OperationLogUpdate, session: AsyncSession = Depends(get_session)):
    db_log = await session.get(OperationLog, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Operation log not found")
    for field, value in log.dict(exclude_unset=True).items():
        setattr(db_log, field, value)
    await session.commit()
    await session.refresh(db_log)
    return db_log

@router.delete("/{log_id}")
async def delete_operation_log(log_id: int, session: AsyncSession = Depends(get_session)):
    db_log = await session.get(OperationLog, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Operation log not found")
    await session.delete(db_log)
    await session.commit()
    return {"ok": True} 