import { Router } from 'express';
import { asyncHandler, validate, requireAuth } from '@/middleware';
import { idParamSchema } from '@/schemas';
import { jobController } from '@/controllers';

const router = Router();

// All job routes require authentication
router.use(requireAuth);

router.get('/', asyncHandler(jobController.list));
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(jobController.getById),
);

export const jobRoutes = router;
