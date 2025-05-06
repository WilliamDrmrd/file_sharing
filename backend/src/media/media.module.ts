import { Module } from '@nestjs/common';
import {
  MediaController,
  SingleMediaController,
} from './media.controller';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { MediaGateway } from './media.gateway';

@Module({
  controllers: [
    MediaController,
    SingleMediaController,
  ],
  providers: [MediaService, PrismaService, MediaGateway],
  exports: [MediaService],
})
export class MediaModule {}
