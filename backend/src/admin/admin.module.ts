import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../logger.service';
import { ConfigModule } from '@nestjs/config';
import {MediaModule} from "../media/media.module";

@Module({
  imports: [ConfigModule, MediaModule],
  controllers: [AdminController],
  providers: [PrismaService, LoggerService],
})
export class AdminModule {}
