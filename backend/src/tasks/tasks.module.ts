import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import {PrismaService} from "../prisma.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [TasksService, PrismaService],
})
export class TasksModule {}
