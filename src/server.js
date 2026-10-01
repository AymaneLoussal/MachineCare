require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/database');

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start the API:', error.message);
    process.exit(1);
  }
}

startServer();
