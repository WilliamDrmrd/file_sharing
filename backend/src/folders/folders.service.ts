import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {PrismaService} from '../prisma.service';
import {CreateFolderDto} from './dto/create-folder.dto';
import {MediaService} from '../media/media.service';
import {Folder, Media} from "@prisma/client";
import {GoogleAuth} from 'google-auth-library';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);
  private readonly auth = new GoogleAuth();

  constructor(private prisma: PrismaService,
              private mediaService: MediaService) {
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

  async getCloudBearerToken() {
    const targetAudience = 'https://zip-snapshare-dev-422509752350.asia-northeast2.run.app';

    try {
      const client = await this.auth.getIdTokenClient(targetAudience);
      return await client.idTokenProvider.fetchIdToken(targetAudience);
    } catch (error) {
      this.logger.error(`Error fetching ID token: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch ID token');
    }
  }

  async getZip(folderId: string) {
    this.logger.log(`Creating zip for folder: ${folderId}`);
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

    return fetch(`https://zip-snapshare-dev-422509752350.asia-northeast2.run.app`, {
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
            console.error('Error response:', result);
          }
          console.error(response);
          throw new Error('Failed to create zip');
        }
        this.logger.log(`Zip created successfully for folder: ${folderId}`);
        return response.json();
      })
      .catch((error) => {
        this.logger.error(`Error creating zip: ${error.message}`);
        throw error;
      });
  }
}
