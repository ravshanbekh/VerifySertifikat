import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { Request, Response } from 'express';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true, email: true } },
          certificate: { select: { serial_number: true, full_name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
