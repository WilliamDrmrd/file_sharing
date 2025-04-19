import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';

@Controller('api/folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async findAll() {
    return this.foldersService.findAll();
  }

  @Post()
  async create(@Body() createFolderDto: CreateFolderDto) {
    return this.foldersService.create(createFolderDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Post(':id/verify')
  async verifyPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.foldersService.verifyPassword(id, body.password);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}
