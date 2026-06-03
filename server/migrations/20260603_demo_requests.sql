CREATE TABLE IF NOT EXISTS demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    gym_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    members VARCHAR(50),
    branches VARCHAR(50),
    contact_method VARCHAR(50),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
