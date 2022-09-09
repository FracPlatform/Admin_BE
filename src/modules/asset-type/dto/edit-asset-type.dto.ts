import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { LanguageVariants, SpecificationField } from 'src/datalayer/model';

export class EditAssetTypeDto {
  @IsObject()
  @IsOptional()
  @ApiProperty({ type: LanguageVariants, required: false })
  name: LanguageVariants;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  borderColor: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  logoImage: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  isActive: boolean;

  @IsObject()
  @IsOptional()
  @ApiProperty({ type: LanguageVariants, required: false })
  description: LanguageVariants;

  @IsArray()
  @IsOptional()
  @ApiProperty({ type: [SpecificationField], required: false })
  specifications: SpecificationField[];
}
