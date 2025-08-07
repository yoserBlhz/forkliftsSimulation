from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from app.db import get_session
from app.models import Forklift, OperationLog
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/forklifts", tags=["forklifts"])

class ForkliftBase(BaseModel):
    name: str
    status: str
    location_id: int

class ForkliftCreate(ForkliftBase):
    pass

class ForkliftUpdate(BaseModel):
    name: Optional[str]
    status: Optional[str]
    location_id: Optional[int]

class ForkliftOut(ForkliftBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/", response_model=List[ForkliftOut])
async def list_forklifts(status: Optional[str] = None, session: AsyncSession = Depends(get_session)):
    query = select(Forklift)
    if status:
        query = query.where(Forklift.status == status)
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/{forklift_id}", response_model=ForkliftOut)
async def get_forklift(forklift_id: int, session: AsyncSession = Depends(get_session)):
    forklift = await session.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=404, detail="Forklift not found")
    return forklift

@router.post("/", response_model=ForkliftOut)
async def create_forklift(forklift: ForkliftCreate, session: AsyncSession = Depends(get_session)):
    db_forklift = Forklift(**forklift.dict())
    session.add(db_forklift)
    await session.commit()
    await session.refresh(db_forklift)
    return db_forklift

@router.put("/{forklift_id}", response_model=ForkliftOut)
async def update_forklift(forklift_id: int, forklift: ForkliftUpdate, session: AsyncSession = Depends(get_session)):
    db_forklift = await session.get(Forklift, forklift_id)
    if not db_forklift:
        raise HTTPException(status_code=404, detail="Forklift not found")
    for field, value in forklift.dict(exclude_unset=True).items():
        setattr(db_forklift, field, value)
    await session.commit()
    await session.refresh(db_forklift)
    return db_forklift

@router.delete("/{forklift_id}")
async def delete_forklift(forklift_id: int, session: AsyncSession = Depends(get_session)):
    db_forklift = await session.get(Forklift, forklift_id)
    if not db_forklift:
        raise HTTPException(status_code=404, detail="Forklift not found")
    await session.delete(db_forklift)
    await session.commit()
    return {"ok": True}

@router.post("/{forklift_id}/block")
async def block_forklift(forklift_id: int, session: AsyncSession = Depends(get_session)):
    forklift = await session.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=404, detail="Forklift not found")
    forklift.status = "blocked"
    session.add(OperationLog(
        timestamp=datetime.utcnow(),
        forklift_id=forklift.id,
        event="block",
        details=f"Forklift {forklift.id} blocked"
    ))
    await session.commit()
    return {"message": f"Forklift {forklift_id} blocked."}

@router.post("/{forklift_id}/unblock")
async def unblock_forklift(forklift_id: int, session: AsyncSession = Depends(get_session)):
    forklift = await session.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=404, detail="Forklift not found")
    forklift.status = "available"
    session.add(OperationLog(
        timestamp=datetime.utcnow(),
        forklift_id=forklift.id,
        event="unblock",
        details=f"Forklift {forklift.id} unblocked"
    ))
    await session.commit()
    return {"message": f"Forklift {forklift_id} unblocked."}

class ForkliftStatusUpdate(BaseModel):
    status: str

@router.patch("/{forklift_id}/status")
async def update_forklift_status(forklift_id: int, status_update: ForkliftStatusUpdate, session: AsyncSession = Depends(get_session)):
    forklift = await session.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=404, detail="Forklift not found")
    old_status = forklift.status
    forklift.status = status_update.status
    session.add(OperationLog(
        timestamp=datetime.utcnow(),
        forklift_id=forklift.id,
        event="status_update",
        details=f"Forklift {forklift.id} status changed from {old_status} to {status_update.status}"
    ))
    await session.commit()
    return {"message": f"Forklift {forklift_id} status updated to {status_update.status}."}

@router.post("/reset-status")
async def reset_all_forklift_status(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Forklift))
    forklifts = result.scalars().all()
    for forklift in forklifts:
        forklift.status = 'available'
    await session.commit()
    return {"message": "All forklift statuses reset to available"} 