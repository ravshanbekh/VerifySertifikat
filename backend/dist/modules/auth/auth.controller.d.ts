import { Request, Response } from 'express';
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const refreshToken: (req: Request, res: Response) => Promise<void>;
export declare const logout: (_req: Request, res: Response) => Promise<void>;
export declare const getMe: (req: Request & {
    user?: {
        id: string;
    };
}, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map