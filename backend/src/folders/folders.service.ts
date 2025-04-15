import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);
  
  constructor(private prisma: PrismaService) {}

  async findAll() {
    this.logger.log('Finding all folders');
    const folders = await this.prisma.folder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
      },
    });
    
    this.logger.log(`Found ${folders.length} folders`);
    return folders.map(f => ({
      ...f,
      password: undefined, // don't send passwords
      mediaCount: f.media.length,
    }));
  }

  async create(data: CreateFolderDto) {
    this.logger.log(`Creating folder: ${JSON.stringify(data)}`);
    return await this.prisma.folder.create({ data });
  }

  async remove(id: string) {
    this.logger.log(`Removing folder with ID: ${id}`);
    
    try {
      // First, find all media in this folder to delete the physical files
      const media = await this.prisma.media.findMany({
        where: { folderId: id }
      });
      
      this.logger.log(`Found ${media.length} media files to delete`);
      
      // Delete physical files
      for (const item of media) {
        if (item.url) {
          this.logger.log(`Removing file: ${item.url}`);
          // Extract filename from the URL
          const filename = item.url.split('/').pop();
          if (filename) {
            // Delete the file
            const filePath = path.join('./uploads', filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              this.logger.log(`File ${filePath} deleted successfully`);
            } else {
              this.logger.warn(`File not found: ${filePath}`);
            }
          }
        }
      }
      
      // Delete the folder (this will cascade delete the media entries in the database)
      return await this.prisma.folder.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Error removing folder: ${error.message}`);
      throw error;
    }
  }
}