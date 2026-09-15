import { Request, Response, NextFunction } from "express";
import { CareerAccount } from "@prisma/client";
export interface CareerRequest extends Request {
    career?: CareerAccount;
}
export declare function sessionToken(req: Request): string;
export declare function startSession(res: Response, accountId: string): Promise<void>;
export declare function clearSession(res: Response): void;
export declare function optionalSession(req: CareerRequest, _res: Response, next: NextFunction): Promise<void>;
export declare function requireCareer(req: CareerRequest, _res: Response, next: NextFunction): void;
export declare function approvedEmployer(req: CareerRequest, _res: Response, next: NextFunction): void;
export declare function safeAccount(a: CareerAccount): {
    id: string;
    email: string;
    role: import(".prisma/client").$Enums.CareerRole;
    full_name: string;
    created_at: Date;
    updated_at: Date;
    status: import(".prisma/client").$Enums.CareerStatus;
    phone: string;
    telegram: string;
    company_name: string | null;
    website: string | null;
    industry: string | null;
    consent_at: Date;
};
export declare function originGuard(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=career.auth.d.ts.map