import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Logger,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  async uploadFiles(
    @Param('folderId') folderId: string,
    @UploadedFiles() files,
    @Body() body: any,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }
    
    this.logger.log(
      `Uploading files to folder ${folderId}: ${files.length} files`,
    );
    this.logger.log(`Body: ${JSON.stringify(body)}`);

    // Set uploadedBy to a default value
    const uploadedBy: string = body.uploadedBy || 'User';

    // Process all files and collect promises
    const mediaPromises = files.map(file => {
      const mime = file.mimetype;
      const type: 'photo' | 'video' = mime.startsWith('image/') ? 'photo' : 'video';
      const url = `/uploads/${file.filename}`;
      const originalFilename = file.originalname;
      
      return this.mediaService.createWithFilename(
        folderId,
        url,
        type,
        uploadedBy,
        originalFilename,
      );
    });
    
    // Wait for all files to be processed
    const results = await Promise.all(mediaPromises);
    
    // Return all created media items
    return results;
  }

  @Delete(':mediaId')
  async deleteMedia(@Param('mediaId') mediaId: string) {
    this.logger.log(`Deleting media: ${mediaId}`);
    return this.mediaService.remove(mediaId);
  }
}

@Controller('api/media')
export class SingleMediaController {
  private readonly logger = new Logger(SingleMediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService
  ) {}

  @Delete(':mediaId')
  async deleteOne(@Param('mediaId') mediaId: string) {
    this.logger.log(`Deleting single media: ${mediaId}`);
    return this.mediaService.remove(mediaId);
  }

  @Get(':mediaId/download')
  async downloadOne(
    @Param('mediaId') mediaId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
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

      // Get folder name for the filename
      const folder = await this.prisma.folder.findUnique({
        where: { id: media.folderId }
      });
      
      // Use folder name directly
      const downloadFilename = folder ? `${folder.name}${ext}` : `file${ext}`;

      // Set response headers
      res.set({
        'Content-Type': media.type === 'photo' ? 'image/*' : 'video/*',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      });

      // Create a read stream from the file
      const fileStream = fs.createReadStream(filePath);

      this.logger.log(
        `Streaming file for download: ${filePath} as ${downloadFilename}`,
      );
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
    private readonly prisma: PrismaService,
  ) {}

  @Get('download')
  async downloadFolder(
    @Param('folderId') folderId: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Downloading all media from folder: ${folderId}`);

      // Get all media in the folder
      const mediaItems = await this.mediaService.findByFolder(folderId);

      if (mediaItems.length === 0) {
        this.logger.warn(`No media found in folder: ${folderId}`);
        return res.status(404).json({ message: 'No media found in folder' });
      }

      // Get folder name from the database
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId }
      });
      this.logger.log(`Folder found: ${JSON.stringify(folder)}`);

      if (!folder) {
        this.logger.warn(`Folder not found: ${folderId}`);
        return res.status(404).json({ message: 'Folder not found' });
      }

      // Use the folder name directly
      const zipFilename = `${folder.name}.zip`;
      const zipPath = path.join('./uploads', zipFilename);

      this.logger.log(`Creating zip file: ${zipPath}`);
      // Create a write stream for the zip file
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 0 }, // No compression to preserve file quality
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

            // Get folder name for the filename
            const mediaFolder = await this.prisma.folder.findUnique({
              where: { id: media.folderId }
            });
            
            // Use folder name directly
            let downloadFilename = mediaFolder ? `${mediaFolder.name}${ext}` : `file${ext}`;

            // If name already used, add a suffix
            if (usedFilenames.has(downloadFilename)) {
              let counter = 1;
              let nameBase = downloadFilename.substring(
                0,
                downloadFilename.lastIndexOf('.'),
              );
              const extension = downloadFilename.substring(
                downloadFilename.lastIndexOf('.'),
              );

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
        this.logger.log(
          `Zip file created: ${zipPath} (${archive.pointer()} bytes)`,
        );

        // Set download headers
        res.set({
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${folder.name}.zip"`,
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
