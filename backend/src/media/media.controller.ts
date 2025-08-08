import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import { UploadCompleteDto } from './dto/upload-complete.dto';
import { MediaGateway } from './media.gateway';

@Controller('api/folders/:folderId/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getFolderMedia(
    @Param('folderId') folderId: string,
    @Headers('x-folder-password') providedPassword?: string,
  ) {
    this.logger.log(`Getting media for folder: ${folderId}`);
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { password: true },
    });
    if (!folder) {
      throw new HttpException(
        { error: 'Folder not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (folder.password && folder.password !== (providedPassword || '')) {
      throw new UnauthorizedException('Invalid folder password');
    }
    return this.mediaService.findByFolder(folderId);
  }

  @Post('generateSignedUrls')
  async generateSignedUrl(
    @Param('folderId') folderId: string,
    @Headers('x-folder-password') providedPassword: string | undefined,
    @Body() generateSignedUrlDtos: GenerateSignedUrlDto[],
  ) {
    // Enforce folder password
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { password: true },
    });
    if (!folder) {
      throw new HttpException(
        { error: 'Folder not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (folder.password && folder.password !== (providedPassword || '')) {
      throw new UnauthorizedException('Invalid folder password');
    }
    const signedUrls: {
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
  async uploadComplete(
    @Param('folderId') folderId: string,
    @Headers('x-folder-password') providedPassword: string | undefined,
    @Body() uploadCompleteDto: UploadCompleteDto,
  ) {
    // Enforce folder password
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { password: true },
    });
    if (!folder) {
      throw new HttpException(
        { error: 'Folder not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (folder.password && folder.password !== (providedPassword || '')) {
      throw new UnauthorizedException('Invalid folder password');
    }
    try {
      return await this.mediaService.handleUploadComplete(uploadCompleteDto);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to confirm upload completion: ${err.message}`);
      throw new HttpException(
        { error: 'Failed to confirm upload completion' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Placeholder route to receive metadata (size, date, uploader) in the future
  @Post('metadata')
  async receiveMetadata(
    @Param('folderId') folderId: string,
    @Body()
    body: {
      filename: string;
      sizeBytes?: number;
      createdAtIso?: string;
      uploadedBy?: string;
    },
  ) {
    // for now we just log and return synchronously
    this.logger.log(
      `Received metadata for folder ${folderId}: ${JSON.stringify(body)}`,
    );
    return Promise.resolve({ ok: true });
  }

  @Delete(':mediaId')
  async deleteMedia(
    @Param('mediaId') mediaId: string,
    @Body('deletedBy') deletedBy?: string,
  ) {
    this.logger.log(
      `Deleting media: ${mediaId}${deletedBy ? ` by ${deletedBy}` : ''}`,
    );
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
  ) {}

  @Post('addThumbnail')
  async addThumbnail(
    @Body('fileName') fileName: string,
    @Body('thumbnailUrl') thumbnailUrl: string,
  ) {
    this.logger.log(`Adding thumbnail: ${fileName}`);
    await this.prisma.media.updateMany({
      where: { originalFilename: fileName },
      data: {
        thumbnailUrl,
      },
    });
    this.mediaGateway.notifyFileProcessed(fileName, thumbnailUrl);
  }

  @Delete(':mediaId')
  async deleteOne(
    @Param('mediaId') mediaId: string,
    @Body('deletedBy') deletedBy?: string,
  ) {
    this.logger.log(
      `Deleting single media: ${mediaId}${deletedBy ? ` by ${deletedBy}` : ''}`,
    );
    return this.mediaService.remove(mediaId);
  }
}
