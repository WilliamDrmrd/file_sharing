import { IsNotEmpty, IsString } from 'class-validator';

export class UploadCompleteDto {
  @IsNotEmpty()
  @IsString()
  folderId: string;

  @IsNotEmpty()
  @IsString()
  type: 'photo' | 'video';

  @IsNotEmpty()
  @IsString()
  uploadedBy: string;

  @IsNotEmpty()
  @IsString()
  filename: string;
}
