import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class CreateDocumentItemDto {
  @ApiProperty({ required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  assetId: string;

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
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;
}

