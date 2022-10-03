import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { TraitDto } from './create-nft.dto';

export class EditNftDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  mediaUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  previewUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  description: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ type: [TraitDto] })
  metadata: TraitDto[];

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  unlockableContent: string;
}
