/**
 * One-time CLI script to create the first admin account.
 * Run with: npm run seed
 *
 * Reads credentials from environment variables so no secrets are hardcoded:
 *   SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_STAFF_ID
 * Falls back to sensible defaults for local development only.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  const name = process.env.SEED_ADMIN_NAME || 'System Administrator';
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@educonnect.gh').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const staffId = process.env.SEED_ADMIN_STAFF_ID || 'ADMIN-0001';

  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`An account with email ${email} already exists. Nothing to do.`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      staffId,
    });
    console.log('Admin account created successfully:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('Log in and change this password immediately.');
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeder failed:', err.message);
  process.exit(1);
});
