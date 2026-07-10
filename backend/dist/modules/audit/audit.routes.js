"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('super_admin'));
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const [total, logs] = await Promise.all([
            database_1.prisma.auditLog.count(),
            database_1.prisma.auditLog.findMany({
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
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=audit.routes.js.map