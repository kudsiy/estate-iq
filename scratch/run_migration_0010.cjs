const mysql = require('mysql2/promise');

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function run() {
  const conn = await mysql.createConnection(
    'mysql://root:mAPKbgBFiIyDLGsVILzhXMRhuYnEmsDk@interchange.proxy.rlwy.net:20136/railway'
  );
  console.log('Connected to Railway MySQL');

  // sellerPhone on properties
  const hasSellerPhone = await columnExists(conn, 'properties', 'sellerPhone');
  if (hasSellerPhone) {
    console.log('SKIP: properties.sellerPhone already exists');
  } else {
    await conn.execute('ALTER TABLE `properties` ADD COLUMN `sellerPhone` varchar(32)');
    console.log('OK:   properties.sellerPhone added');
  }

  // followUpDate on contacts
  const hasFollowUpDate = await columnExists(conn, 'contacts', 'followUpDate');
  if (hasFollowUpDate) {
    console.log('SKIP: contacts.followUpDate already exists');
  } else {
    await conn.execute('ALTER TABLE `contacts` ADD COLUMN `followUpDate` timestamp NULL');
    console.log('OK:   contacts.followUpDate added');
  }

  // Final verification
  const finalSellerPhone = await columnExists(conn, 'properties', 'sellerPhone');
  const finalFollowUpDate = await columnExists(conn, 'contacts', 'followUpDate');

  console.log('\n=== FINAL VERIFICATION ===');
  console.log('properties.sellerPhone  :', finalSellerPhone  ? 'EXISTS ✓' : 'MISSING ✗');
  console.log('contacts.followUpDate   :', finalFollowUpDate ? 'EXISTS ✓' : 'MISSING ✗');

  await conn.end();
  process.exit(finalSellerPhone && finalFollowUpDate ? 0 : 1);
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
