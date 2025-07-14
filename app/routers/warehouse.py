from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db import get_session
from app.models import LocationList, MapList

router = APIRouter(prefix="/warehouse", tags=["warehouse"])

@router.get("/locations")
async def list_locations(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(LocationList))
    locations = result.scalars().all()
    return [
        {
            "id": loc.id,
            "name": loc.name,
            "mapId": loc.mapId,
            "displayX": loc.displayX,
            "displayY": loc.displayY
        } for loc in locations
    ]

@router.get("/maps")
async def list_maps(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MapList))
    maps = result.scalars().all()
    return [
        {
            "id": m.id,
            "name": m.name
        } for m in maps
    ] 