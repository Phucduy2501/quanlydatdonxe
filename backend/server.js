const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "transitgo_secret_key";

// ================= TEST SERVER =================

app.get("/", (req, res) => {
    res.status(200).send("TransitGo Backend OK");
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Backend đang chạy",
        time: new Date().toISOString(),
    });
});

// ================= AUTH MIDDLEWARE =================
// LOCAL DEV: đang cho qua token để dễ test.
// Deploy thật thì bật kiểm tra JWT lại.
function authMiddleware(req, res, next) {
    req.user = {
        id: 1,
        email: "admin@transitgo.com",
        name: "Admin",
        role: "admin",
    };

    return next();
}

// ================= MODULE → TABLE =================

const tableMap = {
    users: "users",

    customers: "customers",
    customerGroups: "customer_groups",
    staff: "staff",
    drivers: "drivers",

    busTypes: "bus_types",
    buses: "buses",
    busSeats: "bus_seats",

    stations: "stations",
    busStops: "bus_stops",
    routes: "routes",
    routeStops: "route_stops",

    trips: "trips",
    bookings: "bookings",
    tickets: "tickets",
    payments: "payments",

    reviews: "reviews",
    notifications: "notifications",
    maintenance: "bus_maintenance",
    tripLocations: "trip_locations",
    settings: "system_settings",
};

function getTable(module) {
    return tableMap[module];
}

// ================= HELPERS =================

function camelToSnake(str) {
    return str.replace(/[A-Z]/g, function(letter) {
        return "_" + letter.toLowerCase();
    });
}

function normalizeBody(body = {}) {
    const result = {};

    Object.keys(body || {}).forEach(function(key) {
        result[camelToSnake(key)] = body[key];
    });

    return result;
}

function cleanBody(body = {}) {
    const normalized = normalizeBody(body);

    delete normalized.id;
    delete normalized.created_at;
    delete normalized.updated_at;
    delete normalized.createdAt;
    delete normalized.updatedAt;

    return normalized;
}

function createCode(prefix) {
    const time = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);

    return `${prefix}${time}${random}`;
}

function sendServerError(res, label, error) {
    console.error(label, error);

    return res.status(500).json({
        message: label,
        error: error.message,
    });
}

function q(table) {
    return `"${table}"`;
}

async function getTableColumns(table) {
    const result = await pool.query(
        `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `, [table]
    );

    return result.rows.map(function(row) {
        return row.column_name;
    });
}

async function buildInsertQuery(table, data) {
    const body = cleanBody(data);
    const tableColumns = await getTableColumns(table);

    const keys = Object.keys(body).filter(function(key) {
        return tableColumns.includes(key);
    });

    if (keys.length === 0) {
        throw new Error("Không có cột hợp lệ để thêm dữ liệu");
    }

    const columns = keys
        .map(function(key) {
            return `"${key}"`;
        })
        .join(", ");

    const placeholders = keys
        .map(function(_, index) {
            return `$${index + 1}`;
        })
        .join(", ");

    const values = keys.map(function(key) {
        return body[key];
    });

    return {
        text: `
      INSERT INTO ${q(table)}
      (${columns})
      VALUES (${placeholders})
      RETURNING *
    `,
        values,
    };
}

async function buildUpdateQuery(table, id, data) {
    const body = cleanBody(data);
    const tableColumns = await getTableColumns(table);

    const keys = Object.keys(body).filter(function(key) {
        return tableColumns.includes(key);
    });

    if (keys.length === 0) {
        throw new Error("Không có cột hợp lệ để cập nhật");
    }

    const setSql = keys
        .map(function(key, index) {
            return `"${key}" = $${index + 1}`;
        })
        .join(", ");

    const values = keys.map(function(key) {
        return body[key];
    });

    values.push(id);

    const hasUpdatedAt = tableColumns.includes("updated_at");

    return {
        text: `
      UPDATE ${q(table)}
      SET
        ${setSql}
        ${hasUpdatedAt ? ", updated_at = CURRENT_TIMESTAMP" : ""}
      WHERE id = $${values.length}
      RETURNING *
    `,
        values,
    };
}

// ================= NORMALIZE ROUTES =================

function getDurationMinutes(value) {
    const text = String(value || "").trim().toLowerCase();

    if (!text) return 0;

    const number = Number(text.replace(/[^\d.]/g, ""));

    if (Number.isNaN(number)) return 0;

    if (text.includes("giờ") || text.includes("h")) {
        return Math.round(number * 60);
    }

    return Math.round(number);
}

function normalizeRoutePayload(rawBody = {}) {
    const body = normalizeBody(rawBody || {});

    const routeCode = body.route_code || body.code || createCode("RT");

    const routeName = body.name || body.route_name || "";

    const startPoint =
        body.start_point ||
        body.from_location ||
        body.departure_station_name ||
        body.start_location ||
        body.start ||
        "";

    const endPoint =
        body.end_point ||
        body.to_location ||
        body.arrival_station_name ||
        body.end_location ||
        body.end ||
        "";

    const distanceKm = Number(body.distance_km || body.distance || 0);

    const estimatedTime =
        body.estimated_time ||
        body.estimated_duration ||
        body.duration ||
        body.travel_time ||
        "";

    const durationMinutes =
        Number(body.duration_minutes || body.duration_minute || 0) ||
        getDurationMinutes(estimatedTime);

    return {
        code: routeCode,
        route_code: routeCode,

        name: routeName,
        route_name: routeName,

        start_point: startPoint,
        end_point: endPoint,

        from_location: startPoint,
        to_location: endPoint,

        departure_station_name: startPoint,
        arrival_station_name: endPoint,

        distance_km: distanceKm,
        distance: distanceKm,

        estimated_time: estimatedTime,
        estimated_duration: estimatedTime,
        duration: estimatedTime,
        duration_minutes: durationMinutes,

        status: body.status || "active",
        note: body.note || "",
    };
}

// ================= INIT LOCAL COLUMNS =================

async function ensureLocalColumns() {
    try {
        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE routes ADD COLUMN IF NOT EXISTS code VARCHAR(100);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_code VARCHAR(100);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_name VARCHAR(255);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS name VARCHAR(255);

      ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_point VARCHAR(255);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_point VARCHAR(255);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS from_location VARCHAR(255);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS to_location VARCHAR(255);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS departure_station_name VARCHAR(255);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS arrival_station_name VARCHAR(255);

      ALTER TABLE routes ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

      ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance NUMERIC DEFAULT 0;
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance_km NUMERIC DEFAULT 0;

      ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(100);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(100);

      ALTER TABLE routes ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'routes'
            AND column_name = 'code'
        ) THEN
          ALTER TABLE routes ALTER COLUMN code DROP NOT NULL;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'routes'
            AND column_name = 'departure_station_id'
        ) THEN
          ALTER TABLE routes ALTER COLUMN departure_station_id DROP NOT NULL;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'routes'
            AND column_name = 'arrival_station_id'
        ) THEN
          ALTER TABLE routes ALTER COLUMN arrival_station_id DROP NOT NULL;
        END IF;
      END $$;

      ALTER TABLE buses ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50);
      ALTER TABLE buses ADD COLUMN IF NOT EXISTS seat_count INTEGER DEFAULT 0;
      ALTER TABLE buses ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
      ALTER TABLE buses ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE buses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE buses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE bus_types ADD COLUMN IF NOT EXISTS seat_count INTEGER DEFAULT 0;
      ALTER TABLE bus_types ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE bus_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE bus_seats ADD COLUMN IF NOT EXISTS seat_type VARCHAR(50) DEFAULT 'normal';
      ALTER TABLE bus_seats ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
      ALTER TABLE bus_seats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS province VARCHAR(100);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS district VARCHAR(100);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE stations ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE stations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE bus_stops ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE bus_stops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_code VARCHAR(100);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS route_name VARCHAR(255);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS bus_name VARCHAR(255);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 0;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS booked_seats INTEGER DEFAULT 0;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled';
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(100);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_name VARCHAR(255);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_phone VARCHAR(50);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_email VARCHAR(255);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_code VARCHAR(100);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS route_name VARCHAR(255);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS debt_amount NUMERIC DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(100);
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_name VARCHAR(255);
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_phone VARCHAR(50);
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS trip_code VARCHAR(100);
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_number VARCHAR(50);
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_code VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_code VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS passenger_name VARCHAR(255);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'paid';
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS content TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unread';
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

        console.log("Đã kiểm tra/bổ sung cột local");
    } catch (error) {
        console.log("Lỗi bổ sung cột local:", error.message);
    }
}

// ================= LOGIN API =================

app.post("/api/auth/login", async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Vui lòng nhập email và mật khẩu",
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        let result = await pool.query("SELECT * FROM users WHERE email = $1", [
            normalizedEmail,
        ]);

        if (result.rows.length === 0 && normalizedEmail === "admin@transitgo.com") {
            const hashedPassword = await bcrypt.hash("123456", 10);

            await pool.query(
                `
        INSERT INTO users
        (
          email,
          password,
          name,
          role,
          status
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        `, [
                    "admin@transitgo.com",
                    hashedPassword,
                    "TransitGo Administrator",
                    "admin",
                    "active",
                ]
            );

            result = await pool.query("SELECT * FROM users WHERE email = $1", [
                "admin@transitgo.com",
            ]);
        }

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                message: "Sai tài khoản hoặc mật khẩu",
            });
        }

        if (user.status && user.status !== "active") {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa",
            });
        }

        let isMatch = false;

        if (String(user.password).startsWith("$2")) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = String(user.password) === String(password);
        }

        if (!isMatch) {
            return res.status(401).json({
                message: "Sai tài khoản hoặc mật khẩu",
            });
        }

        const token = jwt.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            JWT_SECRET, {
                expiresIn: "7d",
            }
        );

        return res.json({
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                phone: user.phone,
            },
        });
    } catch (error) {
        return sendServerError(res, "Lỗi server đăng nhập", error);
    }
});

// ================= CURRENT USER =================

app.get("/api/auth/me", authMiddleware, async(req, res) => {
    try {
        const result = await pool.query(
            `
      SELECT
        id,
        email,
        name,
        phone,
        role,
        status,
        created_at
      FROM users
      WHERE id = $1
      `, [req.user.id]
        );

        if (!result.rows[0]) {
            return res.json(req.user);
        }

        return res.json(result.rows[0]);
    } catch (error) {
        return res.json(req.user);
    }
});

// ================= DASHBOARD =================

app.get("/api/dashboard/summary", authMiddleware, async(req, res) => {
    try {
        const [routes, buses, trips, bookings, customers, revenue] =
        await Promise.all([
            pool.query(`SELECT COUNT(*) FROM routes`).catch(() => ({
                rows: [{ count: 0 }],
            })),

            pool.query(`SELECT COUNT(*) FROM buses`).catch(() => ({
                rows: [{ count: 0 }],
            })),

            pool.query(`SELECT COUNT(*) FROM trips`).catch(() => ({
                rows: [{ count: 0 }],
            })),

            pool.query(`SELECT COUNT(*) FROM bookings`).catch(() => ({
                rows: [{ count: 0 }],
            })),

            pool.query(`SELECT COUNT(*) FROM customers`).catch(() => ({
                rows: [{ count: 0 }],
            })),

            pool
            .query(
                `
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM payments
            `
            )
            .catch(() => ({
                rows: [{ total: 0 }],
            })),
        ]);

        return res.json({
            activeRoutes: Number(routes.rows[0].count),
            totalBuses: Number(buses.rows[0].count),
            todayTrips: Number(trips.rows[0].count),
            todayBookings: Number(bookings.rows[0].count),
            totalCustomers: Number(customers.rows[0].count),
            todayRevenue: Number(revenue.rows[0].total),
        });
    } catch (error) {
        return sendServerError(res, "Lỗi lấy dữ liệu tổng quan", error);
    }
});

// ================= TRIP SEARCH =================

app.get("/api/trips/search/available", async(req, res) => {
    try {
        const result = await pool.query(
            `
      SELECT *
      FROM trips
      ORDER BY created_at DESC NULLS LAST, id DESC
      `
        );

        return res.json(result.rows);
    } catch (error) {
        return sendServerError(res, "Lỗi tìm chuyến xe", error);
    }
});

// ================= GET AVAILABLE SEATS =================

app.get("/api/trips/:id/available-seats", async(req, res) => {
    try {
        const tripResult = await pool.query(
            `
      SELECT *
      FROM trips
      WHERE id = $1
      `, [req.params.id]
        );

        const trip = tripResult.rows[0];

        if (!trip) {
            return res.status(404).json({
                message: "Không tìm thấy chuyến xe",
            });
        }

        const seatsResult = await pool.query(
            `
      SELECT *
      FROM bus_seats
      ORDER BY id ASC
      `
        );

        return res.json(seatsResult.rows);
    } catch (error) {
        return sendServerError(res, "Lỗi lấy danh sách ghế", error);
    }
});

// ================= CREATE FULL BOOKING =================

app.post("/api/bookings/create-full", authMiddleware, async(req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            customerId,
            tripId,
            passengerName,
            passengerPhone,
            passengerEmail = "",
            seatIds = [],
            paymentMethod = "cash",
            paidAmount = 0,
            note = "",
        } = req.body;

        // ================= KIỂM TRA DỮ LIỆU =================

        if (!tripId) {
            return res.status(400).json({
                message: "Thiếu mã chuyến xe",
            });
        }

        if (!String(passengerName || "").trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên hành khách",
            });
        }

        if (!String(passengerPhone || "").trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập số điện thoại",
            });
        }

        if (!Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({
                message: "Vui lòng chọn ít nhất một ghế",
            });
        }

        const normalizedName = String(passengerName).trim();
        const normalizedPhone = String(passengerPhone).trim();
        const normalizedEmail = String(passengerEmail || "")
            .trim()
            .toLowerCase();

        // ================= KIỂM TRA CHUYẾN =================

        const tripResult = await client.query(
            `
            SELECT *
            FROM trips
            WHERE id = $1
            LIMIT 1
            `, [Number(tripId)]
        );

        const trip = tripResult.rows[0];

        if (!trip) {
            throw new Error("Chuyến xe không tồn tại");
        }

        // ================= TÌM KHÁCH HÀNG THẬT =================

        let realCustomerId = null;

        // Kiểm tra customerId frontend gửi lên có tồn tại không
        if (customerId && !Number.isNaN(Number(customerId))) {
            const customerById = await client.query(
                `
                SELECT id
                FROM customers
                WHERE id = $1
                LIMIT 1
                `, [Number(customerId)]
            );

            if (customerById.rows.length > 0) {
                realCustomerId = customerById.rows[0].id;
            }
        }

        // Nếu ID không đúng thì tìm theo số điện thoại/email
        if (!realCustomerId) {
            const customerColumns = await getTableColumns("customers");

            const conditions = [];
            const values = [];

            if (
                customerColumns.includes("phone") &&
                normalizedPhone
            ) {
                values.push(normalizedPhone);
                conditions.push(`phone = $${values.length}`);
            }

            if (
                customerColumns.includes("email") &&
                normalizedEmail
            ) {
                values.push(normalizedEmail);
                conditions.push(
                    `LOWER(email) = LOWER($${values.length})`
                );
            }

            if (conditions.length > 0) {
                const existingCustomer = await client.query(
                    `
                    SELECT id
                    FROM customers
                    WHERE ${conditions.join(" OR ")}
                    ORDER BY id ASC
                    LIMIT 1
                    `,
                    values
                );

                if (existingCustomer.rows.length > 0) {
                    realCustomerId =
                        existingCustomer.rows[0].id;
                }
            }
        }

        // ================= TẠO KHÁCH HÀNG NẾU CHƯA CÓ =================

        if (!realCustomerId) {
            const customerColumns =
                await getTableColumns("customers");

            const insertColumns = [];
            const insertValues = [];
            const placeholders = [];

            function addCustomerField(column, value) {
                if (
                    customerColumns.includes(column) &&
                    value !== undefined
                ) {
                    insertColumns.push(`"${column}"`);
                    insertValues.push(value);
                    placeholders.push(
                        `$${insertValues.length}`
                    );
                }
            }

            addCustomerField(
                "customer_code",
                createCode("KH")
            );

            addCustomerField("name", normalizedName);
            addCustomerField("full_name", normalizedName);
            addCustomerField(
                "customer_name",
                normalizedName
            );

            addCustomerField("phone", normalizedPhone);

            if (normalizedEmail) {
                addCustomerField("email", normalizedEmail);
            }

            addCustomerField("status", "active");
            addCustomerField("note", "");

            // Một số database customers có password bắt buộc
            if (customerColumns.includes("password")) {
                const defaultPassword = await bcrypt.hash(
                    "123456",
                    10
                );

                addCustomerField(
                    "password",
                    defaultPassword
                );
            }

            if (insertColumns.length === 0) {
                throw new Error(
                    "Bảng customers không có cột hợp lệ để tạo khách hàng"
                );
            }

            const newCustomerResult = await client.query(
                `
                INSERT INTO customers
                (
                    ${insertColumns.join(", ")}
                )
                VALUES
                (
                    ${placeholders.join(", ")}
                )
                RETURNING id
                `,
                insertValues
            );

            realCustomerId =
                newCustomerResult.rows[0].id;
        }

        // ================= KIỂM TRA GHẾ =================

        const normalizedSeatIds = seatIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0);

        if (normalizedSeatIds.length !== seatIds.length) {
            throw new Error("Danh sách ghế không hợp lệ");
        }

        for (const seatId of normalizedSeatIds) {
            const seatResult = await client.query(
                `
                SELECT *
                FROM bus_seats
                WHERE id = $1
                LIMIT 1
                `, [seatId]
            );

            if (!seatResult.rows[0]) {
                throw new Error(
                    `Không tìm thấy ghế ID ${seatId}`
                );
            }

            const bookedResult = await client.query(
                `
                SELECT id
                FROM tickets
                WHERE trip_id = $1
                  AND seat_id = $2
                  AND COALESCE(ticket_status, 'valid')
                      NOT IN (
                          'cancelled',
                          'canceled',
                          'deleted'
                      )
                LIMIT 1
                `, [Number(tripId), seatId]
            );

            if (bookedResult.rows.length > 0) {
                const seatName =
                    seatResult.rows[0].seat_number ||
                    seatResult.rows[0].name ||
                    seatId;

                throw new Error(
                    `Ghế ${seatName} đã được đặt`
                );
            }
        }

        // ================= TÍNH TIỀN =================

        const seatPrice = Number(trip.price || 0);

        const calculatedTotal =
            seatPrice * normalizedSeatIds.length;

        const totalAmount = Number(
            req.body.totalAmount ||
            req.body.total_amount ||
            calculatedTotal ||
            0
        );

        const amountPaid = Number(paidAmount || 0);

        const bookingCode = createCode("BK");

        // ================= TẠO BOOKING =================

        const bookingResult = await client.query(
            `
            INSERT INTO bookings
            (
                booking_code,
                customer_id,
                trip_id,
                passenger_name,
                passenger_phone,
                passenger_email,
                total_amount,
                paid_amount,
                booking_status,
                payment_status,
                note
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                NULLIF($6, ''),
                $7,
                $8,
                $9,
                $10,
                NULLIF($11, '')
            )
            RETURNING *
            `, [
                bookingCode,
                realCustomerId,
                Number(tripId),
                normalizedName,
                normalizedPhone,
                normalizedEmail,
                totalAmount,
                amountPaid,
                amountPaid >= totalAmount ?
                "confirmed" :
                "pending",
                amountPaid >= totalAmount ?
                "paid" :
                "unpaid",
                String(note || "").trim(),
            ]
        );

        const booking = bookingResult.rows[0];
        const tickets = [];

        // ================= TẠO VÉ =================

        const pricePerSeat =
            normalizedSeatIds.length > 0 ?
            totalAmount /
            normalizedSeatIds.length :
            seatPrice;

        for (const seatId of normalizedSeatIds) {
            const seatResult = await client.query(
                `
                SELECT *
                FROM bus_seats
                WHERE id = $1
                LIMIT 1
                `, [seatId]
            );

            const seat = seatResult.rows[0];
            const ticketCode = createCode("TK");

            const ticketResult = await client.query(
                `
                INSERT INTO tickets
                (
                    ticket_code,
                    booking_id,
                    trip_id,
                    seat_id,
                    passenger_name,
                    passenger_phone,
                    seat_number,
                    price,
                    qr_code,
                    ticket_status
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10
                )
                RETURNING *
                `, [
                    ticketCode,
                    booking.id,
                    Number(tripId),
                    seatId,
                    normalizedName,
                    normalizedPhone,
                    seat.seat_number ||
                    seat.name ||
                    String(seatId),
                    Number(pricePerSeat || 0),
                    ticketCode,
                    "valid",
                ]
            );

            tickets.push(ticketResult.rows[0]);
        }

        // ================= TẠO THANH TOÁN =================

        if (amountPaid > 0) {
            await client.query(
                `
                INSERT INTO payments
                (
                    booking_id,
                    transaction_code,
                    payment_method,
                    amount,
                    payment_status,
                    paid_at,
                    note
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                `, [
                    booking.id,
                    createCode("PM"),
                    paymentMethod,
                    amountPaid,
                    "success",
                    new Date(),
                    `Thanh toán đặt vé ${bookingCode}`,
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Đặt vé thành công",
            data: {
                booking,
                tickets,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Lỗi tạo đặt vé:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Dữ liệu liên kết không tồn tại",
                error: error.detail || error.message,
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Ghế hoặc dữ liệu này đã được sử dụng",
                error: error.detail || error.message,
            });
        }

        if (error.code === "23502") {
            return res.status(400).json({
                message: "Thiếu dữ liệu bắt buộc trong database",
                error: error.detail || error.message,
            });
        }

        return res.status(500).json({
            message: "Lỗi tạo đặt vé",
            error: error.message,
        });
    } finally {
        client.release();
    }
});

// ================= BOOKING DETAIL =================

app.get("/api/bookings/:id/detail", authMiddleware, async(req, res) => {
    try {
        const bookingResult = await pool.query(
            `
      SELECT *
      FROM bookings
      WHERE id = $1
      `, [req.params.id]
        );

        const booking = bookingResult.rows[0];

        if (!booking) {
            return res.status(404).json({
                message: "Không tìm thấy đặt vé",
            });
        }

        const [ticketsResult, paymentsResult] = await Promise.all([
            pool.query(
                `
        SELECT *
        FROM tickets
        WHERE booking_id = $1
        ORDER BY id ASC
        `, [req.params.id]
            ),

            pool.query(
                `
        SELECT *
        FROM payments
        WHERE booking_id = $1
        ORDER BY created_at DESC
        `, [req.params.id]
            ),
        ]);

        return res.json({
            booking,
            tickets: ticketsResult.rows,
            payments: paymentsResult.rows,
        });
    } catch (error) {
        return sendServerError(res, "Lỗi lấy chi tiết đặt vé", error);
    }
});

// ================= UPDATE BOOKING STATUS =================

app.patch("/api/bookings/:id/status", authMiddleware, async(req, res) => {
    try {
        const body = cleanBody(req.body);
        const keys = Object.keys(body);

        if (keys.length === 0) {
            return res.status(400).json({
                message: "Không có trạng thái để cập nhật",
            });
        }

        const { text, values } = await buildUpdateQuery(
            "bookings",
            req.params.id,
            body
        );

        const result = await pool.query(text, values);

        return res.json({
            message: "Cập nhật trạng thái thành công",
            data: result.rows[0],
        });
    } catch (error) {
        return sendServerError(res, "Lỗi cập nhật trạng thái đặt vé", error);
    }
});

// ================= CHECK-IN TICKET =================

app.patch("/api/tickets/:id/check-in", authMiddleware, async(req, res) => {
    try {
        const tableColumns = await getTableColumns("tickets");

        const body = {};

        if (tableColumns.includes("ticket_status")) {
            body.ticket_status = "used";
        }

        if (tableColumns.includes("status")) {
            body.status = "used";
        }

        if (tableColumns.includes("checked_in")) {
            body.checked_in = true;
        }

        const { text, values } = await buildUpdateQuery("tickets", req.params.id, body);

        const result = await pool.query(text, values);

        return res.json({
            message: "Check-in vé thành công",
            data: result.rows[0],
        });
    } catch (error) {
        return sendServerError(res, "Lỗi check-in vé", error);
    }
});

// ================= GET DATA =================

app.get("/api/:module", authMiddleware, async(req, res) => {
    const { module } = req.params;
    const { page, limit, search, fromDate, toDate } = req.query;

    const table = getTable(module);

    if (!table) {
        return res.status(400).json({
            message: "Module không hợp lệ",
        });
    }

    try {
        const tableColumns = await getTableColumns(table);
        const where = [];
        const values = [];

        if (search) {
            values.push(`%${search.toLowerCase()}%`);
            where.push(`LOWER(CAST(row_to_json(${q(table)}) AS TEXT)) LIKE $${values.length}`);
        }

        if (fromDate && tableColumns.includes("created_at")) {
            values.push(fromDate);
            where.push(`created_at >= $${values.length}`);
        }

        if (toDate && tableColumns.includes("created_at")) {
            values.push(toDate);
            where.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`);
        }

        const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

        const orderSql = tableColumns.includes("created_at") ?
            "ORDER BY created_at DESC NULLS LAST, id DESC" :
            "ORDER BY id DESC";

        if (page && limit) {
            const pageNumber = Math.max(Number(page) || 1, 1);
            const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
            const offset = (pageNumber - 1) * limitNumber;

            const countResult = await pool.query(
                `
        SELECT COUNT(*)
        FROM ${q(table)}
        ${whereSql}
        `,
                values
            );

            const dataResult = await pool.query(
                `
        SELECT *
        FROM ${q(table)}
        ${whereSql}
        ${orderSql}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
        `, [...values, limitNumber, offset]
            );

            const total = Number(countResult.rows[0].count);

            return res.json({
                data: dataResult.rows,
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            });
        }

        const result = await pool.query(
            `
      SELECT *
      FROM ${q(table)}
      ${whereSql}
      ${orderSql}
      `,
            values
        );

        return res.json(result.rows);
    } catch (error) {
        return sendServerError(res, "Lỗi lấy dữ liệu", error);
    }
});

// ================= GET ONE =================

app.get("/api/:module/:id", authMiddleware, async(req, res) => {
    const table = getTable(req.params.module);

    if (!table) {
        return res.status(400).json({
            message: "Module không hợp lệ",
        });
    }

    try {
        const result = await pool.query(
            `
      SELECT *
      FROM ${q(table)}
      WHERE id = $1
      `, [req.params.id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({
                message: "Không tìm thấy dữ liệu",
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        return sendServerError(res, "Lỗi lấy chi tiết dữ liệu", error);
    }
});

// ================= CREATE =================

app.post("/api/:module", authMiddleware, async(req, res) => {
    const moduleName = req.params.module;
    const table = getTable(moduleName);

    if (!table) {
        return res.status(400).json({
            message: "Module không hợp lệ",
        });
    }

    try {
        let body = req.body || {};

        if (moduleName === "routes") {
            body = normalizeRoutePayload(body);

            if (!body.name || !body.start_point || !body.end_point) {
                return res.status(400).json({
                    message: "Thiếu trường dữ liệu bắt buộc",
                    required: ["name", "start_point", "end_point"],
                    received: body,
                });
            }
        }

        const { text, values } = await buildInsertQuery(table, body);

        const result = await pool.query(text, values);

        return res.status(201).json({
            message: "Thêm dữ liệu thành công",
            data: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Dữ liệu đã tồn tại",
                error: error.detail,
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Dữ liệu liên kết không tồn tại",
                error: error.detail,
            });
        }

        if (error.code === "23502") {
            return res.status(400).json({
                message: "Thiếu trường dữ liệu bắt buộc",
                error: error.detail,
                received: req.body,
            });
        }

        return sendServerError(res, "Lỗi thêm dữ liệu", error);
    }
});

// ================= UPDATE =================

app.put("/api/:module/:id", authMiddleware, async(req, res) => {
    const moduleName = req.params.module;
    const table = getTable(moduleName);

    if (!table) {
        return res.status(400).json({
            message: "Module không hợp lệ",
        });
    }

    try {
        let body = req.body || {};

        if (moduleName === "routes") {
            body = normalizeRoutePayload(body);

            if (!body.name || !body.start_point || !body.end_point) {
                return res.status(400).json({
                    message: "Thiếu trường dữ liệu bắt buộc",
                    required: ["name", "start_point", "end_point"],
                    received: body,
                });
            }
        }

        const { text, values } = await buildUpdateQuery(table, req.params.id, body);

        const result = await pool.query(text, values);

        if (!result.rows[0]) {
            return res.status(404).json({
                message: "Không tìm thấy dữ liệu",
            });
        }

        return res.json({
            message: "Cập nhật dữ liệu thành công",
            data: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Dữ liệu đã tồn tại",
                error: error.detail,
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Dữ liệu liên kết không tồn tại",
                error: error.detail,
            });
        }

        if (error.code === "23502") {
            return res.status(400).json({
                message: "Thiếu trường dữ liệu bắt buộc",
                error: error.detail,
                received: req.body,
            });
        }

        return sendServerError(res, "Lỗi cập nhật dữ liệu", error);
    }
});

// ================= PATCH =================

app.patch("/api/:module/:id", authMiddleware, async(req, res) => {
    const moduleName = req.params.module;
    const table = getTable(moduleName);

    if (!table) {
        return res.status(400).json({
            message: "Module không hợp lệ",
        });
    }

    try {
        let body = req.body || {};

        if (moduleName === "routes") {
            body = normalizeRoutePayload(body);
        }

        const { text, values } = await buildUpdateQuery(table, req.params.id, body);

        const result = await pool.query(text, values);

        if (!result.rows[0]) {
            return res.status(404).json({
                message: "Không tìm thấy dữ liệu",
            });
        }

        return res.json({
            message: "Cập nhật dữ liệu thành công",
            data: result.rows[0],
        });
    } catch (error) {
        return sendServerError(res, "Lỗi cập nhật dữ liệu", error);
    }
});

// ================= DELETE =================

app.delete("/api/:module/:id", authMiddleware, async(req, res) => {
    const table = getTable(req.params.module);

    if (!table) {
        return res.status(400).json({
            message: "Module không hợp lệ",
        });
    }

    try {
        const result = await pool.query(
            `
      DELETE FROM ${q(table)}
      WHERE id = $1
      RETURNING *
      `, [req.params.id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({
                message: "Không tìm thấy dữ liệu để xóa",
            });
        }

        return res.json({
            message: "Xóa dữ liệu thành công",
            data: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message: "Không thể xóa vì dữ liệu đang được sử dụng ở chức năng khác",
            });
        }

        return sendServerError(res, "Lỗi xóa dữ liệu", error);
    }
});

// ================= 404 =================

app.use((req, res) => {
    return res.status(404).json({
        message: "Không tìm thấy API",
    });
});

// ================= START SERVER =================

const PORT = process.env.PORT || 3000;

process.on("uncaughtException", function(err) {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", function(err) {
    console.error("UNHANDLED REJECTION:", err);
});

app.listen(PORT, "0.0.0.0", async function() {
    try {
        await ensureLocalColumns();
    } catch (error) {
        console.log("Lỗi ensureLocalColumns:", error.message);
    }

    console.log(`TransitGo Backend running at http://localhost:${PORT}`);
    console.log("Admin mặc định: admin@transitgo.com / 123456");
});