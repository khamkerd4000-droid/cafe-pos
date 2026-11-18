-- ============================================================================
-- QUICKONE CAFE & BAKERY POS - SUPABASE DATABASE SCHEMA & SEED DATA
-- Currency: Lao Kip (₭ / LAK) | Language: Lao (ພາສາລາວ) & English
-- Architecture: 100% Real Supabase - Zero Mock Data
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. DROP EXISTING CAFE TABLES IF REBUILDING (ORDERED BY DEPENDENCY)
-- ============================================================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cashier_shifts CASCADE;
DROP TABLE IF EXISTS dining_tables CASCADE;
DROP TABLE IF EXISTS toppings CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;

-- ============================================================================
-- 2. TABLE DDL DEFINITIONS
-- ============================================================================

-- A. SHOP SETTINGS (ຕັ້ງຄ່າຮ້ານຄ້າ, ໃບບິນ, WI-FI & ເຄື່ອງພິມ)
CREATE TABLE shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'QuickOne Roastery & Cafe',
    name_en VARCHAR(255) DEFAULT 'QuickOne Roastery & Cafe',
    branch VARCHAR(255) NOT NULL DEFAULT 'ສາຂາ ປາກຊອງ (Paksong Main Branch)',
    phone VARCHAR(50) NOT NULL DEFAULT '020 55257555',
    address TEXT DEFAULT 'ບ້ານ ຫຼັກ 35, ເມືອງ ປາກຊອງ, ແຂວງ ຈຳປາສັກ',
    tax_code VARCHAR(100) DEFAULT '0102030405',
    wifi_ssid VARCHAR(100) NOT NULL DEFAULT 'QuickOne_Cafe',
    wifi_password VARCHAR(100) NOT NULL DEFAULT '88888888',
    currency VARCHAR(10) NOT NULL DEFAULT 'LAK',
    printer_config JSONB DEFAULT '{
        "paper_size": "80mm",
        "auto_cut": true,
        "open_cash_drawer": true,
        "sticker_width_mm": 50,
        "sticker_height_mm": 30
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. CATEGORIES (ໝວດໝູ່ເຄື່ອງດື່ມ & ເບເກີຣີ)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    item_type VARCHAR(50) DEFAULT 'beverage', -- 'beverage' (Đồ uống) | 'bakery' (Bánh ngọt / Đồ ăn)
    icon VARCHAR(100) DEFAULT 'Coffee',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. MENU ITEMS (ລາຍການເຄື່ອງດື່ມ, ກາເຟ & ເບເກີຣີ)
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    item_type VARCHAR(50) DEFAULT 'beverage', -- 'beverage' | 'bakery'
    image_url TEXT,
    base_price BIGINT NOT NULL DEFAULT 0,
    has_variants BOOLEAN DEFAULT TRUE,
    available_temps TEXT[] DEFAULT ARRAY['hot', 'iced', 'frappe'],
    price_hot BIGINT DEFAULT 25000,
    price_iced BIGINT DEFAULT 28000,
    price_frappe BIGINT DEFAULT 32000,
    available_sizes JSONB DEFAULT '[
        {"code": "M", "name": "Size M (ປົກກະຕິ)", "price_delta": 0},
        {"code": "L", "name": "Size L (ຈອກໃຫຍ່)", "price_delta": 5000}
    ]'::jsonb,
    pricing_matrix JSONB,
    allows_reheat BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE, -- 86-ed toggle (ໝົດຊົ່ວຄາວ)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. TOPPINGS (ທ໊ອບປິ້ງເຄື່ອງດື່ມ)
CREATE TABLE toppings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    price BIGINT NOT NULL DEFAULT 5000,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. DINING TABLES (ໂຕະນັ່ງໃນຮ້ານ & ສວນ)
CREATE TABLE dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_code VARCHAR(50) UNIQUE NOT NULL,
    zone VARCHAR(100) NOT NULL DEFAULT 'ໃນຮ້ານ (Indoor)',
    seats INT NOT NULL DEFAULT 4,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
    current_order_id UUID,
    seated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. CASHIER SHIFTS (ກະຂາຍເຄື່ອງ & ປິດກະ BLIND CLOSE 8 ເມັ່ນລາຄາກີບ)
CREATE TABLE cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_name VARCHAR(255) NOT NULL DEFAULT 'ບາຣິສຕ້າ (Barista)',
    opening_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closing_time TIMESTAMPTZ,
    opening_cash BIGINT NOT NULL DEFAULT 500000,
    expected_closing_cash BIGINT,
    actual_closing_cash BIGINT,
    discrepancy BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'closed'
    denomination_counts JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure strictly ONLY 1 shift can be 'open' at any given time
CREATE UNIQUE INDEX idx_single_open_shift ON cashier_shifts (status) WHERE status = 'open';

-- G. ORDERS (ອໍເດີ & ບິນຂາຍ)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    queue_number INT NOT NULL DEFAULT 1, -- ຄິວທີ 1 - 99
    order_type VARCHAR(50) NOT NULL DEFAULT 'dine_in', -- 'dine_in', 'takeaway', 'delivery'
    table_id UUID REFERENCES dining_tables(id) ON DELETE SET NULL,
    buzzer_number VARCHAR(50), -- ເບີເຄື່ອງສັ່ນ / Thẻ rung
    subtotal BIGINT NOT NULL DEFAULT 0,
    discount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash', -- 'cash', 'lao_qr', 'mixed'
    cash_received BIGINT DEFAULT 0,
    change_amount BIGINT DEFAULT 0,
    order_status VARCHAR(50) NOT NULL DEFAULT 'preparing', -- 'preparing', 'ready', 'completed', 'cancelled'
    shift_id UUID REFERENCES cashier_shifts(id) ON DELETE SET NULL,
    cashier_name VARCHAR(255) NOT NULL DEFAULT 'ບາຣິສຕ້າ (Barista)',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- H. ORDER ITEMS (ລາຍການແກ້ວນ້ຳໃນອໍເດີ ພ້ອມສູດຊົງ)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL DEFAULT 0,
    total_price BIGINT NOT NULL DEFAULT 0,
    temperature VARCHAR(50) DEFAULT 'ເຢັນ', -- 'ຮ້ອນ', 'ເຢັນ', 'ປັ່ນ'
    size VARCHAR(20) DEFAULT 'M', -- 'S', 'M', 'L'
    sweetness VARCHAR(20) DEFAULT '100%', -- '0%', '25%', '50%', '100%', '120%'
    ice_level VARCHAR(50) DEFAULT 'ປົກກະຕິ', -- 'ປົກກະຕິ', 'ນ້ຳກ້ອນໜ້ອຍ', 'ບໍ່ໃສ່ນ້ຳກ້ອນ', 'ແຍກນ້ຳກ້ອນ'
    selected_toppings JSONB DEFAULT '[]'::jsonb,
    item_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE POS QUERIES
-- ============================================================================
CREATE INDEX idx_menu_items_category ON menu_items (category_id);
CREATE INDEX idx_menu_items_available ON menu_items (is_available);
CREATE INDEX idx_orders_status ON orders (order_status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_shift ON orders (shift_id);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_dining_tables_status ON dining_tables (status);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all users (anon & authenticated) in local POS environment
CREATE POLICY "Allow public read on shop_settings" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write on shop_settings" ON shop_settings FOR ALL USING (true);

CREATE POLICY "Allow public read on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public write on categories" ON categories FOR ALL USING (true);

CREATE POLICY "Allow public read on menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public write on menu_items" ON menu_items FOR ALL USING (true);

CREATE POLICY "Allow public read on toppings" ON toppings FOR SELECT USING (true);
CREATE POLICY "Allow public write on toppings" ON toppings FOR ALL USING (true);

CREATE POLICY "Allow public read on dining_tables" ON dining_tables FOR SELECT USING (true);
CREATE POLICY "Allow public write on dining_tables" ON dining_tables FOR ALL USING (true);

CREATE POLICY "Allow public read on cashier_shifts" ON cashier_shifts FOR SELECT USING (true);
CREATE POLICY "Allow public write on cashier_shifts" ON cashier_shifts FOR ALL USING (true);

CREATE POLICY "Allow public read on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public write on orders" ON orders FOR ALL USING (true);

CREATE POLICY "Allow public read on order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public write on order_items" ON order_items FOR ALL USING (true);

-- ============================================================================
-- 5. REALTIME PUBLICATION SETUP
-- ============================================================================
-- Note: Add tables to realtime publication for instant KDS & Table updates
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE dining_tables;
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE cashier_shifts;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- ============================================================================
-- 6. SEED DATA - REALISTIC SPECIALTY CAFE & BAKERY MENU (LAOS)
-- ============================================================================

-- A. SHOP SETTINGS
INSERT INTO shop_settings (id, name, name_en, branch, phone, address, tax_code, wifi_ssid, wifi_password, currency)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'QuickOne Roastery & Cafe',
    'QuickOne Specialty Coffee & Bakery',
    'ສາຂາ ປາກຊອງ (Paksong Highland)',
    '020 55257555',
    'ຖະໜົນໃຫຍ່ສາຍ 16, ເມືອງ ປາກຊອງ, ແຂວງ ຈຳປາສັກ',
    '0102030405',
    'QuickOne_Cafe',
    '88888888',
    'LAK'
);

-- B. CATEGORIES
INSERT INTO categories (id, name, name_en, item_type, icon, sort_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'ກາເຟສົດ (Espresso & Coffee)', 'Specialty Coffee', 'beverage', 'Coffee', 1, true),
('c0000000-0000-0000-0000-000000000002', 'ຊານົມ & ຊາໝາກໄມ້ (Tea & Milk Tea)', 'Craft Tea & Milk Tea', 'beverage', 'CupSoda', 2, true),
('c0000000-0000-0000-0000-000000000003', 'ມັດຊະ & ໂກໂກ້ (Matcha & Cocoa)', 'Pure Matcha & Rich Cocoa', 'beverage', 'Sparkles', 3, true),
('c0000000-0000-0000-0000-000000000004', 'ເຄື່ອງດື່ມປັ່ນ (Frappe & Ice)', 'Ice Blended & Smoothie', 'beverage', 'IceCream', 4, true),
('c0000000-0000-0000-0000-000000000005', 'ເບເກີຣີ & ເຂົ້າໜົມ (Bakery & Pastry)', 'Fresh Bakery & Croissant', 'bakery', 'Cake', 5, true);

-- C. MENU ITEMS (IDs: b0000000-0000-0000-0000-000000000001 to b0000000-0000-0000-0000-000000000016)
INSERT INTO menu_items (id, category_id, name, name_en, image_url, base_price, has_variants, available_temps, price_hot, price_iced, price_frappe, available_sizes, is_available) VALUES
-- Specialty Coffee
(
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'ເອສເປຣສໂຊ່ (Espresso)',
    'Single / Double Espresso',
    'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    22000,
    true,
    ARRAY['hot', 'iced'],
    22000,
    25000,
    0,
    '[{"code": "S", "name": "Single Shot (12oz)", "price": 20000}, {"code": "M", "name": "Double Shot (16oz)", "price": 22000, "is_default": true}, {"code": "L", "name": "Triple Shot (22oz)", "price": 30000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'ອາເມຣິກາໂນ່ (Americano)',
    'Caffe Americano (Arabica Paksong)',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    25000,
    true,
    ARRAY['hot', 'iced'],
    25000,
    28000,
    0,
    '[{"code": "S", "name": "Size S (12oz)", "price": 22000}, {"code": "M", "name": "Size M (16oz)", "price": 25000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 35000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'ຄາປູຊິໂນ່ (Cappuccino)',
    'Creamy Milk Foam Cappuccino',
    'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    28000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    28000,
    32000,
    36000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 25000}, {"code": "M", "name": "Size M (16oz)", "price": 28000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 38000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'ລາເຕ້ (Caffe Latte)',
    'Velvety Smooth Latte',
    'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
    28000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    28000,
    32000,
    36000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 25000}, {"code": "M", "name": "Size M (16oz)", "price": 28000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 38000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'ຄາຣາເມວ ມັກຄີອາໂຕ້ (Caramel Macchiato)',
    'Vanilla & Caramel Drizzle Macchiato',
    'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    32000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    32000,
    35000,
    39000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 28000}, {"code": "M", "name": "Size M (16oz)", "price": 32000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 42000}]'::jsonb,
    true
),

-- Tea & Milk Tea
(
    'b0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'ຊານົມໄຕ້ຫວັນ (Taiwan Milk Tea)',
    'Classic Taiwan Milk Tea',
    'https://images.unsplash.com/photo-1558857563-b37cf5a8820f?auto=format&fit=crop&w=600&q=80',
    25000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    25000,
    28000,
    32000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 22000}, {"code": "M", "name": "Size M (16oz)", "price": 25000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 35000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'ຊາໄທນົມສົດ (Thai Milk Tea)',
    'Authentic Golden Ceylon Thai Tea',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    25000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    25000,
    28000,
    32000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 22000}, {"code": "M", "name": "Size M (16oz)", "price": 25000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 35000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'ຊາໝາກກ້ຽງ & ໝາກນາວ (Orange Lemon Tea)',
    'Fresh Fruit Citrus Jasmine Tea',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    28000,
    true,
    ARRAY['iced'],
    0,
    28000,
    0,
    '[{"code": "S", "name": "Size S (12oz)", "price": 25000}, {"code": "M", "name": "Size M (16oz)", "price": 28000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 38000}]'::jsonb,
    true
),

-- Matcha & Cocoa
(
    'b0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000003',
    'ອູຈິ ມັດຊະລາເຕ້ (Uji Matcha Latte)',
    '100% Ceremonial Grade Kyoto Uji Matcha',
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    35000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    35000,
    38000,
    42000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 30000}, {"code": "M", "name": "Size M (16oz)", "price": 35000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 45000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000003',
    'ຊັອກໂກແລັດດາກເຂັ້ມຂຸ້ນ (Dark Cocoa Latte)',
    'Belgian Dark Chocolate 70%',
    'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
    30000,
    true,
    ARRAY['hot', 'iced', 'frappe'],
    30000,
    34000,
    38000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 25000}, {"code": "M", "name": "Size M (16oz)", "price": 30000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 40000}]'::jsonb,
    true
),

-- Frappe & Ice
(
    'b0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000004',
    'ສະຕໍເບີຣີ ໂຢເກິດປັ່ນ (Strawberry Yogurt Frappe)',
    'Real Strawberry & Creamy Greek Yogurt',
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    35000,
    true,
    ARRAY['frappe'],
    0,
    0,
    35000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 30000}, {"code": "M", "name": "Size M (16oz)", "price": 35000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 45000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000004',
    'ໝາກມ່ວງເສົາວະລົດປັ່ນ (Mango Passion Smoothie)',
    'Tropical Mango & Fresh Passionfruit',
    'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80',
    32000,
    true,
    ARRAY['frappe'],
    0,
    0,
    32000,
    '[{"code": "S", "name": "Size S (12oz)", "price": 28000}, {"code": "M", "name": "Size M (16oz)", "price": 32000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 42000}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000001',
    'ອາເມຣິກາໂນ່ນ້ຳໝາກພ້າວ (Coconut Americano)',
    'Fresh Coconut Water Americano',
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    32000,
    true,
    ARRAY['iced'],
    0,
    32000,
    0,
    '[{"code": "S", "name": "Size S (12oz)", "price": 28000}, {"code": "M", "name": "Size M (16oz)", "price": 32000, "is_default": true}, {"code": "L", "name": "Size L (22oz)", "price": 42000}]'::jsonb,
    true
),

-- Bakery & Pastry
(
    'b0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000005',
    'ຄົວຊອງເນີຍສົດຝຣັ່ງ (Butter Croissant)',
    'AOP French Butter Flaky Croissant',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    25000,
    false,
    ARRAY['hot'],
    25000,
    25000,
    0,
    '[{"code": "M", "name": "1 ຊິ້ນ (Piece)", "price_delta": 0}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000005',
    'ຄົວຊອງອັລມອນ (Almond Croissant)',
    'Double Baked Almond Cream Croissant',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    32000,
    false,
    ARRAY['hot'],
    32000,
    32000,
    0,
    '[{"code": "M", "name": "1 ຊິ້ນ", "price_delta": 0}]'::jsonb,
    true
),
(
    'b0000000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000005',
    'ບາສກ໌ຊີສເຄັກ (Basque Burnt Cheesecake)',
    'Creamy Center Burnt Cheesecake',
    'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    38000,
    false,
    ARRAY['iced'],
    0,
    38000,
    0,
    '[{"code": "M", "name": "1 ຊິ້ນ", "price_delta": 0}]'::jsonb,
    true
);

-- D. TOPPINGS (IDs: e0000000-0000-0000-0000-000000000001 to e0000000-0000-0000-0000-000000000008)
INSERT INTO toppings (id, name, name_en, price, is_available) VALUES
('e0000000-0000-0000-0000-000000000001', 'ໄຂ່ມຸກບຣາວຊູກ້າ', 'Brown Sugar Boba', 5000, true),
('e0000000-0000-0000-0000-000000000002', 'ເພີ່ມຊັອດກາເຟ (Espresso Shot)', 'Extra Espresso Shot', 7000, true),
('e0000000-0000-0000-0000-000000000003', 'ວິບຄຣີມ (Whipped Cream)', 'Vanilla Whipped Cream', 6000, true),
('e0000000-0000-0000-0000-000000000004', 'ຊີສໂຟມນຸ່ມ (Cheese Foam)', 'Himalayan Salt Cheese Foam', 8000, true),
('e0000000-0000-0000-0000-000000000005', 'ວຸ້ນໝາກພ້າວ (Coconut Jelly)', 'Tender Coconut Jelly', 5000, true),
('e0000000-0000-0000-0000-000000000006', 'ບຸກບຣາວຊູກ້າ (Konjac Pearl)', 'Crystal Brown Sugar Konjac', 6000, true),
('e0000000-0000-0000-0000-000000000007', 'ຄາຣາເມວຊັອດ (Caramel Drizzle)', 'Salted Caramel Syrup', 5000, true),
('e0000000-0000-0000-0000-000000000008', 'ເມັດແມງລັກ (Chia Seeds)', 'Organic Chia Seeds', 4000, true);

-- E. DINING TABLES (15 TABLES ACROSS INDOOR & GARDEN)
INSERT INTO dining_tables (id, table_code, zone, seats, status, current_order_id, seated_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'T01', 'ໃນຮ້ານ (Indoor)', 4, 'available', null, null),
('d0000000-0000-0000-0000-000000000002', 'T02', 'ໃນຮ້ານ (Indoor)', 4, 'available', null, null),
('d0000000-0000-0000-0000-000000000003', 'T03', 'ໃນຮ້ານ (Indoor)', 4, 'occupied', null, NOW() - INTERVAL '25 minutes'),
('d0000000-0000-0000-0000-000000000004', 'T04', 'ໃນຮ້ານ (Indoor)', 2, 'available', null, null),
('d0000000-0000-0000-0000-000000000005', 'T05', 'ໃນຮ້ານ (Indoor)', 2, 'available', null, null),
('d0000000-0000-0000-0000-000000000006', 'T06', 'ໃນຮ້ານ (Indoor)', 6, 'available', null, null),
('d0000000-0000-0000-0000-000000000007', 'T07', 'ໃນຮ້ານ (Indoor)', 4, 'available', null, null),
('d0000000-0000-0000-0000-000000000008', 'T08', 'ໃນຮ້ານ (Indoor)', 4, 'available', null, null),
('d0000000-0000-0000-0000-000000000009', 'T09', 'ສວນ (Garden)', 4, 'available', null, null),
('d0000000-0000-0000-0000-000000000010', 'T10', 'ສວນ (Garden)', 4, 'occupied', null, NOW() - INTERVAL '15 minutes'),
('d0000000-0000-0000-0000-000000000011', 'T11', 'ສວນ (Garden)', 2, 'available', null, null),
('d0000000-0000-0000-0000-000000000012', 'T12', 'ສວນ (Garden)', 2, 'available', null, null),
('d0000000-0000-0000-0000-000000000013', 'T13', 'ສວນ (Garden)', 6, 'available', null, null),
('d0000000-0000-0000-0000-000000000014', 'T14', 'ສວນ (Garden)', 6, 'available', null, null),
('d0000000-0000-0000-0000-000000000015', 'VIP1', 'ໃນຮ້ານ (Indoor)', 8, 'available', null, null);

-- F. CASHIER SHIFTS (1 ACTIVE OPEN SHIFT READY FOR USE)
INSERT INTO cashier_shifts (id, cashier_name, opening_time, opening_cash, status, notes)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'ບາຣິສຕ້າ (Barista Touk)',
    NOW() - INTERVAL '3 hours',
    500000,
    'open',
    'ເປີດກະເຊົ້າ ເງິນທອນເລີ່ມຕົ້ນ 500.000 ₭'
);

-- G. SAMPLE REAL CAFE ORDERS (WITH QUEUE NUMBERS & FORMULAS)
INSERT INTO orders (id, order_number, queue_number, order_type, table_id, buzzer_number, subtotal, discount, total_amount, payment_method, cash_received, change_amount, order_status, shift_id, cashier_name, note, created_at)
VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'CF-261118-001',
    1,
    'dine_in',
    'd0000000-0000-0000-0000-000000000003',
    '01',
    60000,
    0,
    60000,
    'cash',
    100000,
    40000,
    'completed',
    'f0000000-0000-0000-0000-000000000001',
    'ບາຣິສຕ້າ (Barista Touk)',
    'ກິນທີ່ຮ້ານ ໂຕະ T03',
    NOW() - INTERVAL '50 minutes'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'CF-261118-002',
    2,
    'takeaway',
    null,
    '08',
    69000,
    0,
    69000,
    'lao_qr',
    69000,
    0,
    'ready',
    'f0000000-0000-0000-0000-000000000001',
    'ບາຣິສຕ້າ (Barista Touk)',
    'ສັ່ງກັບບ້ານ ແຍກນ້ຳກ້ອນ',
    NOW() - INTERVAL '15 minutes'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'CF-261118-003',
    3,
    'dine_in',
    'd0000000-0000-0000-0000-000000000010',
    '03',
    44000,
    0,
    44000,
    'cash',
    50000,
    6000,
    'preparing',
    'f0000000-0000-0000-0000-000000000001',
    'ບາຣິສຕ້າ (Barista Touk)',
    'ໂຕະສວນ T10',
    NOW() - INTERVAL '5 minutes'
);

-- H. ORDER ITEMS WITH MODIFIERS
INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, total_price, temperature, size, sweetness, ice_level, selected_toppings, item_note)
VALUES
-- Items for Order 1
(
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'ອາເມຣິກາໂນ່ (Americano)',
    1,
    28000,
    28000,
    'ເຢັນ',
    'M',
    '0%',
    'ປົກກະຕິ',
    '[]'::jsonb,
    'ບໍ່ໃສ່ນ້ຳຕານ'
),
(
    'a1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'ລາເຕ້ (Caffe Latte)',
    1,
    32000,
    32000,
    'ເຢັນ',
    'M',
    '50%',
    'ປົກກະຕິ',
    '[]'::jsonb,
    'ຫວານໜ້ອຍ 50%'
),
-- Items for Order 2
(
    'a1000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000006',
    'ຊານົມໄຕ້ຫວັນ (Taiwan Milk Tea)',
    1,
    33000,
    33000,
    'ເຢັນ',
    'L',
    '50%',
    'ແຍກນ້ຳກ້ອນ',
    '[{"id":"e0000000-0000-0000-0000-000000000001","name":"ໄຂ່ມຸກບຣາວຊູກ້າ","price":5000}]'::jsonb,
    'ແຍກນ້ຳກ້ອນ + ໄຂ່ມຸກ'
),
(
    'a1000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000009',
    'ອູຈິ ມັດຊະລາເຕ້ (Uji Matcha Latte)',
    1,
    36000,
    36000,
    'ເຢັນ',
    'M',
    '25%',
    'ນ້ຳກ້ອນໜ້ອຍ',
    '[]'::jsonb,
    'ຫວານ 25%'
),
-- Items for Order 3
(
    'a1000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000010',
    'ຊັອກໂກແລັດດາກເຂັ້ມຂຸ້ນ (Dark Cocoa Latte)',
    1,
    44000,
    44000,
    'ປັ່ນ',
    'M',
    '100%',
    'ປົກກະຕິ',
    '[{"id":"e0000000-0000-0000-0000-000000000003","name":"ວິບຄຣີມ (Whipped Cream)","price":6000}]'::jsonb,
    'ເພີ່ມວິບຄຣີມ'
);

-- ============================================================================
-- 9. BACKWARDS-COMPATIBLE MIGRATION SNIPPET (FOR EXISTING DATABASES)
-- Execute this section if you already have live data and DO NOT want to drop tables:
-- ============================================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'beverage';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'beverage';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS pricing_matrix JSONB;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allows_reheat BOOLEAN DEFAULT FALSE;
ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS zone VARCHAR(100) DEFAULT 'ໃນຮ້ານ (Indoor)';
ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS seats INT DEFAULT 4;
ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS current_order_id UUID;
ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ;

-- ============================================================================
-- END OF SCHEMA & SEED DATA
-- ============================================================================
