import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}