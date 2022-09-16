import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CategoryType } from 'src/datalayer/model';

export enum ASSET_TYPE_STATUS {
  ACTIVE = 1,
  INACTIVE = 0,
}

export class GetListAssetTypeDto {
  @IsOptional()
  @IsString()
  @IsEnum(CategoryType)
  @ApiProperty({
    type: String,
    required: false,
    description: 'physical or virtual',
  })
  category?: CategoryType;

  @IsOptional()
  @IsEnum(ASSET_TYPE_STATUS)
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  @ApiProperty({
    type: Number,
    required: false,
    description: '1 => active, 0 => inactive',
  })
  status: ASSET_TYPE_STATUS;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  @ApiProperty({ type: String, required: false, default: '' })
  keyword?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false })
  limit: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false })
  offset: number;

  @IsOptional()
  @IsString({ message: 'E0' })
  @ApiProperty({ required: false })
  sortField: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  sortType: number;
}
