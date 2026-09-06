import './env.js';
import { env } from './env.js';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = parseInt(env.PORT, 10);

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ GreenCart server running at http://localhost:${PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
