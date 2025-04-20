import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class GenerateSignedUrlDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;

  @IsNotEmpty()
  @IsEnum(['photo', 'video'], { message: 'Type must be either photo or video' })
  type: 'photo' | 'video';

  @IsNotEmpty()
  @IsString()
  uploadedBy: string;
}
