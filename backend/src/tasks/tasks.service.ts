import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Storage } from "@google-cloud/storage";
import {PrismaService} from "../prisma.service";
import * as path from 'path';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly storage: Storage;
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {
    const projectId = process.env.GCLOUD_PROJECT_ID || 'default-project-id';
    const keyFilename =
      process.env.GCLOUD_KEY_FILE || '/path/to/default-key.json';

    this.storage = new Storage({projectId, keyFilename});
  }

  async generateFileWithNames() {
    const fileNames = await this.prisma.media.findMany({
      where: {
        deleted: false,
      },
      select: {
        originalFilename: true,
      },
    });
    const fs = require('fs');

    const filePath = './fileNames.json';
    fs.writeFileSync(filePath, JSON.stringify(fileNames, null, 2), 'utf-8');
    this.logger.log(`File with names generated at ${filePath}`);
  }

  async onModuleInit() {
    this.logger.log("Application started");
    // Uncomment this if you want to update signed URLs on application start
    // await this.updateSignedUrls();

    // Uncomment this if you want to generate a file with all filenames
    // await this.generateFileWithNames();
  }

  // This will run every 7 days (weekly)
  @Cron('0 0 * * 0') // This runs at midnight on Sunday
  async scheduleUpdateSignedUrls() {
    this.logger.log('Running scheduled weekly task "updateSignedUrls"');
    await this.updateSignedUrls();
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

  async updateMedias() {
    const media = await this.prisma.media.findMany({
      where: {
        deleted: false,
      },
    });

    await Promise.all(
      media.map(async (file) => {
        try {
          if (!file.originalFilename) {
            this.logger.warn(`File ${file.id} does not have an original filename.`);
            return;
          }
          const url = await this.generateSignedUrlRead(
            process.env.GCLOUD_BUCKET_NAME || 'default-bucket-name',
            file.originalFilename
          );
          const thumbnailUrl = file.thumbnailUrl ? (await this.generateSignedUrlRead(
            process.env.GCLOUD_BUCKET_NAME_THUMBNAIL || 'default-bucket-name',
            `thumbnail-${path.parse(file.originalFilename).name}.jpg`
          )) : "";

          return this.prisma.media.update({
            where: { id: file.id },
            data: { url, thumbnailUrl },
          });
        } catch (error) {
          this.logger.error(`Failed generate signed url for file ${file.id}: ${error.message}`);
          return null;
        }
      })
    );
  }

  async updateZips() {
    const folders = await this.prisma.folder.findMany({
      where: {
        deleted: false,
      },
    });

    await Promise.all(folders.map(async (folder) => {
      try {
        const url = await this.generateSignedUrlRead(
        process.env.GCLOUD_BUCKET_NAME_ZIP || 'default-bucket-name',
        "zip_" + folder.name + ".zip"
      );
      return this.prisma.folder.update({
        where: {id: folder.id},
        data: {zipUrl: url}
      });
    } catch (error) {
      this.logger.error(`Failed to generate signed url for folder ${folder.id}: ${error.message}`);
      return null;
    }}));
  }

  private async updateSignedUrls() {
    try {
      await this.updateMedias();
      this.logger.log('--Successfully updated signed URLs for all media files.');

      await this.updateZips();
      this.logger.log('--Successfully updated signed URLs for all zips.');

    } catch (error) {
      this.logger.error('Error executing task:', error);
    }
  }
}
