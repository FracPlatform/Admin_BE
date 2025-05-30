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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CHAINID } from 'src/common/constants';
import {
  ALLOCATION_TYPE,
  FIAT_CURRENCY,
  MAXLENGTH_CONTRACT_ADDRESS,
  MAX_DECIMAL_EXCHANGE_RATE,
  MAX_DECIMAL_HARD_CAP_PER_USER,
  MAX_EXCHANGE_RATE,
  MAX_HARD_CAP_PER_USER,
  MAX_LENGTH_WHITE_LIST_URL,
  MAX_PERCENT_OFFERED,
  MAX_PERCENT_VAULT,
  MIN_EXCHANGE_RATE,
  MIN_HARD_CAP_PER_USER,
  MIN_PERCENT_OFFERED,
  MIN_PERCENT_VAULT,
  VAULT_TYPE,
} from 'src/datalayer/model';
import {
  CreateIaoEventDto,
  DescriptionDTO,
  EventNameDTO,
} from './create-iao-event.dto';
import {
  ValidateGreaterComparse,
  ValidateNumberic,
  ValidateWhitelistGreaterRegistration,
} from './validate.dto';

export class UpdateIaoEventDto extends CreateIaoEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsEnum(CHAINID)
  chainId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAXLENGTH_CONTRACT_ADDRESS)
  @IsEthereumAddress({ message: 'E2' })
  FNFTcontractAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  registrationStartTime: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ValidateGreaterComparse('registrationStartTime', {
    message: 'Registration Start time must be < Registration end time',
  })
  registrationEndTime: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  // @Min(MIN_IAO_EVENT_DURATION)
  // @Max(MAX_IAO_EVENT_DURATION)
  iaoEventDuration: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ValidateGreaterComparse('registrationEndTime', {
    message: 'registrationEndTime must be < participationStartTime',
  })
  participationStartTime: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(VAULT_TYPE)
  vaultType: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAXLENGTH_CONTRACT_ADDRESS)
  acceptedCurrencyAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Max(MAX_EXCHANGE_RATE)
  @Min(MIN_EXCHANGE_RATE)
  @ValidateNumberic({
    maxDecimalPlaces: MAX_DECIMAL_EXCHANGE_RATE,
    message: 'exchangeRate is invalid',
  })
  exchangeRate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Max(MAX_PERCENT_OFFERED)
  @Min(MIN_PERCENT_OFFERED)
  percentageOffered: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Max(MAX_PERCENT_VAULT)
  @Min(MIN_PERCENT_VAULT)
  vaultUnlockThreshold: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  eventPhotoUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  eventBannerUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventNameDTO)
  iaoEventName: EventNameDTO;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DescriptionDTO)
  description: DescriptionDTO;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ALLOCATION_TYPE)
  allocationType: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Max(MAX_HARD_CAP_PER_USER)
  @Min(MIN_HARD_CAP_PER_USER)
  @IsNumber({ maxDecimalPlaces: MAX_DECIMAL_HARD_CAP_PER_USER })
  hardCapPerUser: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @MaxLength(MAX_LENGTH_WHITE_LIST_URL)
  whitelistRegistrationUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @ValidateIf((o) => o.whitelistAnnouncementTime !== null)
  @ValidateWhitelistGreaterRegistration('registrationStartTime', {
    message: 'whitelistAnnouncementTime Must >= Registration_end_time',
  })
  whitelistAnnouncementTime: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  allowWhitelist: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(FIAT_CURRENCY)
  fiatSymbol: FIAT_CURRENCY;
}
