"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const users_controller_1 = require("./users.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('super_admin'));
router.get('/', users_controller_1.getUsers);
router.post('/', users_controller_1.createUser);
router.delete('/:id', users_controller_1.deleteUser);
router.put('/:id/role', users_controller_1.updateUserRole);
router.put('/:id/password', users_controller_1.resetUserPassword);
exports.default = router;
//# sourceMappingURL=users.routes.js.map