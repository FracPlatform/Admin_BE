import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
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
  IsBoolean,
} from 'class-validator';
import { CHAINID } from 'src/common/constants';

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
  @IsEnum([CHAINID.POLYGON_MAINNET, CHAINID.POLYGON_TESTNET])
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class CheckExistsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  tokenSymbol: string;
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

  @ApiProperty({ required: false, description: '0- Inactive, 1- Active' })
  @IsOptional()
  @IsString()
  mintedStatus: string;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => JSON.parse(value))
  isUsed: boolean;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => JSON.parse(value))
  @IsBoolean()
  isLinkedIAOEvent: boolean;
}

export class UpdateFnftDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  tokenName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  tokenLogo: string;
}
