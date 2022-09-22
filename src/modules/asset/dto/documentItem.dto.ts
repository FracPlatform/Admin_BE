import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateDocumentItemDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  fileUrl: string;
}

export class UpdateDocumentItemDto {
  @ApiProperty({ required: false, type: String })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  description: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  display: boolean;
}
