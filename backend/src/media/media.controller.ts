import {
  Controller, Get, Post, Delete, Param,
  UploadedFile, UseInterceptors, Body, Logger,
  Res, StreamableFile
} from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import * as archiver from 'archiver';

// Import multer typings
import 'multer';

@Controller('api/folders/:folderId/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getFolderMedia(@Param('folderId') folderId: string) {
    this.logger.log(`Getting media for folder: ${folderId}`);
    return this.mediaService.findByFolder(folderId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueSuffix);
      },
    }),
  }))
  async uploadFile(
    @Param('folderId') folderId: string,
    @UploadedFile() file,
    @Body() body: any,
  ) {
    this.logger.log(`Uploading file to folder ${folderId}: ${JSON.stringify(file)}`);
    this.logger.log(`Body: ${JSON.stringify(body)}`);
    
    // Determine the type
    const mime = file.mimetype;
    this.logger.log(`File MIME type: ${mime}`);
    
    let type: 'photo' | 'video' = mime.startsWith('image/') ? 'photo' : 'video';
    this.logger.log(`Determined file type: ${type}`);

    // Set uploadedBy to a default value
    const uploadedBy: string = body.uploadedBy || "User";

    const url = `/uploads/${file.filename}`;
    this.logger.log(`File URL: ${url}`);
    
    // Store the original filename
    const originalFilename = file.originalname;
    this.logger.log(`Original filename: ${originalFilename}`);
    
    return this.mediaService.createWithFilename(folderId, url, type, uploadedBy, originalFilename);
  }

  @Delete(':mediaId')
  async deleteMedia(
    @Param('mediaId') mediaId: string
  ) {
    this.logger.log(`Deleting media: ${mediaId}`);
    try {
      // First get the media to see the file path
      const media = await this.mediaService.findById(mediaId);
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
      return this.mediaService.remove(mediaId);
    } catch (error) {
      this.logger.error(`Error deleting media: ${error.message}`);
      throw error;
    }
  }
}

@Controller('api/media')
export class SingleMediaController {
  private readonly logger = new Logger(SingleMediaController.name);
  
  constructor(private readonly mediaService: MediaService) {}

  @Delete(':mediaId')
  async deleteOne(@Param('mediaId') mediaId: string) {
    this.logger.log(`Deleting single media: ${mediaId}`);
    try {
      // First get the media to see the file path
      const media = await this.mediaService.findById(mediaId);
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
      return this.mediaService.remove(mediaId);
    } catch (error) {
      this.logger.error(`Error deleting single media: ${error.message}`);
      throw error;
    }
  }

  @Get(':mediaId/download')
  async downloadOne(@Param('mediaId') mediaId: string, @Res({ passthrough: true }) res: Response) {
    try {
      this.logger.log(`Downloading media: ${mediaId}`);
      
      // Find the media in the database
      const media = await this.mediaService.findById(mediaId);
      if (!media) {
        this.logger.warn(`Media not found for download: ${mediaId}`);
        throw new Error('Media not found');
      }
      
      // Extract filename from the URL
      const filename = media.url.split('/').pop();
      if (!filename) {
        this.logger.warn(`Invalid media URL: ${media.url}`);
        throw new Error('Invalid media URL');
      }
      
      // Get the file path
      const filePath = path.join('./uploads', filename);
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found on disk: ${filePath}`);
        throw new Error('File not found on disk');
      }
      
      // Get extension
      const ext = extname(filename);
      
      // Use original filename if available, otherwise use ID
      let downloadFilename = media.originalFilename || `file_${media.id}${ext}`;
      
      // Ensure filename has correct extension
      if (!downloadFilename.endsWith(ext)) {
        downloadFilename = `${downloadFilename}${ext}`;
      }
      
      // Set response headers
      res.set({
        'Content-Type': media.type === 'photo' ? 'image/*' : 'video/*',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      });
      
      // Create a read stream from the file
      const fileStream = fs.createReadStream(filePath);
      
      this.logger.log(`Streaming file for download: ${filePath} as ${downloadFilename}`);
      return new StreamableFile(fileStream);
    } catch (error) {
      this.logger.error(`Error downloading media: ${error.message}`);
      throw error;
    }
  }
}

@Controller('api/folders/:folderId')
export class FolderDownloadController {
  private readonly logger = new Logger(FolderDownloadController.name);
  
  constructor(
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService
  ) {}
  
  @Get('download')
  async downloadFolder(@Param('folderId') folderId: string, @Res() res: Response) {
    try {
      this.logger.log(`Downloading all media from folder: ${folderId}`);
      
      // Get all media in the folder
      const mediaItems = await this.mediaService.findByFolder(folderId);
      
      if (mediaItems.length === 0) {
        this.logger.warn(`No media found in folder: ${folderId}`);
        return res.status(404).json({ message: 'No media found in folder' });
      }
      
      // Get folder name to use in zip filename
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId },
        select: { name: true }
      });
      
      // Use folder name in the zip filename if available
      const zipFilename = `${folder}_${Date.now()}.zip`;
      const zipPath = path.join('./uploads', zipFilename);
      
      // Create a write stream for the zip file
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 0 } // No compression to preserve file quality
      });
      
      // Pipe the archive to the output file
      archive.pipe(output);
      
      // Add all media files to the archive
      // Keep track of filenames to avoid duplicates
      const usedFilenames = new Set<string>();
      
      for (const media of mediaItems) {
        const storageFilename = media.url.split('/').pop();
        if (storageFilename) {
          const filePath = path.join('./uploads', storageFilename);
          if (fs.existsSync(filePath)) {
            const ext = extname(storageFilename);
            
            // Create a user-friendly filename using original filename if available
            let downloadFilename = media.originalFilename || `file_${media.id}${ext}`;
            
            // Ensure filename has correct extension
            if (!downloadFilename.endsWith(ext)) {
              downloadFilename = `${downloadFilename}${ext}`;
            }
            
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
      
      // Finalize the archive
      await archive.finalize();
      
      // When the zip is done, send it as a download
      output.on('close', () => {
        this.logger.log(`Zip file created: ${zipPath} (${archive.pointer()} bytes)`);
        
        // Set download headers
        res.set({
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${sanitizedFolderName}.zip"`,
        });
        
        // Send the zip file
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);
        
        // Delete the temporary zip after sending
        fileStream.on('end', () => {
          fs.unlinkSync(zipPath);
          this.logger.log(`Temporary zip file deleted: ${zipPath}`);
        });
      });
      
      archive.on('error', (err) => {
        this.logger.error(`Error creating zip: ${err.message}`);
        res.status(500).json({ message: 'Error creating zip file' });
      });
    } catch (error) {
      this.logger.error(`Error downloading folder: ${error.message}`);
      res.status(500).json({ message: 'Error downloading folder' });
    }
  }
}