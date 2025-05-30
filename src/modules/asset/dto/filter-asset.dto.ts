import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsNumber,
  MaxLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ASSET_STATUS, CUSTODIANSHIP_STATUS } from 'src/datalayer/model';

export enum IS_CONVERTED_TO_NFT {
  YES = 1,
  NO = 0,
}
export class FilterAssetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  keyword: string;

  @ApiProperty({
    required: false,
    description:
      '1 => OPEN, 2 => IN_REVIEW, 3 => IAO APPROVED, 4 => CONVERTED TO NFT, 5 => FRACTIONALIZED, 6 => IAO EVENT, 7 => EXCHANGE, 8 => REDEEMED',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  @IsEnum(ASSET_STATUS)
  status: ASSET_STATUS;

  @ApiProperty({
    required: false,
    description:
      '0 => FRACTOR, 1 => FRACTOR_TO_FRAC_OR_IN_REVIEW, 2 => FRAC, 3 => AVAILABLE_FOR_FRACTOR_TO_REDEEM, 4 => FRACTOR_REDEEMS, 5 => FRAC_TO_FRACTOR, 6 => AVAILABLE_FOR_USER_TO_REDEEM, 7 => USER_REDEEMS, 8 => FRAC_TO_USER, 9 => USER,',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  @IsEnum(CUSTODIANSHIP_STATUS)
  custodianshipStatus: CUSTODIANSHIP_STATUS;

  @ApiProperty({ required: false, description: 'F-1' })
  @IsOptional()
  owner: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fromDate: string;

  @ApiProperty({ required: false, type: String })
  @IsDateString()
  @IsOptional()
  toDate: string;

  @ApiProperty({
    type: Number,
    required: false,
    description: '0 => false, 1 => true',
  })
  @IsEnum(IS_CONVERTED_TO_NFT)
  @Type(() => Number)
  @IsOptional()
  isConvertedToNft: IS_CONVERTED_TO_NFT;

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

export class FilterMoreUserAssetDto {
  @ApiProperty({ required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  collectionId: string;

  @ApiProperty({ required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  assetId: string;

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
}
