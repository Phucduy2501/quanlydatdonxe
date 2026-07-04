const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:123456@localhost:5432/product_manager",
});

module.exports = pool;