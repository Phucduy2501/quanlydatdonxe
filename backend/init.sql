-- =====================================================
-- TRANSITGO - BUS TICKET BOOKING AND ROUTE MANAGEMENT
-- =====================================================

-- ================= USERS / TÀI KHOẢN =================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'customer',
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- role:
-- admin    : Quản trị viên
-- staff    : Nhân viên
-- driver   : Tài xế
-- customer : Khách hàng


-- ================= CUSTOMERS / HÀNH KHÁCH =================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  birthday DATE,
  gender VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= STAFF / NHÂN VIÊN =================
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  role VARCHAR(100),
  address TEXT,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= DRIVERS / TÀI XẾ =================
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_class VARCHAR(50),
  license_expiry DATE,
  status VARCHAR(30) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= BUS TYPES / LOẠI XE =================
CREATE TABLE IF NOT EXISTS bus_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= BUSES / XE BUÝT =================
CREATE TABLE IF NOT EXISTS buses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  bus_type_id INTEGER REFERENCES bus_types(id) ON DELETE SET NULL,
  seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  manufacture_year INTEGER,
  status VARCHAR(30) DEFAULT 'available',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- status:
-- available   : Sẵn sàng
-- operating   : Đang hoạt động
-- maintenance : Đang bảo trì
-- inactive    : Ngừng hoạt động


-- ================= BUS SEATS / GHẾ XE =================
CREATE TABLE IF NOT EXISTS bus_seats (
  id SERIAL PRIMARY KEY,
  bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  seat_number VARCHAR(20) NOT NULL,
  seat_type VARCHAR(50) DEFAULT 'normal',
  floor_number INTEGER DEFAULT 1,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (bus_id, seat_number)
);


-- ================= STATIONS / BẾN XE =================
CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  province VARCHAR(100),
  district VARCHAR(100),
  ward VARCHAR(100),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= BUS STOPS / TRẠM DỪNG =================
CREATE TABLE IF NOT EXISTS bus_stops (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= ROUTES / TUYẾN ĐƯỜNG =================
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  departure_station_id INTEGER
    REFERENCES stations(id) ON DELETE SET NULL,
  arrival_station_id INTEGER
    REFERENCES stations(id) ON DELETE SET NULL,
  distance NUMERIC(10, 2) DEFAULT 0,
  estimated_duration INTEGER DEFAULT 0,
  base_price NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= ROUTE STOPS / ĐIỂM DỪNG CỦA TUYẾN =================
CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id INTEGER NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  estimated_arrival_minutes INTEGER DEFAULT 0,
  pickup_allowed BOOLEAN DEFAULT TRUE,
  dropoff_allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (route_id, stop_order),
  UNIQUE (route_id, stop_id)
);


-- ================= TRIPS / CHUYẾN XE =================
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id INTEGER REFERENCES buses(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP,
  ticket_price NUMERIC(12, 2) DEFAULT 0,
  available_seats INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'scheduled',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- status:
-- scheduled : Đã lên lịch
-- boarding  : Đang đón khách
-- running   : Đang chạy
-- completed : Hoàn thành
-- cancelled : Đã hủy
-- delayed   : Bị trễ


-- ================= BOOKINGS / ĐẶT VÉ =================
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_code VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_phone VARCHAR(50) NOT NULL,
  passenger_email VARCHAR(255),
  total_amount NUMERIC(12, 2) DEFAULT 0,
  booking_status VARCHAR(30) DEFAULT 'pending',
  payment_status VARCHAR(30) DEFAULT 'unpaid',
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- booking_status:
-- pending   : Chờ xác nhận
-- confirmed : Đã xác nhận
-- completed : Đã sử dụng
-- cancelled : Đã hủy

-- payment_status:
-- unpaid  : Chưa thanh toán
-- paid    : Đã thanh toán
-- refunded: Đã hoàn tiền


-- ================= TICKETS / VÉ XE =================
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_code VARCHAR(100) UNIQUE NOT NULL,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seat_id INTEGER REFERENCES bus_seats(id) ON DELETE SET NULL,
  pickup_stop_id INTEGER REFERENCES bus_stops(id) ON DELETE SET NULL,
  dropoff_stop_id INTEGER REFERENCES bus_stops(id) ON DELETE SET NULL,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_phone VARCHAR(50),
  price NUMERIC(12, 2) DEFAULT 0,
  qr_code TEXT,
  ticket_status VARCHAR(30) DEFAULT 'valid',
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (trip_id, seat_id)
);

-- ticket_status:
-- valid     : Vé hợp lệ
-- used      : Đã sử dụng
-- cancelled : Đã hủy
-- refunded  : Đã hoàn tiền


-- ================= PAYMENTS / THANH TOÁN =================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_code VARCHAR(255) UNIQUE,
  payment_method VARCHAR(50) DEFAULT 'cash',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(30) DEFAULT 'pending',
  paid_at TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- payment_method:
-- cash
-- bank_transfer
-- momo
-- vnpay
-- zalopay

-- payment_status:
-- pending
-- success
-- failed
-- refunded


-- ================= REVIEWS / ĐÁNH GIÁ =================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status VARCHAR(30) DEFAULT 'visible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= NOTIFICATIONS / THÔNG BÁO =================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= MAINTENANCE / BẢO TRÌ XE =================
CREATE TABLE IF NOT EXISTS bus_maintenance (
  id SERIAL PRIMARY KEY,
  bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maintenance_type VARCHAR(100),
  cost NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  next_maintenance_date DATE,
  status VARCHAR(30) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= TRIP LOCATIONS / VỊ TRÍ XE =================
CREATE TABLE IF NOT EXISTS trip_locations (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  speed NUMERIC(10, 2) DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================= SYSTEM SETTINGS / CẤU HÌNH =================
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= BOOKINGS / ĐẶT VÉ =================
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_code VARCHAR(100),
  passenger_name VARCHAR(255),
  passenger_phone VARCHAR(50),
  passenger_email VARCHAR(255),
  trip_id INTEGER,
  trip_code VARCHAR(100),
  route_name VARCHAR(255),
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  debt_amount NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= TICKETS / VÉ XE =================
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_code VARCHAR(100),
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_name VARCHAR(255),
  passenger_phone VARCHAR(50),
  trip_id INTEGER,
  trip_code VARCHAR(100),
  seat_number VARCHAR(50),
  price NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= PAYMENTS / THANH TOÁN =================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_code VARCHAR(100),
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  booking_code VARCHAR(100),
  passenger_name VARCHAR(255),
  amount NUMERIC DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash',
  status VARCHAR(50) DEFAULT 'paid',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_routes_status
ON routes(status);

CREATE INDEX IF NOT EXISTS idx_trips_route
ON trips(route_id);

CREATE INDEX IF NOT EXISTS idx_trips_departure_time
ON trips(departure_time);

CREATE INDEX IF NOT EXISTS idx_trips_status
ON trips(status);

CREATE INDEX IF NOT EXISTS idx_bookings_customer
ON bookings(customer_id);

CREATE INDEX IF NOT EXISTS idx_bookings_trip
ON bookings(trip_id);

CREATE INDEX IF NOT EXISTS idx_bookings_code
ON bookings(booking_code);

CREATE INDEX IF NOT EXISTS idx_tickets_trip
ON tickets(trip_id);

CREATE INDEX IF NOT EXISTS idx_tickets_code
ON tickets(ticket_code);

CREATE INDEX IF NOT EXISTS idx_payments_booking
ON payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_trip_locations_trip
ON trip_locations(trip_id);


-- =====================================================
-- DEFAULT ADMIN ACCOUNT
-- Mật khẩu cần được mã hóa bằng bcrypt từ backend
-- =====================================================

INSERT INTO users (
  email,
  password,
  name,
  phone,
  role,
  status
)
VALUES (
  'admin@transitgo.com',
  '$2b$10$REPLACE_WITH_BCRYPT_HASH',
  'TransitGo Administrator',
  '0123456789',
  'admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;