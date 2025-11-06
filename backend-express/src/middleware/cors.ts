import cors from 'cors';
import { config } from '../config';

/**
 * CORS middleware configuration
 * Allows requests from the Next.js frontend
 */
export const corsMiddleware = cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
