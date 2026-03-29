import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../utils/AppError';

/**
 * Runs a chain of express-validator checks then rejects if any fail.
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(chains.map((chain) => chain.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((e) => e.msg as string);
      throw new AppError(`Validation failed: ${messages.join('; ')}`, 422, errors.array());
    }
    next();
  };
}
