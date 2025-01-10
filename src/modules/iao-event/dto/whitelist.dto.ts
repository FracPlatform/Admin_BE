import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FilterWhitelistDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  iaoEventId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  wallet: string;

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

export class CreateWhitelistDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  whitelistAddresses: [];

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  iaoEventId: string;
}

export class DeleteWhitelistDto {
  @ApiProperty({
    required: false,
    description: '0: false, 1: true',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsEnum([0, 1])
  isClearAll: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  walletAddress: string;
}

export class ExportWhitelistDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  iaoEventId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  wallet: string;
}