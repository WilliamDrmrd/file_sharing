import { Module } from '@nestjs/common';
import { FoldersModule } from './folders/folders.module';
import { MediaModule } from './media/media.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './prisma.service';
import { LoggerService } from './logger.service';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [ConfigModule.forRoot(), FoldersModule, MediaModule, AdminModule, TasksModule],
  providers: [PrismaService, LoggerService],
  exports: [LoggerService],
})
export class AppModule {}
