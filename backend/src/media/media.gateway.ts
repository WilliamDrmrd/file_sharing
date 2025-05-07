import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayDisconnect, OnGatewayConnection
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {PrismaService} from "../prisma.service";
import { Logger } from '@nestjs/common';
import {MediaService} from "./media.service";

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
  },
})
export class MediaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly prisma: PrismaService,
              private readonly mediaService: MediaService) {
  }

  @WebSocketServer() server: Server;
  private logger = new Logger('FileProcessingGateway');

  private clients_files: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients_files.set(client.id, new Set());

    // Listen for file subscriptions
    client.on('subscribeToFile', async (fileName: string) => {
      //TODO change this its not findfirst
      const media = await this.prisma.media.findFirst({
        where: {
          originalFilename: fileName,
          deleted: false
        }
      });
      if (!media)
        return this.logger.error(`File not found: ${fileName}`);
      if (media.thumbnailUrl !== "") {
        this.notifyFileProcessed(fileName, media.thumbnailUrl);
        return;
      }
      const fileNames = this.clients_files.get(client.id);
      if (fileNames) {
        fileNames.add(fileName);
      }
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients_files.delete(client.id);
  }

  notifyFileProcessed(fileName: string, thumbnailUrl: string): boolean {
    // inefficient at large scale.
    this.clients_files.forEach((file, clientId) => {
      if (file.has(fileName)) {
        this.server.to(clientId).emit('fileProcessed_' + fileName, {
          fileName,
          status: 'complete',
          thumbnailUrl
        });
        file.delete(fileName);
        return true;
      }
    });
    return false;
  }
}
