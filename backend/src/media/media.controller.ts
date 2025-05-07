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
} from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import { UploadCompleteDto } from './dto/upload-complete.dto';
import {MediaGateway} from "./media.gateway";

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
        const signedUrl = await this.mediaService.generateSignedUrlWrite(
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
      private readonly mediaGateway: MediaGateway,
  ) {
  }

  @Post('addThumbnail')
  async addThumbnail(
      @Body('fileName') fileName: string,
      @Body('thumbnailUrl') thumbnailUrl: string,
  ) {
    this.logger.log(`Adding thumbnail: ${fileName}`);
    await this.prisma.media.updateMany({
      where: {originalFilename: fileName},
      data: {
        thumbnailUrl
      }
    });
    this.mediaGateway.notifyFileProcessed(fileName, thumbnailUrl);
  }

  @Delete(':mediaId')
  async deleteOne(@Param('mediaId') mediaId: string) {
    this.logger.log(`Deleting single media: ${mediaId}`);
    return this.mediaService.remove(mediaId);
  }
}
