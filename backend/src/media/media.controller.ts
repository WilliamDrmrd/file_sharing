import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { Response } from 'express';
import * as archiver from 'archiver';

import 'multer';
import { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import { UploadCompleteDto } from './dto/upload-complete.dto';

@Controller('api/folders/:folderId/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getFolderMedia(@Param('folderId') folderId: string) {
    this.logger.log(`Getting media for folder: ${folderId}`);
    return this.mediaService.findByFolder(folderId);
  }

  @Post('generateSignedUrls')
  async generateSignedUrl(
    @Body() generateSignedUrlDtos: GenerateSignedUrlDto[],
  ) {
    let signedUrls: {
      signedUrl: string;
      filename: string;
      contentType: string;
      type: string;
    }[] = [];
    for (const toGenerate of generateSignedUrlDtos) {
      const { filename, contentType, type } = toGenerate;

      if (!filename || !contentType) {
        throw new HttpException(
          { error: 'Filename and contentType are required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      try {
        const signedUrl = await this.mediaService.generateSignedUrl(
          filename,
          contentType,
        );
        signedUrls.push({
          signedUrl: signedUrl.url,
          filename: signedUrl.finalFilename,
          contentType,
          type,
        });
      } catch (error) {
        console.error(error);
        throw new HttpException(
          { error: 'Failed to generate signed URL' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    return signedUrls;
  }

  @Post('uploadComplete')
  async uploadComplete(@Body() uploadCompleteDto: UploadCompleteDto) {
    try {
      return await this.mediaService.handleUploadComplete(uploadCompleteDto);
    } catch (error) {
      this.logger.error(
        `Failed to confirm upload completion: ${error.message}`,
      );
      throw new HttpException(
        { error: 'Failed to confirm upload completion' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    private readonly prisma: PrismaService,
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
      // Set response headers
      res.set({
        'Content-Type': media.type === 'photo' ? 'image/*' : 'video/*',
        'Content-Disposition': `attachment; filename="${media.originalFilename}"`,
      });

      // Create a read stream from the file
      const fileStream = fs.createReadStream(filePath);

      this.logger.log(
        `Streaming file for download: ${filePath} as ${media.originalFilename}`,
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
        where: { id: folderId },
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
          if (fs.existsSync(filePath) && media.originalFilename) {
            // If name already used, add a suffix
            if (usedFilenames.has(media.originalFilename)) {
              let counter = 1;
              const nameBase = media.originalFilename.substring(
                0,
                media.originalFilename.lastIndexOf('.'),
              );
              const extension = media.originalFilename.substring(
                media.originalFilename.lastIndexOf('.'),
              );

              while (usedFilenames.has(`${nameBase}_${counter}${extension}`)) {
                counter++;
              }

              media.originalFilename = `${nameBase}_${counter}${extension}`;
            }

            usedFilenames.add(media.originalFilename);

            // Add file to the archive with the user-friendly name
            archive.file(filePath, { name: media.originalFilename });
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
