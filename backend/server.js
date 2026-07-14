const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET =
  process.env.JWT_SECRET || "transitgo_secret_key";

// ================= AUTH MIDDLEWARE =================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Chưa đăng nhập",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
}

// ================= MODULE → TABLE =================
const tableMap = {
  customers: "customers",
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
  return str.replace(
    /[A-Z]/g,
    (letter) => `_${letter.toLowerCase()}`
  );
}

function normalizeBody(body = {}) {
  const result = {};

  Object.keys(body).forEach((key) => {
    result[camelToSnake(key)] = body[key];
  });

  return result;
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

// ================= TEST SERVER =================
app.get("/", (req, res) => {
  res.send(
    "TransitGo Backend - Hệ thống đặt vé xe buýt và quản lý tuyến đường đang chạy"
  );
});

// ================= LOGIN API =================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Vui lòng nhập email và mật khẩu",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    let result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [normalizedEmail]
    );

    // Tự tạo tài khoản admin mặc định lần đầu
    if (
      result.rows.length === 0 &&
      normalizedEmail === "admin@transitgo.com"
    ) {
      const hashedPassword = await bcrypt.hash(
        "123456",
        10
      );

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
        `,
        [
          "admin@transitgo.com",
          hashedPassword,
          "TransitGo Administrator",
          "admin",
          "active",
        ]
      );

      result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        ["admin@transitgo.com"]
      );
    }

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu",
      });
    }

    if (
      user.status &&
      user.status !== "active"
    ) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
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
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      "Lỗi server đăng nhập",
      error
    );
  }
});

// ================= CURRENT USER =================
app.get(
  "/api/auth/me",
  authMiddleware,
  async (req, res) => {
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
        `,
        [req.user.id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản",
        });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi lấy thông tin tài khoản",
        error
      );
    }
  }
);

// ================= DASHBOARD =================
app.get(
  "/api/dashboard/summary",
  authMiddleware,
  async (req, res) => {
    try {
      const [
        routes,
        buses,
        trips,
        bookings,
        customers,
        revenue,
      ] = await Promise.all([
        pool.query(
          `
          SELECT COUNT(*)
          FROM routes
          WHERE status = 'active'
          `
        ),

        pool.query(
          `
          SELECT COUNT(*)
          FROM buses
          `
        ),

        pool.query(
          `
          SELECT COUNT(*)
          FROM trips
          WHERE departure_time::date = CURRENT_DATE
          `
        ),

        pool.query(
          `
          SELECT COUNT(*)
          FROM bookings
          WHERE booking_time::date = CURRENT_DATE
          `
        ),

        pool.query(
          `
          SELECT COUNT(*)
          FROM customers
          `
        ),

        pool.query(
          `
          SELECT
            COALESCE(SUM(amount), 0) AS total
          FROM payments
          WHERE payment_status = 'success'
            AND COALESCE(
              paid_at,
              created_at
            )::date = CURRENT_DATE
          `
        ),
      ]);

      return res.json({
        activeRoutes: Number(
          routes.rows[0].count
        ),

        totalBuses: Number(
          buses.rows[0].count
        ),

        todayTrips: Number(
          trips.rows[0].count
        ),

        todayBookings: Number(
          bookings.rows[0].count
        ),

        totalCustomers: Number(
          customers.rows[0].count
        ),

        todayRevenue: Number(
          revenue.rows[0].total
        ),
      });
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi lấy dữ liệu tổng quan",
        error
      );
    }
  }
);

// ================= TRIP SEARCH =================
app.get(
  "/api/trips/search/available",
  async (req, res) => {
    const {
      departureStationId,
      arrivalStationId,
      date,
    } = req.query;

    try {
      const where = [
        "t.status IN ('scheduled', 'boarding')",
      ];

      const values = [];

      if (departureStationId) {
        values.push(departureStationId);

        where.push(
          `r.departure_station_id = $${values.length}`
        );
      }

      if (arrivalStationId) {
        values.push(arrivalStationId);

        where.push(
          `r.arrival_station_id = $${values.length}`
        );
      }

      if (date) {
        values.push(date);

        where.push(
          `t.departure_time::date = $${values.length}`
        );
      }

      const result = await pool.query(
        `
        SELECT
          t.*,
          r.code AS route_code,
          r.name AS route_name,
          ds.name AS departure_station_name,
          ars.name AS arrival_station_name,
          b.code AS bus_code,
          b.license_plate,
          d.name AS driver_name
        FROM trips t
        JOIN routes r
          ON r.id = t.route_id
        LEFT JOIN stations ds
          ON ds.id = r.departure_station_id
        LEFT JOIN stations ars
          ON ars.id = r.arrival_station_id
        LEFT JOIN buses b
          ON b.id = t.bus_id
        LEFT JOIN drivers d
          ON d.id = t.driver_id
        WHERE ${where.join(" AND ")}
        ORDER BY t.departure_time ASC
        `,
        values
      );

      return res.json(result.rows);
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi tìm chuyến xe",
        error
      );
    }
  }
);

// ================= GET AVAILABLE SEATS =================
app.get(
  "/api/trips/:id/available-seats",
  async (req, res) => {
    try {
      const tripResult = await pool.query(
        `
        SELECT
          id,
          bus_id,
          status
        FROM trips
        WHERE id = $1
        `,
        [req.params.id]
      );

      const trip = tripResult.rows[0];

      if (!trip) {
        return res.status(404).json({
          message: "Không tìm thấy chuyến xe",
        });
      }

      if (!trip.bus_id) {
        return res.status(400).json({
          message:
            "Chuyến xe chưa được gán xe buýt",
        });
      }

      const seatsResult = await pool.query(
        `
        SELECT
          bs.id,
          bs.seat_number,
          bs.seat_type,
          bs.floor_number,
          CASE
            WHEN tk.id IS NULL THEN TRUE
            ELSE FALSE
          END AS is_available
        FROM bus_seats bs
        LEFT JOIN tickets tk
          ON tk.seat_id = bs.id
          AND tk.trip_id = $1
          AND tk.ticket_status IN (
            'valid',
            'used'
          )
        WHERE bs.bus_id = $2
          AND bs.status = 'active'
        ORDER BY
          bs.floor_number ASC,
          bs.seat_number ASC
        `,
        [
          req.params.id,
          trip.bus_id,
        ]
      );

      return res.json(seatsResult.rows);
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi lấy danh sách ghế",
        error
      );
    }
  }
);

// ================= CREATE FULL BOOKING =================
app.post(
  "/api/bookings/create-full",
  authMiddleware,
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const {
        customerId,
        tripId,
        passengerName,
        passengerPhone,
        passengerEmail = null,
        seatIds = [],
        pickupStopId = null,
        dropoffStopId = null,
        paymentMethod = "cash",
        paidAmount = 0,
        note = "",
      } = req.body;

      if (
        !tripId ||
        !passengerName ||
        !passengerPhone
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Thiếu chuyến xe, tên hành khách hoặc số điện thoại",
        });
      }

      if (
        !Array.isArray(seatIds) ||
        seatIds.length === 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Vui lòng chọn ít nhất một ghế",
        });
      }

      const uniqueSeatIds = [
        ...new Set(
          seatIds.map((seatId) =>
            Number(seatId)
          )
        ),
      ];

      const tripResult = await client.query(
        `
        SELECT
          t.*,
          b.id AS selected_bus_id
        FROM trips t
        LEFT JOIN buses b
          ON b.id = t.bus_id
        WHERE t.id = $1
        FOR UPDATE
        `,
        [tripId]
      );

      const trip = tripResult.rows[0];

      if (!trip) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Không tìm thấy chuyến xe",
        });
      }

      if (
        ["cancelled", "completed"].includes(
          trip.status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Chuyến xe không thể đặt vé",
        });
      }

      if (!trip.bus_id) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Chuyến xe chưa được gán xe buýt",
        });
      }

      const seatsResult =
        await client.query(
          `
          SELECT
            id,
            seat_number
          FROM bus_seats
          WHERE bus_id = $1
            AND status = 'active'
            AND id = ANY($2::int[])
          `,
          [
            trip.bus_id,
            uniqueSeatIds,
          ]
        );

      if (
        seatsResult.rows.length !==
        uniqueSeatIds.length
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Có ghế không tồn tại hoặc không thuộc xe của chuyến",
        });
      }

      const bookedSeats =
        await client.query(
          `
          SELECT seat_id
          FROM tickets
          WHERE trip_id = $1
            AND seat_id = ANY($2::int[])
            AND ticket_status IN (
              'valid',
              'used'
            )
          `,
          [
            tripId,
            uniqueSeatIds,
          ]
        );

      if (bookedSeats.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message:
            "Một hoặc nhiều ghế đã được đặt",

          bookedSeatIds:
            bookedSeats.rows.map(
              (row) => row.seat_id
            ),
        });
      }

      const ticketPrice = Number(
        trip.ticket_price || 0
      );

      const totalAmount =
        ticketPrice *
        uniqueSeatIds.length;

      const amountPaid = Math.max(
        Number(paidAmount || 0),
        0
      );

      const paymentStatus =
        amountPaid >= totalAmount
          ? "paid"
          : "unpaid";

      const bookingStatus =
        paymentStatus === "paid"
          ? "confirmed"
          : "pending";

      const bookingCode =
        createCode("BK");

      const bookingResult =
        await client.query(
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
            $6,
            $7,
            $8,
            $9,
            $10
          )
          RETURNING *
          `,
          [
            bookingCode,
            customerId || null,
            tripId,
            passengerName,
            passengerPhone,
            passengerEmail,
            totalAmount,
            bookingStatus,
            paymentStatus,
            note,
          ]
        );

      const booking =
        bookingResult.rows[0];

      const tickets = [];

      for (
        const seatId of uniqueSeatIds
      ) {
        const ticketCode =
          createCode("TK");

        const ticketResult =
          await client.query(
            `
            INSERT INTO tickets
            (
              ticket_code,
              booking_id,
              trip_id,
              seat_id,
              pickup_stop_id,
              dropoff_stop_id,
              passenger_name,
              passenger_phone,
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
              $10,
              'valid'
            )
            RETURNING *
            `,
            [
              ticketCode,
              booking.id,
              tripId,
              seatId,
              pickupStopId,
              dropoffStopId,
              passengerName,
              passengerPhone,
              ticketPrice,
              ticketCode,
            ]
          );

        tickets.push(
          ticketResult.rows[0]
        );
      }

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
          `,
          [
            booking.id,
            createCode("PM"),
            paymentMethod,
            amountPaid,
            paymentStatus === "paid"
              ? "success"
              : "pending",
            paymentStatus === "paid"
              ? new Date()
              : null,
            `Thanh toán đặt vé ${bookingCode}`,
          ]
        );
      }

      const remainingSeatsResult =
        await client.query(
          `
          SELECT
            COUNT(*)::int AS remaining
          FROM bus_seats bs
          WHERE bs.bus_id = $1
            AND bs.status = 'active'
            AND NOT EXISTS
            (
              SELECT 1
              FROM tickets tk
              WHERE tk.trip_id = $2
                AND tk.seat_id = bs.id
                AND tk.ticket_status IN
                (
                  'valid',
                  'used'
                )
            )
          `,
          [
            trip.bus_id,
            tripId,
          ]
        );

      await client.query(
        `
        UPDATE trips
        SET
          available_seats = $1,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          remainingSeatsResult
            .rows[0].remaining,
          tripId,
        ]
      );

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

      if (error.code === "23505") {
        return res.status(409).json({
          message:
            "Ghế vừa được người khác đặt",
        });
      }

      return sendServerError(
        res,
        "Lỗi tạo đặt vé",
        error
      );
    } finally {
      client.release();
    }
  }
);

// ================= BOOKING DETAIL =================
app.get(
  "/api/bookings/:id/detail",
  authMiddleware,
  async (req, res) => {
    try {
      const bookingResult =
        await pool.query(
          `
          SELECT
            bk.*,
            t.code AS trip_code,
            t.departure_time,
            t.arrival_time,
            r.code AS route_code,
            r.name AS route_name,
            ds.name
              AS departure_station_name,
            ars.name
              AS arrival_station_name
          FROM bookings bk
          JOIN trips t
            ON t.id = bk.trip_id
          JOIN routes r
            ON r.id = t.route_id
          LEFT JOIN stations ds
            ON ds.id =
              r.departure_station_id
          LEFT JOIN stations ars
            ON ars.id =
              r.arrival_station_id
          WHERE bk.id = $1
          `,
          [req.params.id]
        );

      const booking =
        bookingResult.rows[0];

      if (!booking) {
        return res.status(404).json({
          message:
            "Không tìm thấy đặt vé",
        });
      }

      const [
        ticketsResult,
        paymentsResult,
      ] = await Promise.all([
        pool.query(
          `
          SELECT
            tk.*,
            bs.seat_number
          FROM tickets tk
          LEFT JOIN bus_seats bs
            ON bs.id = tk.seat_id
          WHERE tk.booking_id = $1
          ORDER BY
            bs.seat_number ASC
          `,
          [req.params.id]
        ),

        pool.query(
          `
          SELECT *
          FROM payments
          WHERE booking_id = $1
          ORDER BY created_at DESC
          `,
          [req.params.id]
        ),
      ]);

      return res.json({
        booking,
        tickets: ticketsResult.rows,
        payments: paymentsResult.rows,
      });
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi lấy chi tiết đặt vé",
        error
      );
    }
  }
);

// ================= UPDATE BOOKING STATUS =================
app.patch(
  "/api/bookings/:id/status",
  authMiddleware,
  async (req, res) => {
    const {
      bookingStatus,
      paymentStatus,
    } = req.body;

    if (
      !bookingStatus &&
      !paymentStatus
    ) {
      return res.status(400).json({
        message:
          "Không có trạng thái để cập nhật",
      });
    }

    try {
      const sets = [];
      const values = [];

      if (bookingStatus) {
        values.push(bookingStatus);

        sets.push(
          `booking_status = $${values.length}`
        );
      }

      if (paymentStatus) {
        values.push(paymentStatus);

        sets.push(
          `payment_status = $${values.length}`
        );
      }

      values.push(req.params.id);

      const result = await pool.query(
        `
        UPDATE bookings
        SET
          ${sets.join(", ")},
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING *
        `,
        values
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            "Không tìm thấy đặt vé",
        });
      }

      if (
        bookingStatus === "cancelled"
      ) {
        await pool.query(
          `
          UPDATE tickets
          SET
            ticket_status =
              'cancelled',
            updated_at =
              CURRENT_TIMESTAMP
          WHERE booking_id = $1
            AND ticket_status =
              'valid'
          `,
          [req.params.id]
        );
      }

      return res.json({
        message:
          "Cập nhật trạng thái thành công",

        data: result.rows[0],
      });
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi cập nhật trạng thái đặt vé",
        error
      );
    }
  }
);

// ================= CHECK-IN TICKET =================
app.patch(
  "/api/tickets/:id/check-in",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        UPDATE tickets
        SET
          ticket_status = 'used',
          checked_in_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $1
          AND ticket_status = 'valid'
        RETURNING *
        `,
        [req.params.id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            "Không tìm thấy vé hợp lệ hoặc vé đã được sử dụng",
        });
      }

      return res.json({
        message:
          "Check-in vé thành công",

        data: result.rows[0],
      });
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi check-in vé",
        error
      );
    }
  }
);

// ================= GET DATA =================
app.get(
  "/api/:module",
  authMiddleware,
  async (req, res) => {
    const { module } = req.params;

    const {
      page,
      limit,
      search,
      fromDate,
      toDate,
    } = req.query;

    const table = getTable(module);

    if (!table) {
      return res.status(400).json({
        message: "Module không hợp lệ",
      });
    }

    try {
      const where = [];
      const values = [];

      if (search) {
        values.push(
          `%${search.toLowerCase()}%`
        );

        where.push(
          `LOWER(CAST(row_to_json(${table}) AS TEXT)) LIKE $${values.length}`
        );
      }

      if (fromDate) {
        values.push(fromDate);

        where.push(
          `created_at >= $${values.length}`
        );
      }

      if (toDate) {
        values.push(toDate);

        where.push(
          `created_at < ($${values.length}::date + INTERVAL '1 day')`
        );
      }

      const whereSql =
        where.length > 0
          ? `WHERE ${where.join(
              " AND "
            )}`
          : "";

      if (page && limit) {
        const pageNumber = Math.max(
          Number(page) || 1,
          1
        );

        const limitNumber = Math.min(
          Math.max(
            Number(limit) || 20,
            1
          ),
          100
        );

        const offset =
          (pageNumber - 1) *
          limitNumber;

        const countResult =
          await pool.query(
            `
            SELECT COUNT(*)
            FROM ${table}
            ${whereSql}
            `,
            values
          );

        const dataResult =
          await pool.query(
            `
            SELECT *
            FROM ${table}
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${values.length + 1}
            OFFSET $${values.length + 2}
            `,
            [
              ...values,
              limitNumber,
              offset,
            ]
          );

        const total = Number(
          countResult.rows[0].count
        );

        return res.json({
          data: dataResult.rows,
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(
            total / limitNumber
          ),
        });
      }

      const result = await pool.query(
        `
        SELECT *
        FROM ${table}
        ${whereSql}
        ORDER BY created_at DESC
        `,
        values
      );

      return res.json(result.rows);
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi lấy dữ liệu",
        error
      );
    }
  }
);

// ================= GET ONE =================
app.get(
  "/api/:module/:id",
  authMiddleware,
  async (req, res) => {
    const table = getTable(
      req.params.module
    );

    if (!table) {
      return res.status(400).json({
        message: "Module không hợp lệ",
      });
    }

    try {
      const result = await pool.query(
        `
        SELECT *
        FROM ${table}
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            "Không tìm thấy dữ liệu",
        });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      return sendServerError(
        res,
        "Lỗi lấy chi tiết dữ liệu",
        error
      );
    }
  }
);

// ================= CREATE =================
app.post(
  "/api/:module",
  authMiddleware,
  async (req, res) => {
    const table = getTable(
      req.params.module
    );

    if (!table) {
      return res.status(400).json({
        message: "Module không hợp lệ",
      });
    }

    try {
      const body = normalizeBody(
        req.body
      );

      delete body.id;
      delete body.created_at;
      delete body.updated_at;

      const keys = Object.keys(body);

      if (keys.length === 0) {
        return res.status(400).json({
          message:
            "Không có dữ liệu để thêm",
        });
      }

      const columns =
        keys.join(", ");

      const placeholders = keys
        .map(
          (_, index) =>
            `$${index + 1}`
        )
        .join(", ");

      const values = keys.map(
        (key) => body[key]
      );

      const result = await pool.query(
        `
        INSERT INTO ${table}
        (${columns})
        VALUES (${placeholders})
        RETURNING *
        `,
        values
      );

      return res.status(201).json({
        message:
          "Thêm dữ liệu thành công",

        data: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          message:
            "Dữ liệu đã tồn tại",
          error: error.detail,
        });
      }

      if (error.code === "23503") {
        return res.status(400).json({
          message:
            "Dữ liệu liên kết không tồn tại",
          error: error.detail,
        });
      }

      if (error.code === "23502") {
        return res.status(400).json({
          message:
            "Thiếu trường dữ liệu bắt buộc",
          error: error.detail,
        });
      }

      return sendServerError(
        res,
        "Lỗi thêm dữ liệu",
        error
      );
    }
  }
);

// ================= UPDATE =================
app.put(
  "/api/:module/:id",
  authMiddleware,
  async (req, res) => {
    const table = getTable(
      req.params.module
    );

    if (!table) {
      return res.status(400).json({
        message: "Module không hợp lệ",
      });
    }

    try {
      const body = normalizeBody(
        req.body
      );

      delete body.id;
      delete body.created_at;
      delete body.updated_at;

      const keys = Object.keys(body);

      if (keys.length === 0) {
        return res.status(400).json({
          message:
            "Không có dữ liệu để cập nhật",
        });
      }

      const setSql = keys
        .map(
          (key, index) =>
            `${key} = $${index + 1}`
        )
        .join(", ");

      const values = keys.map(
        (key) => body[key]
      );

      const result = await pool.query(
        `
        UPDATE ${table}
        SET
          ${setSql},
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $${keys.length + 1}
        RETURNING *
        `,
        [
          ...values,
          req.params.id,
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            "Không tìm thấy dữ liệu",
        });
      }

      return res.json({
        message:
          "Cập nhật dữ liệu thành công",

        data: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          message:
            "Dữ liệu đã tồn tại",
          error: error.detail,
        });
      }

      if (error.code === "23503") {
        return res.status(400).json({
          message:
            "Dữ liệu liên kết không tồn tại",
          error: error.detail,
        });
      }

      return sendServerError(
        res,
        "Lỗi cập nhật dữ liệu",
        error
      );
    }
  }
);

// ================= DELETE =================
app.delete(
  "/api/:module/:id",
  authMiddleware,
  async (req, res) => {
    const table = getTable(
      req.params.module
    );

    if (!table) {
      return res.status(400).json({
        message: "Module không hợp lệ",
      });
    }

    try {
      const result = await pool.query(
        `
        DELETE FROM ${table}
        WHERE id = $1
        RETURNING *
        `,
        [req.params.id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            "Không tìm thấy dữ liệu để xóa",
        });
      }

      return res.json({
        message:
          "Xóa dữ liệu thành công",
      });
    } catch (error) {
      if (error.code === "23503") {
        return res.status(409).json({
          message:
            "Không thể xóa vì dữ liệu đang được sử dụng ở chức năng khác",
        });
      }

      return sendServerError(
        res,
        "Lỗi xóa dữ liệu",
        error
      );
    }
  }
);

// ================= 404 =================
app.use((req, res) => {
  return res.status(404).json({
    message: "Không tìm thấy API",
  });
});

// ================= START SERVER =================
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `TransitGo Backend running at http://localhost:${PORT}`
  );

  console.log(
    "Admin mặc định: admin@transitgo.com / 123456"
  );
});