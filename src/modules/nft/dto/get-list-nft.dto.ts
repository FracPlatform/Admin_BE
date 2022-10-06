import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NFT_STATUS, NFT_TYPE } from 'src/datalayer/model';

export enum ASSET_CATEGORY {
  PHYSICAL = 1,
  DIGITAL_NFT = 2,
  DIGITAL_NON_NFT = 3,
}

export class GetListNftDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  keyword: string;

  @IsEnum(NFT_STATUS)
  @IsOptional()
  @ApiProperty({
    type: Number,
    required: false,
    description:
      '1=> Draft, 2 => Minted, 3 => Fractionalized, 4 => Owner, 5 => Requesting, 6 => Request Approved, 7 => Redeemed',
  })
  @Type(() => Number)
  status: NFT_STATUS;

  @IsEnum(ASSET_CATEGORY)
  @IsOptional()
  @ApiProperty({
    type: Number,
    description: '1 => Physical, 2 => Digital (NFT), 3 => Digital (non-NFT)',
    required: false,
  })
  @Type(() => Number)
  assetCategory: ASSET_CATEGORY;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, description: 'AT-1', required: false })
  assetType: string;

  @IsEnum(NFT_TYPE)
  @IsOptional()
  @ApiProperty({
    type: Number,
    required: false,
    description: "1 => Fractor's asset, 2 => Frac's asset",
  })
  @Type(() => Number)
  nftType: NFT_TYPE;

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

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}
