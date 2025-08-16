import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  Logger,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';

@Controller('api/folders')
export class FoldersController {
  private readonly logger = new Logger(FoldersController.name);

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

  // @Delete(':id')
  // async remove(
  //   @Param('id') id: string,
  //   @Body('deletedBy') deletedBy?: string,
  // ) {
  //   this.logger.log(
  //     `Deleting folder: ${id}${deletedBy ? ` by ${deletedBy}` : ''}`,
  //   );
  //   return this.foldersService.remove(id);
  // }

  @Post('getZip/:id')
  async getZip(
    @Param('id') id: string,
    @Headers('x-folder-password') providedPassword?: string,
  ) {
    this.logger.log(`Adding zip: ${id}`);
    return this.foldersService.getZip(id, providedPassword);
  }
}
