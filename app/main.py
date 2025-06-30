from fastapi import FastAPI
from app.routers.forklifts import router as forklifts_router
from app.routers.orders import router as orders_router
from app.routers.plans import router as plans_router
from app.routers.warehouse import router as warehouse_router
from app.routers.kpis import router as kpis_router
from app.routers.operation_logs import router as operation_logs_router
from app.routers.simulations import router as simulations_router

app = FastAPI()

app.include_router(forklifts_router)
app.include_router(orders_router)
app.include_router(plans_router)
app.include_router(warehouse_router)
app.include_router(kpis_router)
app.include_router(operation_logs_router)
app.include_router(simulations_router)

@app.get("/")
def read_root():
    return {"message": "Forklift Dispatch Simulator API is running!"} 