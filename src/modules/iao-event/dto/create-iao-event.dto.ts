import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CHAINID } from 'src/common/constants';
import {
  VAULT_TYPE,
  MAXLENGTH_CONTRACT_ADDRESS,
  MIN_IAO_EVENT_DURATION,
  MAX_IAO_EVENT_DURATION,
  MAX_PERCENT_OFFERED,
  MAX_PERCENT_VAULT,
  MAXLENGTH_EVENT_NAME,
  MAXLENGTH_DESCRIPTION,
  ALLOCATION_TYPE,
  MAX_DECIMAL_HARD_CAP_PER_USER,
  MAX_EXCHANGE_RATE,
  MAX_DECIMAL_EXCHANGE_RATE,
  MAX_HARD_CAP_PER_USER,
  MAX_LENGTH_WHITE_LIST_URL,
  MIN_HARD_CAP_PER_USER,
  MIN_PERCENT_OFFERED,
  MIN_PERCENT_VAULT,
  MIN_EXCHANGE_RATE,
} from 'src/datalayer/model';
import {
  ValidateGreaterComparse,
  ValidateWhitelistGreaterRegistration,
} from './validate.dto';

export class EventNameDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAXLENGTH_EVENT_NAME)
  en: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAXLENGTH_EVENT_NAME)
  jp: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAXLENGTH_EVENT_NAME)
  cn: string;
}

export class DescriptionDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAXLENGTH_DESCRIPTION)
  en: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAXLENGTH_DESCRIPTION)
  jp: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAXLENGTH_DESCRIPTION)
  cn: string;
}

export class CreateIaoEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  isDisplay: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @IsEnum(CHAINID)
  chainId: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString({ message: 'E2' })
  @MaxLength(MAXLENGTH_CONTRACT_ADDRESS)
  @IsEthereumAddress({ message: 'E2' })
  FNFTcontractAddress: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  registrationStartTime: Date;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ValidateGreaterComparse('registrationStartTime', {
    message: 'Registration Start time must be < Registration end time',
  })
  registrationEndTime: Date;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @Min(MIN_IAO_EVENT_DURATION)
  @Max(MAX_IAO_EVENT_DURATION)
  iaoEventDuration: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ValidateGreaterComparse('registrationEndTime', {
    message: 'registrationEndTime must be < participationStartTime',
  })
  participationStartTime: Date;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEnum(VAULT_TYPE)
  vaultType: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAXLENGTH_CONTRACT_ADDRESS)
  acceptedCurrencyAddress: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Max(MAX_EXCHANGE_RATE)
  @Min(MIN_EXCHANGE_RATE)
  @IsNumber({ maxDecimalPlaces: MAX_DECIMAL_EXCHANGE_RATE })
  exchangeRate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @Max(MAX_PERCENT_OFFERED)
  @Min(MIN_PERCENT_OFFERED)
  percentageOffered: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @Max(MAX_PERCENT_VAULT)
  @Min(MIN_PERCENT_VAULT)
  vaultUnlockThreshold: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  eventPhotoUrl: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  eventBannerUrl: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EventNameDTO)
  iaoEventName: EventNameDTO;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DescriptionDTO)
  description: DescriptionDTO;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEnum(ALLOCATION_TYPE)
  allocationType: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Max(MAX_HARD_CAP_PER_USER)
  @Min(MIN_HARD_CAP_PER_USER)
  @IsNumber({ maxDecimalPlaces: MAX_DECIMAL_HARD_CAP_PER_USER })
  hardCapPerUser: number;

  @ApiProperty({ required: false })
  @IsOptional()
  whitelistRegistrationUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ValidateWhitelistGreaterRegistration('registrationStartTime', {
    message: 'whitelistAnnouncementTime Must >= registrationStartTime',
  })
  whitelistAnnouncementTime: Date;
}
