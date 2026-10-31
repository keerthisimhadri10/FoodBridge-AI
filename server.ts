import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './server/routes/auth.routes';
import orgRoutes from './server/routes/organization.routes';
import listingRoutes from './server/routes/listing.routes';
import requestRoutes from './server/routes/request.routes';
import pickupRoutes from './server/routes/pickup.routes';
import deliveryRoutes from './server/routes/delivery.routes';
import feedbackRoutes from './server/routes/feedback.routes';
import adminRoutes from './server/routes/admin.routes';
import analyticsRoutes from './server/routes/analytics.routes';
import notificationRoutes from './server/routes/notification.routes';
import aiRoutes from './server/routes/ai.routes';
import uploadRoutes from './server/routes/upload.routes';
import reportRoutes from './server/routes/report.routes';
import { checkSupabaseHealth, isSupabaseConfigured } from './server/db/supabase';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static uploads
  const uploadDir = path.resolve(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  // Serve generated asset images if referenced directly
  const imagesDir = path.resolve(__dirname, 'src', 'assets', 'images');
  if (fs.existsSync(imagesDir)) {
    app.use('/src/assets/images', express.static(imagesDir));
  }

  // Health and database status check
  app.get('/api/health', async (_req, res) => {
    const dbStatus = await checkSupabaseHealth();
    res.json({
      status: 'healthy',
      app: 'FoodBridge AI',
      timestamp: new Date().toISOString(),
      database: {
        mode: dbStatus.configured ? (dbStatus.connected ? 'supabase_postgresql' : 'supabase_error') : 'local_json_mutex',
        configured: dbStatus.configured,
        connected: dbStatus.connected,
        message: dbStatus.message,
      },
      aiEngine: {
        configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        model: 'gemini-3.8-flash',
      },
    });
  });

  app.get('/api/health/db', async (_req, res) => {
    const dbStatus = await checkSupabaseHealth();
    res.json(dbStatus);
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/organizations', orgRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/pickups', pickupRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/reports', reportRoutes);

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  if (!isProd) {
    // Development mode: Mount Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`FoodBridge AI Fullstack Server running on http://0.0.0.0:${PORT}`);
    if (isSupabaseConfigured()) {
      const status = await checkSupabaseHealth();
      console.log(`[Database] Supabase PostgreSQL status: ${status.connected ? 'CONNECTED' : 'DISCONNECTED'} (${status.message})`);
    } else {
      console.log(`[Database] Mode: Local resilient JSON storage active with atomic Mutex locking.`);
      console.log(`[Database] To connect to Supabase PostgreSQL, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.`);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
