from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import WarehouseMap
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/warehouse", tags=["warehouse"])

class WarehouseMapBase(BaseModel):
    name: str
    layout: Dict[str, Any]

class WarehouseMapCreate(WarehouseMapBase):
    pass

class WarehouseMapUpdate(BaseModel):
    name: Optional[str]
    layout: Optional[Dict[str, Any]]

class WarehouseMapOut(WarehouseMapBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/", response_model=List[WarehouseMapOut])
async def list_warehouse_maps(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(WarehouseMap))
    return result.scalars().all()

@router.get("/{map_id}", response_model=WarehouseMapOut)
async def get_warehouse_map(map_id: int, session: AsyncSession = Depends(get_session)):
    warehouse_map = await session.get(WarehouseMap, map_id)
    if not warehouse_map:
        raise HTTPException(status_code=404, detail="Warehouse map not found")
    return warehouse_map

@router.post("/", response_model=WarehouseMapOut)
async def create_warehouse_map(warehouse_map: WarehouseMapCreate, session: AsyncSession = Depends(get_session)):
    db_map = WarehouseMap(**warehouse_map.dict())
    session.add(db_map)
    await session.commit()
    await session.refresh(db_map)
    return db_map

@router.put("/{map_id}", response_model=WarehouseMapOut)
async def update_warehouse_map(map_id: int, warehouse_map: WarehouseMapUpdate, session: AsyncSession = Depends(get_session)):
    db_map = await session.get(WarehouseMap, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Warehouse map not found")
    for field, value in warehouse_map.dict(exclude_unset=True).items():
        setattr(db_map, field, value)
    await session.commit()
    await session.refresh(db_map)
    return db_map

@router.delete("/{map_id}")
async def delete_warehouse_map(map_id: int, session: AsyncSession = Depends(get_session)):
    db_map = await session.get(WarehouseMap, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Warehouse map not found")
    await session.delete(db_map)
    await session.commit()
    return {"ok": True} 