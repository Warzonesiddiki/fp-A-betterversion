import type { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/AuditService.js';

/**
 * Middleware that automatically logs HTTP requests to the audit trail.
 * Attaches to all protected routes to capture user actions.
 */
export function auditRequestMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture the original res.json to intercept the response
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    const durationMs = Date.now() - startTime;

    // Only audit if user is authenticated (skip public routes)
    if (req.user) {
      const method = req.method.toUpperCase();
      const path = req.path;

      // Determine action based on HTTP method
      const actionMap: Record<string, string> = {
        GET: 'view',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
      };

      // Determine resource type from the route path
      const resourceType = extractResourceType(path);

      // Determine resource ID from params or body
      const rawResourceId = req.params.id ?? req.body?.id ?? null;
      const resourceId = Array.isArray(rawResourceId)
        ? rawResourceId[0] ?? null
        : rawResourceId === null || rawResourceId === undefined
          ? null
          : String(rawResourceId);

      // Skip logging for health checks and reads of non-sensitive data
      const shouldLog = method !== 'GET' || isSensitiveEndpoint(path);

      if (shouldLog) {
        auditService.log({
          category: 'user_action',
          action: (actionMap[method] ?? 'view') as 'create' | 'update' | 'delete' | 'view',
          severity: res.statusCode >= 400 ? 'warning' : 'info',
          userId: req.user.id,
          userName: req.user.email,
          userRole: req.user.role,
          ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
          userAgent: req.get('user-agent') ?? null,
          resourceType,
          resourceId,
          requestMethod: method,
          requestPath: path,
          responseStatus: res.statusCode,
          durationMs,
          details: `${method} ${path} → ${res.statusCode}`,
        });
      }
    }

    return originalJson(body);
  };

  next();
}

/**
 * Extract resource type from the URL path.
 * e.g., /api/budgets/123 → budgets
 */
function extractResourceType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  // Skip 'api' prefix, return the next segment
  const apiIndex = segments.indexOf('api');
  if (apiIndex >= 0 && segments.length > apiIndex + 1) {
    return segments[apiIndex + 1] ?? 'unknown';
  }
  return segments[0] ?? 'unknown';
}

/**
 * Determine if an endpoint contains sensitive data that should always be logged.
 */
function isSensitiveEndpoint(path: string): boolean {
  const sensitivePatterns = [
    '/auth/',
    '/users/',
    '/permissions/',
    '/roles/',
    '/settings/',
    '/export/',
    '/admin/',
  ];
  return sensitivePatterns.some((pattern) => path.includes(pattern));
}

/**
 * Middleware factory for logging specific actions with custom details.
 * Use this in route handlers for more granular audit logging.
 */
export function auditAction(params: {
  category: 'user_action' | 'data_change' | 'permission_change' | 'system_event';
  action: string;
  resourceType: string;
  getResourceId?: (req: Request) => string;
  getDetails?: (req: Request) => string;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user) {
      const rawResourceId = params.getResourceId?.(req) ?? req.params.id ?? null;
      const resourceId = Array.isArray(rawResourceId)
        ? rawResourceId[0] ?? null
        : rawResourceId === null || rawResourceId === undefined
          ? null
          : String(rawResourceId);
      const rawDetails = params.getDetails?.(req) ?? null;
      const details = Array.isArray(rawDetails) ? rawDetails.join(',') : rawDetails;

      auditService.log({
        category: params.category,
        action: params.action as 'create' | 'update' | 'delete' | 'view' | 'export' | 'import',
        userId: req.user.id,
        userName: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        resourceType: params.resourceType,
        resourceId,
        details,
        requestMethod: req.method,
        requestPath: req.path,
      });
    }
    next();
  };
}
