import { IsString, IsOptional } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsString()
  createdBy: string;

  @IsOptional()
  @IsString()
  password?: string;
}
