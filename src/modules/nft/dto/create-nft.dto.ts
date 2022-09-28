import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { CategoryType } from 'src/datalayer/model';
import {
  DISPLAY_TYPE,
  NftMetadata,
  NFT_TYPE,
} from 'src/datalayer/model/nft.model';

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

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  max_value?: number;
}

export class NftMetadataDto {
  @IsArray()
  @ApiProperty({ type: [TraitDto] })
  properties: TraitDto[];

  @IsArray()
  @ApiProperty({ type: [TraitDto] })
  levels: TraitDto[];

  @IsArray()
  @ApiProperty({ type: [TraitDto] })
  stats: TraitDto[];

  @IsArray()
  @ApiProperty({ type: [TraitDto] })
  date: TraitDto;
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

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
    description: 'physical or virtual',
  })
  assetCategory?: CategoryType;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false, description: 'ATYPE-1' })
  assetType?: string;

  @IsBoolean()
  @ApiProperty({ type: Boolean })
  display: boolean;

  @IsNumber()
  @ApiProperty({ type: Number })
  chainId: number;

  @IsString()
  @ApiProperty({ type: String })
  mediaUrl: string;

  @IsString()
  @ApiProperty({ type: String })
  previewUrl: string;

  @IsObject()
  @ApiProperty({ type: () => NftMetadataDto })
  metadata: NftMetadata;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  unlockableContent?: string;

  @IsString()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @ApiProperty({ type: String })
  description: string;
}
