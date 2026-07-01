-- KNOX Shop Database Setup for Supabase
-- Run this in Supabase SQL Editor

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT DEFAULT '',
  zalo TEXT DEFAULT '',
  balance BIGINT DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  total_deposited BIGINT DEFAULT 0,
  vip_level TEXT DEFAULT 'NEW',
  referral_code TEXT UNIQUE,
  referred_by TEXT DEFAULT '',
  is_locked BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  last_ip TEXT DEFAULT '',
  last_device TEXT DEFAULT '',
  deposit_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  service TEXT NOT NULL,
  payment TEXT DEFAULT 'wallet',
  note TEXT DEFAULT '',
  price BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  progress INT DEFAULT 0,
  download_link TEXT DEFAULT '',
  rating INT DEFAULT 0,
  game_username TEXT DEFAULT '',
  game_password TEXT DEFAULT '',
  reject_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id BIGSERIAL PRIMARY KEY,
  deposit_code TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  amount BIGINT NOT NULL,
  method TEXT DEFAULT 'VCB',
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Card deposits table
CREATE TABLE IF NOT EXISTS card_deposits (
  id BIGSERIAL PRIMARY KEY,
  card_code TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  telco TEXT NOT NULL,
  serial TEXT NOT NULL,
  code TEXT NOT NULL,
  amount BIGINT NOT NULL,
  actual_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  price BIGINT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Hot deals table
CREATE TABLE IF NOT EXISTS hot_deals (
  id BIGSERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  original_price BIGINT NOT NULL,
  discount_percent INT NOT NULL,
  description TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INT NOT NULL,
  max_uses INT DEFAULT 100,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  service TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_code TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_reply TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Login history table
CREATE TABLE IF NOT EXISTS login_history (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  ip TEXT DEFAULT '',
  device TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  target TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default vouchers
INSERT INTO vouchers (code, discount_percent, max_uses) VALUES
  ('KNOX10', 10, 100),
  ('KNOX20', 20, 100),
  ('NEWUSER', 15, 100)
ON CONFLICT (code) DO NOTHING;

-- Insert default script
INSERT INTO scripts (name, game, price) VALUES
  ('Sniper Arena', 'Roblox', 15000)
ON CONFLICT DO NOTHING;

-- Disable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON users;
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON orders;
CREATE POLICY "Allow all" ON orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON deposits;
CREATE POLICY "Allow all" ON deposits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE card_deposits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON card_deposits;
CREATE POLICY "Allow all" ON card_deposits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON scripts;
CREATE POLICY "Allow all" ON scripts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE hot_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON hot_deals;
CREATE POLICY "Allow all" ON hot_deals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON vouchers;
CREATE POLICY "Allow all" ON vouchers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON reviews;
CREATE POLICY "Allow all" ON reviews FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON tickets;
CREATE POLICY "Allow all" ON tickets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON notifications;
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON login_history;
CREATE POLICY "Allow all" ON login_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON broadcasts;
CREATE POLICY "Allow all" ON broadcasts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON admin_logs;
CREATE POLICY "Allow all" ON admin_logs FOR ALL USING (true) WITH CHECK (true);
