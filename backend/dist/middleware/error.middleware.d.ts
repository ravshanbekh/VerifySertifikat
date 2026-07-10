import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (err: Error & {
    statusCode?: number;
}, req: Request, res: Response, _next: NextFunction) => void;
export declare class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
//# sourceMappingURL=error.middleware.d.ts.map