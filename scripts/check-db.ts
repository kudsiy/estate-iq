import "dotenv/config";
import mysql from "mysql2/promise";

async function check() {
  const url = process.env.DATABASE_URL;
  console.log("Checking DB connection to:", url?.split('@')[1]);
  try {
    const connection = await mysql.createConnection(url!);
    console.log("SUCCESS: Connected to MySQL!");
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("FAILURE: Could not connect to DB:", err);
    process.exit(1);
  }
}

check();
