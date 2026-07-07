import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleExport } from '../controllers/exportController';

const router = Router();

router.get('/', authenticate, handleExport);

export default router;
