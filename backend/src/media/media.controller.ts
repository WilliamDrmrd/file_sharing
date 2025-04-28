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
  ) {
  }

  @Delete(':mediaId')
  async deleteOne(@Param('mediaId') mediaId: string) {
    this.logger.log(`Deleting single media: ${mediaId}`);
    return this.mediaService.remove(mediaId);
  }
}

@Controller('api/folders/:folderId')
export class FolderDownloadController {
  private readonly logger = new Logger(FolderDownloadController.name);

  constructor(
      private readonly mediaService: MediaService,
      private readonly prisma: PrismaService,
  ) {
  }

  @Get('download')
  async downloadFolder(
      @Param('folderId') folderId: string,
      @Res() res: Response,
  ) {
  }
}
