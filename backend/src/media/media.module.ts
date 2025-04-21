import { Module } from '@nestjs/common';
import {
  MediaController,
  SingleMediaController,
  FolderDownloadController,
} from './media.controller';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [
    MediaController,
    SingleMediaController,
    FolderDownloadController,
  ],
  providers: [MediaService, PrismaService],
  exports: [MediaService],
})
export class MediaModule {}
