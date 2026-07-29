import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import serviceRoutes from './routes/services.js';
import incidentRoutes from './routes/incidents.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';
import { scheduleAllServices } from './services/schedulerService.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());
app.use(apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

setupSocketHandlers(io);

export { io };

async function start() {
  await connectDB();
  scheduleAllServices();
  server.listen(env.PORT, () => {
    console.log(`UptimeGuard backend running on port ${env.PORT}`);
  });
}

start();