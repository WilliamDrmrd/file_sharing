import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../logger.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [AdminController],
  providers: [PrismaService, LoggerService],
})
export class AdminModule {}
