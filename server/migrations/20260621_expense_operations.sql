-- Create Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant ON expense_categories(tenant_id);

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    expense_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque')),
    invoice_url TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Paid', 'Pending', 'Cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(tenant_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(tenant_id, status);

-- Create Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100) NOT NULL, -- Supplements, Protein, Shakers, Bottles, Merchandise, Accessories
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_cost DECIMAL(12, 2) NOT NULL CHECK (unit_cost >= 0),
    selling_price DECIMAL(12, 2) NOT NULL CHECK (selling_price >= 0),
    minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'In Stock',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(tenant_id, category);

-- Create Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);

-- Create Equipment Assets Table
CREATE TABLE IF NOT EXISTS equipment_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL, -- Treadmills, Cycles, Machines, Dumbbells, Equipment
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_cost DECIMAL(12, 2) NOT NULL CHECK (purchase_cost >= 0),
    warranty_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Maintenance', 'Retired')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_assets_tenant ON equipment_assets(tenant_id);

-- Create Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES equipment_assets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    repair_cost DECIMAL(12, 2) NOT NULL CHECK (repair_cost >= 0),
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_tenant ON maintenance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_asset ON maintenance_logs(asset_id);

-- Create Operations Audit Logs Table
CREATE TABLE IF NOT EXISTS operations_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    record_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operations_audit_logs_tenant ON operations_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_operations_audit_logs_record ON operations_audit_logs(record_id);
