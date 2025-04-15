import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  
  constructor(private prisma: PrismaService) {}

  async findByFolder(folderId: string) {
    this.logger.log(`Finding media for folder: ${folderId}`);
    return this.prisma.media.findMany({
      where: { folderId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async findById(mediaId: string) {
    this.logger.log(`Finding media by ID: ${mediaId}`);
    return this.prisma.media.findUnique({
      where: { id: mediaId }
    });
  }

  async create(folderId: string, url: string, type: MediaType, uploadedBy: string) {
    this.logger.log(`Creating media for folder ${folderId}, type ${type}, url ${url}`);
    return this.prisma.media.create({
      data: { folderId, url, type, uploadedBy }
    });
  }

  async remove(mediaId: string) {
    this.logger.log(`Removing media from database: ${mediaId}`);
    return this.prisma.media.delete({ where: { id: mediaId } });
  }
}