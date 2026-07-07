const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedData = async () => {
  try {
    // Seed Admin if not exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin';
      const password = process.env.ADMIN_PASSWORD || '1234';

      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.create({ email, password: hashedPassword });
      console.log(`[Seed] Default Admin created: ${email}`);
    }
  } catch (error) {
    console.error('[Seed] Error seeding admin:', error);
  }
};

module.exports = seedData;
