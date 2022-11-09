import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  ValidateNested,
  Min,
  Max,
  IsInt,
  IsNotEmpty,
  IsUrl,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class Affiliate {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  registrationUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  resourceUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  telegramUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  feedbackUrl: string;
}

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
  @IsNumber({ maxDecimalPlaces: 2 })
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
  @IsNumber({ maxDecimalPlaces: 2 })
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

export class WithdrawalThreshold {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  minWithdrawalThreshold: number;
}

export class DigitalAssetLabel {
  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  0: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  1: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  2: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  3: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  6: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  9: string;
}

export class DigitalAsset {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAssetLabel)
  en: DigitalAssetLabel;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAssetLabel)
  cn: DigitalAssetLabel;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DigitalAssetLabel)
  ja: DigitalAssetLabel;
}

export class PhysicalAssetLabel {
  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  0: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  1: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  2: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  3: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  4: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  5: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  6: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  7: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  8: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  9: string;
}

export class PhysicalAsset {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAssetLabel)
  en: PhysicalAssetLabel;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAssetLabel)
  cn: PhysicalAssetLabel;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhysicalAssetLabel)
  ja: PhysicalAssetLabel;
}

export class CustodianshipLabel {
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
  @Type(() => Affiliate)
  affiliate: Affiliate;

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
  @Type(() => WithdrawalThreshold)
  withdrawalThreshold: WithdrawalThreshold;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustodianshipLabel)
  custodianshipLabel: CustodianshipLabel;
}

export class UploadBannerDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  hyperlink: string;
}

export class SettingBanner {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadBannerDTO)
  banner: UploadBannerDTO[];
}
