import { Router } from 'express';
import express from 'express';
import { clerkWebhookHandler } from '../controllers/webhookController';

const router = Router();

// Clerk webhook requires raw body for signature verification
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhookHandler
);

export default router;
