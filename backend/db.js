require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
        "postgresql://noah_user:noah_pass_2024@localhost:5433/noah_finance",
});

pool.on("connect", () => {
    console.log("✅ Đã kết nối PostgreSQL");
});

pool.on("error", (error) => {
    console.error("❌ Lỗi PostgreSQL:", error.message);
});

module.exports = pool;