import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [result] = await connection.execute(`
    UPDATE contacts 
    SET 
      subcity = JSON_UNQUOTE(JSON_EXTRACT(customFields, '$.subcity')),
      woreda = JSON_UNQUOTE(JSON_EXTRACT(customFields, '$.woreda')),
      propertyInterest = JSON_UNQUOTE(JSON_EXTRACT(customFields, '$.propertyInterest'))
    WHERE JSON_EXTRACT(customFields, '$.subcity') IS NOT NULL 
       OR JSON_EXTRACT(customFields, '$.woreda') IS NOT NULL
       OR JSON_EXTRACT(customFields, '$.propertyInterest') IS NOT NULL;
  `);

  console.log("Migration finished.", result);
  await connection.end();
}

run().catch(console.error);
