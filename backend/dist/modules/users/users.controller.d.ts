import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
export declare const getUsers: (_req: Request, res: Response) => Promise<void>;
export declare const createUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUserRole: (req: AuthRequest, res: Response) => Promise<void>;
export declare const resetUserPassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=users.controller.d.ts.map