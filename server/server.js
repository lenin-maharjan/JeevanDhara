require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const { seedFacilities } = require('./src/utils/seedFacilities');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  // Seed default facilities (hospitals and blood banks) if needed
  await seedFacilities();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});