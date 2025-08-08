import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { PrismaService } from '../prisma.service';
import { MediaModule } from '../media/media.module';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService, PrismaService],
  exports: [FoldersService],
  imports: [MediaModule],
})
export class FoldersModule {}
