import { Router } from 'express';
import { handleChatStream } from '../controllers/chat';

const router = Router();

/**
 * POST /api/chat
 * Streaming chat endpoint with AI tool execution
 */
router.post('/chat', handleChatStream);

export default router;
