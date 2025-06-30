from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import Order
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/orders", tags=["orders"])

class OrderBase(BaseModel):
    pickup_x: int
    pickup_y: int
    delivery_x: int
    delivery_y: int
    status: str

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    pickup_x: Optional[int]
    pickup_y: Optional[int]
    delivery_x: Optional[int]
    delivery_y: Optional[int]
    status: Optional[str]

class OrderOut(OrderBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/", response_model=List[OrderOut])
async def list_orders(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Order))
    return result.scalars().all()

@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, session: AsyncSession = Depends(get_session)):
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=OrderOut)
async def create_order(order: OrderCreate, session: AsyncSession = Depends(get_session)):
    db_order = Order(**order.dict())
    session.add(db_order)
    await session.commit()
    await session.refresh(db_order)
    return db_order

@router.put("/{order_id}", response_model=OrderOut)
async def update_order(order_id: int, order: OrderUpdate, session: AsyncSession = Depends(get_session)):
    db_order = await session.get(Order, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    for field, value in order.dict(exclude_unset=True).items():
        setattr(db_order, field, value)
    await session.commit()
    await session.refresh(db_order)
    return db_order

@router.delete("/{order_id}")
async def delete_order(order_id: int, session: AsyncSession = Depends(get_session)):
    db_order = await session.get(Order, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    await session.delete(db_order)
    await session.commit()
    return {"ok": True} 