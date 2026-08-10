import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

import { Server } from 'socket.io';
import AnalyticsEngine from './services/AnalyticsEngine.js';
import connectDB from './config/db.js';
import registerChatHandlers from './socket/chatHandler.js';
import logger from './utils/logger.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import chatRoutes from './routes/chats.js';
import trustRoutes from './routes/trust.js';
import analyticsRoutes from './routes/analytics.js';

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

app.use(express.json());
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow serving images cross-origin
app.use(morgan('dev'));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/analytics', analyticsRoutes);

// Attach Socket to Analytics Engine
AnalyticsEngine.attachSocket(io);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Campus Marketplace Backend' });
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  // Register Chat real-time events
  registerChatHandlers(io, socket);
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
