const bcrypt = require('bcrypt');
const db = require('./config/db');

async function seed() {
  try {
    console.log('Starting seeding...');

    // 1. Clear existing data (Order matters due to foreign keys)
    await db.query('DELETE FROM payments');
    await db.query('DELETE FROM members');
    await db.query('DELETE FROM plans');
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM gyms');
    console.log('Cleared existing data.');

    // 2. Create Super Admin
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
      ['superadmin@gymsaas.com', superAdminPassword, 'SUPER_ADMIN']
    );
    console.log('Created Super Admin.');

    // 3. Create Sample Gyms
    const gym1Result = await db.query(
      "INSERT INTO gyms (name, phone, address) VALUES ($1, $2, $3) RETURNING id",
      ['Iron Paradise', '9876543210', 'Bandra, Mumbai']
    );
    const gym1Id = gym1Result.rows[0].id;

    const gym2Result = await db.query(
      "INSERT INTO gyms (name, phone, address) VALUES ($1, $2, $3) RETURNING id",
      ['Flex Fitness', '8877665544', 'Indiranagar, Bangalore']
    );
    const gym2Id = gym2Result.rows[0].id;
    console.log('Created Sample Gyms.');

    // 4. Create Gym Admins
    const admin1Password = await bcrypt.hash('admin123', 10);
    await db.query(
      'INSERT INTO users (email, password_hash, role, gym_id) VALUES ($1, $2, $3, $4)',
      ['admin@ironparadise.com', admin1Password, 'ADMIN', gym1Id]
    );

    const admin2Password = await bcrypt.hash('admin123', 10);
    await db.query(
      'INSERT INTO users (email, password_hash, role, gym_id) VALUES ($1, $2, $3, $4)',
      ['admin@flexfitness.com', admin2Password, 'ADMIN', gym2Id]
    );
    console.log('Created Gym Admins.');

    // 5. Create Plans for Gym 1
    const plan1Result = await db.query(
      "INSERT INTO plans (gym_id, name, duration_days, price) VALUES ($1, $2, $3, $4) RETURNING id",
      [gym1Id, 'Monthly Basic', 30, 1500]
    );
    const plan2Result = await db.query(
      "INSERT INTO plans (gym_id, name, duration_days, price) VALUES ($1, $2, $3, $4) RETURNING id",
      [gym1Id, 'Yearly Pro', 365, 12000]
    );
    const plan1Id = plan1Result.rows[0].id;
    console.log('Created Plans for Gym 1.');

    // 6. Create Members for Gym 1
    const member1Result = await db.query(
      "INSERT INTO members (gym_id, name, phone) VALUES ($1, $2, $3) RETURNING id",
      [gym1Id, 'Rahul Sharma', '9000000001']
    );
    const member2Result = await db.query(
      "INSERT INTO members (gym_id, name, phone) VALUES ($1, $2, $3) RETURNING id",
      [gym1Id, 'Priya Patel', '9000000002']
    );
    const member1Id = member1Result.rows[0].id;
    const member2Id = member2Result.rows[0].id;
    console.log('Created Members for Gym 1.');

    // 7. Create Payments for Gym 1
    await db.query(
      "INSERT INTO payments (gym_id, member_id, plan_id, amount, payment_mode, valid_from, valid_until) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [gym1Id, member1Id, plan1Id, 1500, 'UPI', '2026-05-01', '2026-05-31']
    );
    await db.query(
      "INSERT INTO payments (gym_id, member_id, plan_id, amount, payment_mode, valid_from, valid_until) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [gym1Id, member2Id, plan1Id, 1500, 'CASH', '2026-05-05', '2026-06-04']
    );
    console.log('Created Payments for Gym 1.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
