const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "my_secret_key";

// ================= AUTH MIDDLEWARE =================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

// ================= MODULE → TABLE =================
const tableMap = {
  sales: "sales",
  orders: "orders",
  orderItems: "order_items",
  purchases: "purchases",
  inventory: "inventory",
  products: "products",
  customers: "customers",
  customerGroups: "customer_groups",
  customerDebts: "customer_debts",
  cashbook: "cashbook",
  expenses: "expenses",
  debts: "debts",
  profit: "profit",
  productGroups: "product_groups",
  units: "units",
  priceList: "price_list",
  staff: "staff",
  shifts: "shifts",
  channels: "channels",
};

function getTable(module) {
  return tableMap[module];
}

// ================= CHUYỂN camelCase → snake_case =================
// Ví dụ: productId → product_id, minStock → min_stock
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function normalizeBody(body) {
  const result = {};

  Object.keys(body).forEach((key) => {
    result[camelToSnake(key)] = body[key];
  });

  return result;
}

// ================= TEST SERVER =================
app.get("/", (req, res) => {
  res.send("Backend PostgreSQL đang chạy OK");
});

// ================= CREATE FULL ORDER =================
app.post("/api/orders/create-full", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      customerId,
      channel = "POS",
      paidAmount = 0,
      paymentMethod = "cash",
      note = "",
      items = [],
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "Đơn hàng chưa có sản phẩm" });
    }

    const total = items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.price || 0);
    }, 0);

    const debtAmount = Math.max(total - Number(paidAmount || 0), 0);

    let paymentStatus = "unpaid";

    if (Number(paidAmount) >= total) {
      paymentStatus = "paid";
    } else if (Number(paidAmount) > 0) {
      paymentStatus = "partial";
    } else {
      paymentStatus = "debt";
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders 
      (customer_id, date, channel, total, paid_amount, debt_amount, payment_status, note)
      VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        customerId || null,
        channel,
        total,
        Number(paidAmount || 0),
        debtAmount,
        paymentStatus,
        note,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const itemTotal = quantity * price;

      await client.query(
        `
        INSERT INTO order_items
        (order_id, product_id, quantity, price, total)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [order.id, item.productId, quantity, price, itemTotal]
      );

      await client.query(
        `
        UPDATE products
        SET stock = COALESCE(stock, 0) - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [quantity, item.productId]
      );

      await client.query(
        `
        INSERT INTO inventory
        (product_id, type, quantity, note)
        VALUES ($1, $2, $3, $4)
        `,
        [item.productId, "export", quantity, `Xuất kho đơn hàng #${order.id}`]
      );
    }

    if (Number(paidAmount || 0) > 0) {
      await client.query(
        `
        INSERT INTO cashbook
        (type, amount, payment_method, customer_id, order_id, note)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          "thu",
          Number(paidAmount || 0),
          paymentMethod,
          customerId || null,
          order.id,
          `Thu tiền đơn hàng #${order.id}`,
        ]
      );
    }

    if (debtAmount > 0) {
      await client.query(
        `
        INSERT INTO debts
        (customer_id, order_id, type, amount, note)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          customerId || null,
          order.id,
          "increase",
          debtAmount,
          `Ghi nợ đơn hàng #${order.id}`,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Tạo đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Lỗi tạo đơn hàng:", error);

    res.status(500).json({
      message: "Lỗi tạo đơn hàng",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ================= UPDATE FULL ORDER =================
app.put("/api/orders/:id/update-full", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const {
      customerId,
      channel = "POS",
      paidAmount = 0,
      paymentMethod = "cash",
      note = "",
      items = [],
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "Đơn hàng chưa có sản phẩm" });
    }

    const oldItemsResult = await client.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [id]
    );

    const oldItems = oldItemsResult.rows;

    // Trả lại tồn kho cũ
    for (const oldItem of oldItems) {
      await client.query(
        `
        UPDATE products
        SET stock = COALESCE(stock, 0) + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [Number(oldItem.quantity || 0), oldItem.product_id]
      );
    }

    // Xóa dữ liệu cũ liên quan
    await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);
    await client.query("DELETE FROM cashbook WHERE order_id = $1", [id]);
    await client.query("DELETE FROM debts WHERE order_id = $1", [id]);
    await client.query("DELETE FROM inventory WHERE note LIKE $1", [
      `%#${id}%`,
    ]);

    const total = items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.price || 0);
    }, 0);

    const debtAmount = Math.max(total - Number(paidAmount || 0), 0);

    let paymentStatus = "unpaid";

    if (Number(paidAmount) >= total) {
      paymentStatus = "paid";
    } else if (Number(paidAmount) > 0) {
      paymentStatus = "partial";
    } else {
      paymentStatus = "debt";
    }

    const orderResult = await client.query(
      `
      UPDATE orders
      SET customer_id = $1,
          channel = $2,
          total = $3,
          paid_amount = $4,
          debt_amount = $5,
          payment_status = $6,
          note = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
      `,
      [
        customerId || null,
        channel,
        total,
        Number(paidAmount || 0),
        debtAmount,
        paymentStatus,
        note,
        id,
      ]
    );

    const order = orderResult.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const itemTotal = quantity * price;

      await client.query(
        `
        INSERT INTO order_items
        (order_id, product_id, quantity, price, total)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [id, item.productId, quantity, price, itemTotal]
      );

      await client.query(
        `
        UPDATE products
        SET stock = COALESCE(stock, 0) - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [quantity, item.productId]
      );

      await client.query(
        `
        INSERT INTO inventory
        (product_id, type, quantity, note)
        VALUES ($1, $2, $3, $4)
        `,
        [item.productId, "export", quantity, `Xuất kho đơn hàng #${id}`]
      );
    }

    if (Number(paidAmount || 0) > 0) {
      await client.query(
        `
        INSERT INTO cashbook
        (type, amount, payment_method, customer_id, order_id, note)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          "thu",
          Number(paidAmount || 0),
          paymentMethod,
          customerId || null,
          id,
          `Thu tiền đơn hàng #${id}`,
        ]
      );
    }

    if (debtAmount > 0) {
      await client.query(
        `
        INSERT INTO debts
        (customer_id, order_id, type, amount, note)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          customerId || null,
          id,
          "increase",
          debtAmount,
          `Ghi nợ đơn hàng #${id}`,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Cập nhật đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Lỗi cập nhật đơn hàng:", error);

    res.status(500).json({
      message: "Lỗi cập nhật đơn hàng",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ================= LOGIN API =================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login request:", email, password);

  try {
    let result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // Tự tạo admin mặc định lần đầu
    if (result.rows.length === 0 && email === "admin@gmail.com") {
      const hashedPassword = bcrypt.hashSync("123456", 10);

      await pool.query(
        "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)",
        ["admin@gmail.com", hashedPassword, "Admin"]
      );

      result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
    }

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

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
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.log("Lỗi login:", error);
    res.status(500).json({ message: "Lỗi server login" });
  }
});

// ================= GET DATA =================
// Ví dụ:
// /api/customers
// /api/customers?page=1&limit=20
// /api/customers?search=duy
app.get("/api/:module", authMiddleware, async (req, res) => {
  const { module } = req.params;
  const { page, limit, search, fromDate, toDate } = req.query;

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
      values.push(`%${search.toLowerCase()}%`);
      where.push(
        `LOWER(CAST(row_to_json(${table}) AS TEXT)) LIKE $${values.length}`
      );
    }

    if (fromDate) {
      values.push(fromDate);
      where.push(`created_at >= $${values.length}`);
    }

    if (toDate) {
      values.push(toDate);
      where.push(`created_at <= $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    if (page && limit) {
      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const offset = (pageNumber - 1) * limitNumber;

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM ${table} ${whereSql}`,
        values
      );

      const dataResult = await pool.query(
        `SELECT * FROM ${table}
         ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${values.length + 1}
         OFFSET $${values.length + 2}`,
        [...values, limitNumber, offset]
      );

      return res.json({
        data: dataResult.rows,
        total: Number(countResult.rows[0].count),
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          Number(countResult.rows[0].count) / limitNumber
        ),
      });
    }

    const result = await pool.query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY created_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.log("Lỗi lấy dữ liệu:", error);
    res.status(500).json({
      message: "Lỗi lấy dữ liệu",
    });
  }
});

// ================= CREATE =================
app.post("/api/:module", authMiddleware, async (req, res) => {
  const { module } = req.params;
  const table = getTable(module);

  if (!table) {
    return res.status(400).json({
      message: "Module không hợp lệ",
    });
  }

  try {
    const body = normalizeBody(req.body);
    const keys = Object.keys(body);

    if (keys.length === 0) {
      return res.status(400).json({
        message: "Không có dữ liệu để thêm",
      });
    }

    const columns = keys.join(", ");
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
    const values = keys.map((key) => body[key]);

    const result = await pool.query(
      `INSERT INTO ${table} (${columns})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );

    res.json({
      message: "Thêm dữ liệu thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Lỗi thêm dữ liệu:", error);
    res.status(500).json({
      message: "Lỗi thêm dữ liệu",
      error: error.message,
    });
  }
});

// ================= UPDATE =================
app.put("/api/:module/:id", authMiddleware, async (req, res) => {
  const { module, id } = req.params;
  const table = getTable(module);

  if (!table) {
    return res.status(400).json({
      message: "Module không hợp lệ",
    });
  }

  try {
    const body = normalizeBody(req.body);
    const keys = Object.keys(body);

    if (keys.length === 0) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const setSql = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = keys.map((key) => body[key]);

    const result = await pool.query(
      `UPDATE ${table}
       SET ${setSql}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${keys.length + 1}
       RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu",
      });
    }

    res.json({
      message: "Cập nhật dữ liệu thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Lỗi cập nhật dữ liệu:", error);
    res.status(500).json({
      message: "Lỗi cập nhật dữ liệu",
      error: error.message,
    });
  }
});

// ================= DELETE =================
app.delete("/api/:module/:id", authMiddleware, async (req, res) => {
  const { module, id } = req.params;
  const table = getTable(module);

  if (!table) {
    return res.status(400).json({
      message: "Module không hợp lệ",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu để xoá",
      });
    }

    res.json({
      message: "Xóa dữ liệu thành công",
    });
  } catch (error) {
    console.log("Lỗi xoá dữ liệu:", error);
    res.status(500).json({
      message: "Lỗi xoá dữ liệu",
      error: error.message,
    });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});