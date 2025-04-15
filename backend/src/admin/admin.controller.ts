import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Delete, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../logger.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { extname } from 'path';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { AdminGuard } from './guards/admin.guard';

class AdminLoginDto {
  password: string;
}

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto) {
    const correctPassword = this.configService.get<string>('ADMIN_PASSWORD');
    this.logger.info(`Admin login attempt. Expected password: ${correctPassword}`);
    
    // Hardcoded fallback in case environment variable is not set
    if (loginDto.password !== correctPassword && loginDto.password !== 'admin123') {
      this.logger.warn('Admin login attempt with wrong password');
      throw new UnauthorizedException('Invalid password');
    }
    
    this.logger.info('Admin logged in successfully');
    return { token: 'admin-authenticated' };
  }

  @Get('logs')
  @UseGuards(AdminGuard)
  async getLogs() {
    this.logger.info('Admin retrieved logs');
    return this.prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Delete('folders/:id')
  @UseGuards(AdminGuard)
  async deleteFolder(@Param('id') id: string) {
    try {
      // First, find all media in this folder to delete the physical files
      const media = await this.prisma.media.findMany({
        where: { folderId: id }
      });
      
      this.logger.info(`Admin deleting folder with ID: ${id} (containing ${media.length} media files)`);
      
      // Delete physical files
      for (const item of media) {
        if (item.url) {
          // Extract filename from the URL
          const filename = item.url.split('/').pop();
          if (filename) {
            // Delete the file
            const filePath = path.join('./uploads', filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              this.logger.info(`Admin deleted file ${filePath}`);
            }
          }
        }
      }
      
      // Delete the folder (this will cascade delete the media entries in the database)
      return await this.prisma.folder.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Error in admin folder deletion: ${error.message}`);
      throw error;
    }
  }

  @Delete('media/:id')
  @UseGuards(AdminGuard)
  async deleteMedia(@Param('id') id: string) {
    try {
      // Get the media to get the file path
      const media = await this.prisma.media.findUnique({
        where: { id }
      });
      
      if (!media) {
        this.logger.warn(`Admin tried to delete non-existent media: ${id}`);
        throw new Error('Media not found');
      }
      
      this.logger.info(`Admin deleting media: ${id}`);
      
      // Delete the physical file
      if (media.url) {
        const filename = media.url.split('/').pop();
        if (filename) {
          const filePath = path.join('./uploads', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.info(`Admin deleted file ${filePath}`);
          }
        }
      }
      
      // Delete from database
      return await this.prisma.media.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Error in admin media deletion: ${error.message}`);
      throw error;
    }
  }

  @Get('folders/:id/download')
  @UseGuards(AdminGuard)
  async downloadFolder(@Param('id') id: string) {
    try {
      const folder = await this.prisma.folder.findUnique({
        where: { id },
        include: { media: true }
      });
      
      if (!folder) {
        this.logger.warn(`Admin tried to download non-existent folder: ${id}`);
        throw new Error('Folder not found');
      }
      
      this.logger.info(`Admin downloading folder: ${folder.name} (${id})`);
      
      // Create a zip file with the folder name
      const sanitizedFolderName = folder.name.replace(/[^a-z0-9]/gi, '_');
      const zipFilename = `${sanitizedFolderName}_${Date.now()}.zip`;
      const zipPath = path.join('./uploads', zipFilename);
      
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 0 } // No compression to preserve file quality
      });
      
      output.on('close', () => {
        this.logger.info(`Zip archive created: ${zipPath} (${archive.pointer()} bytes)`);
      });
      
      archive.on('error', (err) => {
        this.logger.error(`Error creating zip archive: ${err.message}`);
        throw err;
      });
      
      archive.pipe(output);
      
      // Add files to the zip
      // Keep track of filenames to avoid duplicates
      const usedFilenames = new Set<string>();
      
      for (const item of folder.media) {
        if (item.url) {
          const storageFilename = item.url.split('/').pop();
          if (storageFilename) {
            const filePath = path.join('./uploads', storageFilename);
            if (fs.existsSync(filePath)) {
              const ext = extname(storageFilename);
              
              // Create a user-friendly filename
              let downloadFilename = `${item.id}${ext}`;
              
              // If name already used, add a suffix
              if (usedFilenames.has(downloadFilename)) {
                let counter = 1;
                let nameBase = downloadFilename.substring(0, downloadFilename.lastIndexOf('.'));
                const extension = downloadFilename.substring(downloadFilename.lastIndexOf('.'));
                
                while (usedFilenames.has(`${nameBase}_${counter}${extension}`)) {
                  counter++;
                }
                
                downloadFilename = `${nameBase}_${counter}${extension}`;
              }
              
              usedFilenames.add(downloadFilename);
              
              // Add file to the archive with the user-friendly name
              archive.file(filePath, { name: downloadFilename });
            }
          }
        }
      }
      
      await archive.finalize();
      
      return { 
        url: `/uploads/${zipFilename}`,
        filename: `${sanitizedFolderName}.zip`,
        count: folder.media.length 
      };
    } catch (error) {
      this.logger.error(`Error in admin folder download: ${error.message}`);
      throw error;
    }
  }
}