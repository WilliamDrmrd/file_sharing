import {Injectable, Logger} from '@nestjs/common';
import {PrismaService} from '../prisma.service';
import {Media, MediaType} from '@prisma/client';
import {Storage, GetSignedUrlConfig} from '@google-cloud/storage';
import {UploadCompleteDto} from './dto/upload-complete.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  public thumbnailProcessed: Map<string, string> = new Map();

  constructor(private prisma: PrismaService) {
    const projectId = process.env.GCLOUD_PROJECT_ID || 'default-project-id';
    const keyFilename =
      process.env.GCLOUD_KEY_FILE || '/path/to/default-key.json';

    this.storage = new Storage({projectId, keyFilename});
    this.bucketName = process.env.GCLOUD_BUCKET_NAME || 'default-bucket-name';
  }

  /**
   * Generates a signed URL for uploading files to Google Cloud Storage.
   * @param filename The name of the file to be uploaded.
   * @param contentType The MIME type of the file.
   * @returns A signed URL string.
   */
  async generateSignedUrlWrite(
    filename: string,
    contentType: string,
  ): Promise<{ url: string; finalFilename: string }> {
    this.logger.log(
      `Generating signed URL for ${filename} with content type ${contentType}`,
    );
    if (!filename || !contentType) {
      this.logger.error(
        'Filename and content type are required for signed URL generation.',
      );
      throw new Error('Filename and content type are required');
    }

    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    };

    const files = await this.prisma.media.findMany({
      where: {
        originalFilename: {
          startsWith: filename.split('.')[0],
        },
      },
    });
    const finalFilename = files.length > 0
      ? `${filename.split('.')[0]}-${files.length}.${filename.split('.').pop()}`
      : filename;

    try {
      const [url] = await this.storage
      .bucket(this.bucketName)
      .file(finalFilename)
      .getSignedUrl(options);

      this.logger.log(`Generated signed URL for ${finalFilename}`);
      return {url, finalFilename};
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${finalFilename}: ${error.message}`,
      );
      throw new Error('Failed to generate signed URL');
    }
  }

  async generateSignedUrlRead(bucketName: string, filename: string): Promise<string> {
    const options = {
      version: 'v4' as 'v4',
      action: 'read' as 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 year expiration (maximum recommended)
    };

    try {
      const [url] = await this.storage
      .bucket(bucketName)
      .file(filename)
      .getSignedUrl(options);

      console.log(`Generated signed URL for ${filename}: ${url}`);
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  async handleUploadComplete(data: UploadCompleteDto): Promise<Media> {
    if (!data.filename) {
      this.logger.error('Filename is required to confirm upload completion.');
      throw new Error('Filename is required');
    }

    const url = await this.generateSignedUrlRead(this.bucketName, data.filename);

    this.logger.log(`File ${data.filename} upload complete`);
    return this.prisma.media.create({
      data: {
        folderId: data.folderId,
        url: url,
        type: data.type,
        uploadedBy: data.uploadedBy,
        originalFilename: data.filename,
      },
    });
  }

  async findByFolder(folderId: string) {
    this.logger.log(`Finding media for folder: ${folderId}`);
    return this.prisma.media.findMany({
      where: {
        folderId,
        deleted: false,
      },
      orderBy: {uploadedAt: 'desc'},
    });
  }

  async findById(mediaId: string) {
    this.logger.log(`Finding media by ID: ${mediaId}`);
    return this.prisma.media.findUnique({
      where: {id: mediaId},
    });
  }

  async create(
    folderId: string,
    url: string,
    type: MediaType,
    uploadedBy: string,
  ) {
    this.logger.log(
      `Creating media for folder ${folderId}, type ${type}, url ${url}`,
    );
    return this.prisma.media.create({
      data: {folderId, url, type, uploadedBy},
    });
  }

  async createWithFilename(
    folderId: string,
    url: string,
    type: MediaType,
    uploadedBy: string,
    originalFilename: string,
  ) {
    this.logger.log(
      `Creating media for folder ${folderId}, type ${type}, url ${url}, originalFilename ${originalFilename}`,
    );
    return this.prisma.media.create({
      data: {folderId, url, type, uploadedBy, originalFilename},
    });
  }

  async remove(mediaId: string): Promise<Media> {
    this.logger.log(`Removing media from database: ${mediaId}`);
    try {
      // First get the media to see the file path
      const media = await this.findById(mediaId);
      if (!(media && media.url && media.originalFilename))
        throw new Error("media ID not found in the DB");
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(media.originalFilename);

      await file.rename("deleted_" + file.name);
      console.log(`File ${media.originalFilename} soft-deleted from GCS`);

      // @ts-ignore
      if ((await this.prisma.folder.findUnique({
        where: {id: media.folderId},
        include: {
          media: {
            where: {
              deleted: false
            }
          }
        }
      })).media.length === 1) {
        this.logger.log(`Deleting folder ${media.folderId} as it has no more media`);
        await this.prisma.folder.update({
          where: {
            id: media.folderId
          },
          data: {
            deleted: true
          }
        })
      }
      this.logger.log(`Removing media from database: ${mediaId}`);
      return this.prisma.media.update({
        where: {
          id: mediaId
        },
        data: {
          originalFilename: "deleted_" + media.originalFilename,
          deleted: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error deleting media: ${error.message}`);
      throw error;
    }
  }
}
