import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MediaType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
  
  async createWithFilename(folderId: string, url: string, type: MediaType, uploadedBy: string, originalFilename: string) {
    this.logger.log(`Creating media for folder ${folderId}, type ${type}, url ${url}, originalFilename ${originalFilename}`);
    return this.prisma.media.create({
      data: { folderId, url, type, uploadedBy, originalFilename }
    });
  }

  async remove(mediaId: string) {
    this.logger.log(`Removing media from database: ${mediaId}`);
    try {
      // First get the media to see the file path
      const media = await this.findById(mediaId);
      if (media && media.url) {
        this.logger.log(`Removing file from disk: ${media.url}`);
        // Extract filename from the URL
        const filename = media.url.split('/').pop();
        if (filename) {
          // Delete the physical file
          const filePath = path.join('./uploads', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.log(`File ${filePath} deleted successfully`);
          } else {
            this.logger.warn(`File not found: ${filePath}`);
          }
        }
      }
      
      // Remove from database
      return this.prisma.media.delete({ where: { id: mediaId } });
    } catch (error) {
      this.logger.error(`Error deleting media: ${error.message}`);
      throw error;
    }
  }
}