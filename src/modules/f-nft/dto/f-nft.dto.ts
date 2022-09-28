import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsArray,
  Max,
  Min,
  IsUrl,
  IsEnum,
} from 'class-validator';

export class CreateFnftDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  tokenSymbol: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  tokenName: string;

  @ApiProperty({ required: true })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(999999999999)
  totalSupply: number;

  @ApiProperty({ required: true, description: '56- mainnet, 97- testnet' })
  @Type(() => Number)
  @IsNumber()
  @IsEnum([56, 97])
  chainId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  tokenLogo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iaoRequestId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class FilterFnftDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  name: string;

  @ApiProperty({ required: false, description: '0- Inactive, 1- Active' })
  @IsOptional()
  @IsString()
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
