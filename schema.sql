CREATE TABLE forklifts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    location_id INT REFERENCES locationList(id)
);

CREATE TABLE mapList (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE locationMapList (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mapId INT REFERENCES mapList(id)
);

CREATE TABLE locationList (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mapId INT REFERENCES mapList(id),
    displayX INT NOT NULL,
    displayY INT NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    pickup_location_id INT REFERENCES locationlist(id),
    delivery_location_id INT REFERENCES locationlist(id),
    status TEXT NOT NULL
);

CREATE TABLE dispatch_plans (
    id SERIAL PRIMARY KEY,
    forklift_id INT REFERENCES forklifts(id),
    order_id INT REFERENCES orders(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    simulation_id INT REFERENCES simulations(id)
);

CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    forklift_id INT REFERENCES forklifts(id),
    event TEXT NOT NULL,
    details TEXT,
    simulation_id INT REFERENCES simulations(id)
);

CREATE TABLE kpis (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    execution_time FLOAT,
    block_time FLOAT,
    simulation_id INT REFERENCES simulations(id)
);

CREATE TABLE warehouse_map (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    layout JSONB NOT NULL
);

CREATE TABLE simulations (
    id SERIAL PRIMARY KEY,
    name TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status TEXT
); 