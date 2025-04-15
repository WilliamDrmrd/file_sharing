import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LoggerService {
  constructor(private prisma: PrismaService) {}

  async info(action: string, details?: string, entityId?: string) {
    console.log(`[INFO] ${action} - ${details || ''} - ${entityId || ''}`);
    return this.prisma.log.create({
      data: {
        action,
        details,
        entityId,
        level: 'info',
      },
    });
  }

  async warn(action: string, details?: string, entityId?: string) {
    console.warn(`[WARN] ${action} - ${details || ''} - ${entityId || ''}`);
    return this.prisma.log.create({
      data: {
        action,
        details,
        entityId,
        level: 'warn',
      },
    });
  }

  async error(action: string, details?: string, entityId?: string) {
    console.error(`[ERROR] ${action} - ${details || ''} - ${entityId || ''}`);
    return this.prisma.log.create({
      data: {
        action,
        details,
        entityId,
        level: 'error',
      },
    });
  }
}