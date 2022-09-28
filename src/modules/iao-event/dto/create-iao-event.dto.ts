import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
import {
  VAULT_TYPE,
  CHAIN_ID,
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
} from 'src/datalayer/model';
import { ValidateDate, ValidateGreaterComparse } from './validate.dto';

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
  @IsEnum(CHAIN_ID)
  chainId: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString({ message: 'E2' })
  @MaxLength(MAXLENGTH_CONTRACT_ADDRESS)
  @IsEthereumAddress({ message: 'E2' })
  FNFTcontractAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iaoRequestId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @ValidateDate({
    message:
      'registrationStartTime must be formatted as dd-mm-yyyy hh:mm:ss and greater than current date',
  })
  registrationStartTime: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @ValidateDate({
    message:
      'registrationEndTime must be formatted as dd-mm-yyyy hh:mm:ss and greater than current date',
  })
  @ValidateGreaterComparse('registrationStartTime', {
    message: 'Registration Start time must be < Registration end time',
  })
  registrationEndTime: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @Min(MIN_IAO_EVENT_DURATION)
  @Max(MAX_IAO_EVENT_DURATION)
  iaoEventDuration: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @ValidateDate({
    message:
      'participationStartTime must be formatted as dd-mm-yyyy hh:mm:ss and greater than current date',
  })
  @ValidateGreaterComparse('registrationEndTime', {
    message: 'registrationEndTime must be < participationStartTime',
  })
  participationStartTime: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @ValidateDate({
    message:
      'participationEndTime must be formatted as dd-mm-yyyy hh:mm:ss and greater than current date',
  })
  participationEndTime: string;

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
  @IsNumber({ maxDecimalPlaces: MAX_DECIMAL_EXCHANGE_RATE })
  exchangeRate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @Max(MAX_PERCENT_OFFERED)
  percentageOffered: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @Max(MAX_PERCENT_VAULT)
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
  @IsString()
  @MaxLength(MAXLENGTH_EVENT_NAME)
  @ValidateNested({ each: true })
  @Type(() => EventNameDTO)
  iaoEventName: EventNameDTO;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAXLENGTH_EVENT_NAME)
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
  @IsNumber({ maxDecimalPlaces: MAX_DECIMAL_HARD_CAP_PER_USER })
  hardCapPerUser: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(MAX_LENGTH_WHITE_LIST_URL)
  whitelistRegistrationUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @ValidateDate()
  whitelistAnnouncementTime: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  totalSupply: number;
}
