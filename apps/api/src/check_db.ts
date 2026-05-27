import { Client } from 'pg';

async function main() {
  const connectionString = 'postgresql://postgres:GFaOVyCZVIyksHtCTyjfLJtOAEJEeFWq@zephyr.proxy.rlwy.net:10491/dev_test';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Successfully connected to the dev_test remote database!');
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Failed to query tables:', err);
  } finally {
    await client.end();
  }
}

main();
