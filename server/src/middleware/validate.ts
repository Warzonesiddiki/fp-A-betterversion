import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

// Extend Express Request to carry validated data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated?: unknown;
    }
  }
}

/**
 * Formats Zod errors into a flat, human-readable array.
 */
function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On success, attaches the parsed (and coerced) data to req.validated.
 * On failure, returns 400 with structured error details.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: formatZodErrors(result.error),
      });
      return;
    }

    req.validated = result.data;
    next();
  };
}
