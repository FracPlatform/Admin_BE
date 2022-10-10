import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CHAINID } from 'src/common/constants';
import { CategoryType } from 'src/datalayer/model';
import { DISPLAY_TYPE, NFT_TYPE } from 'src/datalayer/model/nft.model';

export class TraitDto {
  @IsString()
  @ApiProperty({ type: String })
  trait_type: string;

  @IsString()
  @IsNumber()
  @ApiProperty({ type: String })
  value: string | number;

  @IsEnum(DISPLAY_TYPE)
  @IsOptional()
  @ApiProperty({ type: String, enum: DISPLAY_TYPE, required: false })
  display_type?: DISPLAY_TYPE;
}

export class CreateNftDto {
  @IsEnum(NFT_TYPE)
  @ApiProperty({
    type: Number,
    default: NFT_TYPE.FRACTOR_ASSET,
    description: "1 => fractor's asset, 2 => frac's asset",
  })
  nftType: NFT_TYPE;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, description: 'ITEM-1', required: false })
  assetId?: string;

  @IsEnum(CategoryType)
  @ApiProperty({
    type: String,
    required: false,
    description: 'physical or virtual',
  })
  assetCategory?: CategoryType;

  @IsString()
  @ApiProperty({ type: String, required: false, description: 'ATYPE-1' })
  assetType?: string;

  @IsBoolean()
  @ApiProperty({ type: Boolean })
  display: boolean;

  @IsEnum(CHAINID)
  @ApiProperty({ type: Number, default: CHAINID.BSC_TESTNET })
  chainId: CHAINID;

  @IsString()
  @ApiProperty({ type: String })
  mediaUrl: string;

  @IsString()
  @ApiProperty({ type: String })
  previewUrl: string;

  @IsArray()
  @ApiProperty({ type: [TraitDto] })
  metadata: TraitDto[];

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  unlockableContent?: string;

  @IsString()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  description: string;
}
