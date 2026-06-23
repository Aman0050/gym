-- Create Staff Members Table
CREATE TABLE IF NOT EXISTS staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    photo_url TEXT,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Trainer', 'Receptionist', 'Manager', 'Housekeeping', 'Nutritionist', 'Owner')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_members_tenant ON staff_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(tenant_id, role);

-- Create Staff Attendance Table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half Day', 'Leave')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_tenant_date ON staff_attendance(tenant_id, date DESC);

-- Create Staff Payroll Table
CREATE TABLE IF NOT EXISTS staff_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL, -- Format: YYYY-MM
    base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
    bonus DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (bonus >= 0),
    incentives DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (incentives >= 0),
    deductions DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
    advance_salary DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (advance_salary >= 0),
    net_pay DECIMAL(12, 2) NOT NULL CHECK (net_pay >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Draft', 'Paid', 'Cancelled')),
    payslip_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, staff_id, month)
);

CREATE INDEX IF NOT EXISTS idx_staff_payroll_tenant_month ON staff_payroll(tenant_id, month);

-- Create Trainer Performance Table
CREATE TABLE IF NOT EXISTS trainer_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    assigned_members_count INTEGER DEFAULT 0 CHECK (assigned_members_count >= 0),
    retention_rate DECIMAL(5, 2) DEFAULT 0 CHECK (retention_rate >= 0 AND retention_rate <= 100),
    renewals_count INTEGER DEFAULT 0 CHECK (renewals_count >= 0),
    revenue_influenced DECIMAL(12, 2) DEFAULT 0 CHECK (revenue_influenced >= 0),
    attendance_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_performance_tenant ON trainer_performance(tenant_id);
