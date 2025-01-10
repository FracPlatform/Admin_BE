import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { REVENUE_SOURCE } from '../../../datalayer/model';

export class FilterWithdrawalRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  key: string;

  @ApiProperty({ required: false, description: '1- Active, 0 - Inactive' })
  @IsOptional()
  status: string;

  @ApiProperty({
    required: false,
    description: '1 is IAO, 2 is EXCHANGE',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsEnum([REVENUE_SOURCE.EXCHANGE, REVENUE_SOURCE.IAO])
  type: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}

export class FilterAffiliateWithdrawalRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  key: string;

  @ApiProperty({ required: false, description: '1- Active, 0 - Inactive' })
  @IsOptional()
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}


export class ReviewWithdrawalRequestDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment: string;

  @ApiProperty({
    required: true,
    description: '0 is cancel, 1 is approve',
  })
  @Type(() => Number)
  @IsNumber()
  @IsEnum([0, 1])
  type: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  proofUrl?: string;
}


export class UpdateWithdrawalRequestDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment: string;
}