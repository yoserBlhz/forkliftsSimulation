from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text)
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    status = Column(Text)

class Forklift(Base):
    __tablename__ = "forklifts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    status = Column(Text, nullable=False)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    pickup_x = Column(Integer, nullable=False)
    pickup_y = Column(Integer, nullable=False)
    delivery_x = Column(Integer, nullable=False)
    delivery_y = Column(Integer, nullable=False)
    status = Column(Text, nullable=False)

class DispatchPlan(Base):
    __tablename__ = "dispatch_plans"
    id = Column(Integer, primary_key=True, index=True)
    forklift_id = Column(Integer, ForeignKey("forklifts.id"))
    order_id = Column(Integer, ForeignKey("orders.id"))
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))

class OperationLog(Base):
    __tablename__ = "operation_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(TIMESTAMP)
    forklift_id = Column(Integer, ForeignKey("forklifts.id"))
    event = Column(Text, nullable=False)
    details = Column(Text)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))

class KPI(Base):
    __tablename__ = "kpis"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(TIMESTAMP)
    execution_time = Column(Float)
    block_time = Column(Float)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))

class WarehouseMap(Base):
    __tablename__ = "warehouse_map"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    layout = Column(JSON, nullable=False) 