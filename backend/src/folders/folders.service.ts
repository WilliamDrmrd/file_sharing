import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {PrismaService} from '../prisma.service';
import {CreateFolderDto} from './dto/create-folder.dto';
import {MediaService} from '../media/media.service';
import {Folder, Media} from "@prisma/client";
import {GoogleAuth} from 'google-auth-library';
import {Storage} from "@google-cloud/storage";
const crypto = require('crypto');

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);
  private readonly auth = new GoogleAuth();
  private readonly storage: Storage;

  constructor(private prisma: PrismaService,
              private mediaService: MediaService) {
    const projectId = process.env.GCLOUD_PROJECT_ID || 'default-project-id';
    const keyFilename =
      process.env.GCLOUD_KEY_FILE || '/path/to/default-key.json';

    this.storage = new Storage({projectId, keyFilename});
  }

  async findAll() {
    this.logger.log('Finding all folders');
    const folders = await this.prisma.folder.findMany({
      where: {
        deleted: false,
      },
      orderBy: {createdAt: 'desc'},
      include: {
        media: {
          where: {
            deleted: false
          }
        },
      },
    });

    this.logger.log(`Found ${folders.length} folders`);
    return folders.map((f) => ({
      ...f,
      password: undefined, // don't send passwords
      mediaCount: f.media.length,
    }));
  }

  async findOne(id: string) {
    this.logger.log(`Finding folder with ID: ${id}`);
    const folder = await this.prisma.folder.findUnique({
      where: {id},
      include: {
        media: true,
      },
    });

    if (!folder) {
      this.logger.warn(`Folder not found: ${id}`);
      return null;
    }

    return {
      ...folder,
      password: folder.password ? true : undefined, // Only indicate if password exists, don't send actual password
      mediaCount: folder.media.length,
    };
  }

  async verifyPassword(id: string, password: string) {
    this.logger.log(`Verifying password for folder: ${id}, ${password}`);

    const folder = await this.prisma.folder.findUnique({
      where: {id},
      select: {password: true},
    });

    if (!folder) {
      this.logger.warn(`Folder not found for password verification: ${id}`);
      return {verified: false};
    }

    // If folder has no password, or password matches
    const verified = !folder.password || folder.password === password;

    this.logger.log(`Password verification result: ${verified}`);
    return {verified};
  }

  async create(data: CreateFolderDto) {
    this.logger.log(`Creating folder: ${JSON.stringify(data)}`);
    return this.prisma.folder.create({data});
  }

  async remove(id: string) {
    this.logger.log(`Removing folder with ID: ${id}`);

    try {
      // First, find all media in this folder to delete the physical files
      const media = await this.prisma.media.findMany({
        where: {
          folderId: id,
          deleted: false
        },
      });

      this.logger.log(`Found ${media.length} media files to delete`);

      for (const item of media) {
        await this.mediaService.remove(item.id);
      }

      return await this.prisma.folder.update({
        where: {id},
        data: {deleted: true}
      });
    } catch (error) {
      this.logger.error(`Error removing folder: ${error.message}`);
      throw error;
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

      this.logger.log(`Generated signed URL for ${filename}`);
      return url;
    } catch (error) {
      this.logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  async getCloudBearerToken() {
    const targetAudience = process.env.ZIP_CLOUD_URL || "";

    try {
      const client = await this.auth.getIdTokenClient(targetAudience);
      return await client.idTokenProvider.fetchIdToken(targetAudience);
    } catch (error) {
      this.logger.error(`Error fetching ID token: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch ID token');
    }
  }

  async getZip(folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: {id: folderId},
      include: {
        media: {
          where: {
            deleted: false
          }
        },
      },
    }) as Folder & { media: Media[] } | null;
    if (!folder) {
      this.logger.warn(`Folder not found for zipping: ${folderId}`);
      return null;
    }

    const fileNames = folder.media.reduce(
      (acc, item) => {
        acc += item.originalFilename;
        return acc;
      },
      ""
    );
    const hash = crypto.createHash('sha256').update(fileNames, 'utf8').digest('hex');
    if (folder.zipHash === hash) {
      this.logger.log(`Same Zip Hash found for zipping: ${hash}`);
      return {zipFileName: folder.zipUrl};
    }

    this.logger.log(`Creating zip for folder: ${folderId}`);
    return fetch(process.env.ZIP_CLOUD_URL || "", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getCloudBearerToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: folder.media.map((m) => m.originalFilename),
        folderName: folder.name,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.body) {
            const reader = response.body.getReader();
            let result = '';

            while (true) {
              const {done, value} = await reader.read();
              if (done) break;
              result += new TextDecoder().decode(value); // Decode the chunk into a string.
            }
            this.logger.error('Error response:', result);
          }
          this.logger.error(response);
          throw new Error('Failed to create zip');
        }
        this.logger.log(`Zip created successfully for folder: ${folderId}`);

        const zipUrl = (await response.json() as {zipFileName: string}).zipFileName
        const url = await this.generateSignedUrlRead(process.env.GCLOUD_BUCKET_NAME_ZIP || "", zipUrl);
        this.logger.log(`Signed URL generated successfully for folder: ${folderId}`);

        await this.prisma.folder.update({
          where: {id: folderId},
          data: {
            zipUrl: url,
            zipHash: hash
          }
        })
        return {zipFileName: url};
      })
      .catch((error) => {
        this.logger.error(`Error creating zip: ${error.message}`);
        throw error;
      });
  }
}
