import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SORT_TYPE {
  DESC = 'DESC',
  ASC = 'ASC',
}

export class BdOfAffiliateDashboardDto {
  @ApiProperty({ required: true, description: '' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  year: number;

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

  @ApiProperty({ required: false, description: 'DESC,ASC' })
  @IsOptional()
  @IsString()
  @IsEnum(SORT_TYPE)
  sortType: string;

  @ApiProperty({
    required: false,
    description: 'masterId',
  })
  @IsOptional()
  @IsString()
  masterId: string;

  @ApiProperty({
    required: false,
    description: 'Require when role is Super Admin, Owner',
  })
  @IsOptional()
  @IsString()
  bdAddress: string;
}

export class ExportBdOfAffiliateDashboardDto {
  @ApiProperty({ required: true, description: '' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiProperty({ required: false, description: 'DESC,ASC' })
  @IsOptional()
  @IsString()
  @IsEnum(SORT_TYPE)
  sortType: string;

  @ApiProperty({
    required: false,
    description: 'masterId',
  })
  @IsOptional()
  @IsString()
  masterId: string;

  @ApiProperty({
    required: false,
    description: 'Require when role is Super Admin, Owner',
  })
  @IsOptional()
  @IsString()
  bdAddress: string;
}

export class BdOfAffiliateChartDto {
  @ApiProperty({ required: true, description: '' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiProperty({
    required: false,
    description: 'Require when role is Super Admin, Owner',
  })
  @IsOptional()
  @IsString()
  bdAddress: string;
}

export class BdOfAffiliateEarningDto {
  @ApiProperty({ required: true, description: '' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  year: number;

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

  @ApiProperty({ required: false, description: 'DESC,ASC' })
  @IsOptional()
  @IsString()
  @IsEnum(SORT_TYPE)
  sortType: string;

  @ApiProperty({
    required: false,
    description: 'id, name',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}

export class ExportBdOfAffiliateEarningDto {
  @ApiProperty({ required: true, description: '' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiProperty({ required: false, description: 'DESC,ASC' })
  @IsOptional()
  @IsString()
  @IsEnum(SORT_TYPE)
  sortType: string;

  @ApiProperty({
    required: false,
    description: 'id, name',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}