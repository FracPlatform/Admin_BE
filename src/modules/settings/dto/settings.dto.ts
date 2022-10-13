import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  ValidateNested,
  Min,
  Max,
  IsInt,
} from 'class-validator';

export class AssetItem {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'E24' })
  @Max(999999)
  maxFile: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'E26' })
  @Max(999999.99)
  maxSizeOfFile: number;
}

export class Custodianship {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'E24' })
  @Max(999999, { message: 'E24' })
  maxNFT: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'E24' })
  @Max(999999, { message: 'E24' })
  maxFile: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'E26' })
  @Max(999999.99)
  maxSizeOfFile: number;
}

export class IaoRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'E24' })
  @Max(999999, { message: 'E24' })
  maxItem: number;
}

export class DigitalAssetLable {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fractor: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fractorToFrac: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  frac: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  availableForFractorToRedeem: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  availableForUsertoRedeem: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  user: string;
}

export class DigitalAsset {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAssetLable)
  en: DigitalAssetLable;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAssetLable)
  cn: DigitalAssetLable;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAssetLable)
  jp: DigitalAssetLable;
}

export class PhysicalAssetLable {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fractor: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fractorToFrac: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  frac: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  availableForFractorToRedeem: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fractorRedeems: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fracToFractor: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  availableForUserToRedeem: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  userRedeems: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  fracToUser: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  user: string;
}

export class PhysicalAsset {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAssetLable)
  en: PhysicalAssetLable;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAssetLable)
  cn: PhysicalAssetLable;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAssetLable)
  jp: PhysicalAssetLable;
}

export class CustodianshipLable {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAsset)
  physicalAsset: PhysicalAsset;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAsset)
  digitalAssetForNft: DigitalAsset;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAsset)
  digitalAssetForNonNft: DigitalAsset;
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssetItem)
  assetItem: AssetItem;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Custodianship)
  custodianship: Custodianship;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IaoRequest)
  iaoRequest: IaoRequest;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustodianshipLable)
  custodianshipLable: CustodianshipLable;
}
