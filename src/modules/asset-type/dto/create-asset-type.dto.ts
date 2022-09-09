import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsString,
} from 'class-validator';
import {
  CategoryType,
  LanguageVariants,
  SpecificationField,
} from 'src/datalayer/model';

export class CreateAssetTypeDto {
  @IsString()
  @IsEnum(CategoryType)
  @ApiProperty({ type: String })
  category: CategoryType;

  @IsObject()
  @ApiProperty({ type: LanguageVariants })
  name: LanguageVariants;

  @IsString()
  @ApiProperty({ type: String })
  borderColor: string;

  @IsString()
  @ApiProperty({ type: String })
  logoImage: string;

  @IsBoolean()
  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @IsObject()
  @ApiProperty({ type: LanguageVariants })
  description: LanguageVariants;

  @IsArray()
  @ApiProperty({ type: [SpecificationField] })
  specifications: SpecificationField[];
}
