import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
      logger: Logger;
    }
  }
}
