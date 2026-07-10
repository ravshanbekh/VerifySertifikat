import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
export declare const verifyCertificate: (req: Request, res: Response) => Promise<void>;
export declare const getCertificates: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCertificateById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCertificate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadCertificate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCertificate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const revokeCertificate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const reissueCertificate: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=certificates.controller.d.ts.map