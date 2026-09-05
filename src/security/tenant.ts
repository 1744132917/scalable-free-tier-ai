import type { Request, Response, NextFunction } from 'express';

export function extractTenant(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.header('x-tenant-id');
  if (!tenantId) {
    res.status(400).json({ error: 'missing tenant header' });
    return;
  }
  (req as Request & { tenantId: string }).tenantId = tenantId;
  next();
}
