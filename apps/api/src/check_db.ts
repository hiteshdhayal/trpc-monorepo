import { Client } from 'pg';

async function main() {
  const connectionString = 'postgresql://postgres:GFaOVyCZVIyksHtCTyjfLJtOAEJEeFWq@zephyr.proxy.rlwy.net:10491/railway';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Successfully connected to the remote database!');
    
    // Try to create dev_test database
    await client.query('CREATE DATABASE dev_test;');
    console.log('Successfully created dev_test database!');
  } catch (err) {
    console.error('Failed to create database:', err);
  } finally {
    await client.end();
  }
}

main();
