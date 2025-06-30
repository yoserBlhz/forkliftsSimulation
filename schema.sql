CREATE TABLE forklifts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    pickup_x INT NOT NULL,
    pickup_y INT NOT NULL,
    delivery_x INT NOT NULL,
    delivery_y INT NOT NULL,
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