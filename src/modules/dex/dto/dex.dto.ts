import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmpty,
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class DownloadOrdersDto {
  @ApiProperty({ required: false })
  startDate: number;

  @ApiProperty({ required: false })
  endDate: number;

  @ApiProperty({ required: false })
  pairId: number;

  @ApiProperty({ required: false })
  timezone: string;
}

export class OrdersDto {
  @ApiProperty({ required: false })
  page: number;

  @ApiProperty({ required: false })
  limit: number;

  @ApiProperty({ required: false })
  startDate: number;

  @ApiProperty({ required: false })
  endDate: number;

  @ApiProperty({ required: false })
  pairId: number;
}

export class TradingLevelDto {
  @ApiProperty({ required: false })
  page: number;

  @ApiProperty({ required: false })
  limit: number;
}

export class AddTradingLevelDto {
  @ApiProperty({ required: false })
  tier_id: number;

  @ApiProperty({ required: false })
  taker_fee: number;

  @ApiProperty({ required: false })
  maker_fee: number;
}

export class EditTradingLevelDto {
  @ApiProperty({ required: false })
  taker_fee: number;

  @ApiProperty({ required: false })
  maker_fee: number;
}

export class UploadIntervalDto {
  @ApiProperty({
    required: false,
    description: 'File attach image',
    type: 'file',
    format: 'binary',
  })
  csv: Express.Multer.File;
}

export class LoginDexDto {
  @ApiProperty({ required: false })
  message: string;

  @ApiProperty({ required: false })
  signature: string;
}
export class GetIntervalSettingDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  page: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  limit: number;
}

export class FilterPairDto {
  @ApiProperty({ type: Number, required: false })
  page: number;

  @ApiProperty({ type: Number, required: false })
  limit: number;

  @ApiProperty({ type: Number, required: false })
  status: number;

  @ApiProperty({ type: Number, required: false })
  base_symbol_coin: number;

  @ApiProperty({ type: String, required: false })
  search: string;

  @ApiProperty({ type: Number, required: false })
  is_show: number;
}

export class UpdatePairDto {
  @IsString()
  @ApiProperty({ type: String })
  minimum_amount: string;

  @IsString()
  @ApiProperty({ type: String })
  amount_precision: string;

  @IsString()
  @ApiProperty({ type: String })
  price_precision: string;

  @IsString()
  @ApiProperty({ type: String })
  minimum_total: string;
}
export class CreatePairDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  base_id: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  quote_id: number;

  @IsString()
  @ApiProperty({ type: String })
  minimum_amount: string;

  @IsString()
  @ApiProperty({ type: String })
  amount_precision: string;

  @IsString()
  @ApiProperty({ type: String })
  price_precision: string;

  @IsString()
  @ApiProperty({ type: String })
  minimum_total: string;
}

export class RemoveFavoriteDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  pair_id: number;
}

export class UpdateFavoriteDto extends RemoveFavoriteDto {}

export class GetListCoinsDto {
  @ApiProperty({ type: Boolean, required: false })
  isFnft: boolean;
}

export class AddCoinDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  network: number;

  @IsString()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @ApiProperty({ type: String })
  symbol: string;

  @IsNumber()
  @ApiProperty({ type: Number })
  decimal: number;

  @IsEthereumAddress()
  @ApiProperty({ type: String })
  bsc_address: string;

  @IsString()
  @IsEmpty()
  @ApiProperty({ type: String, required: false })
  is_fnft: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

export class GetCollectedFeeDto {
  @ApiProperty({ required: false })
  startTime: number;

  @ApiProperty({ required: false })
  endTime: number;

  @ApiProperty({ required: false })
  coinId: number;

  @ApiProperty({ required: false })
  calculationMethod: number;
}

export class DownloadCollectedFeeDto {
  @ApiProperty({ required: false })
  startTime: number;

  @ApiProperty({ required: false })
  endTime: number;

  @ApiProperty({ required: false })
  coinId: number;

  @ApiProperty({ required: false })
  calculationMethod: number;
}

export class GetIntervalSettingsDto {
  @ApiProperty({ required: false })
  page: number;

  @ApiProperty({ required: false })
  limit: number;
}

export class GetTradeDto {
  @ApiProperty({ required: false })
  page: number;

  @ApiProperty({ required: false })
  limit: number;

  @ApiProperty({ required: false })
  pair: number;

  @ApiProperty({ required: false })
  wallet: string;

  @ApiProperty({ type: [String], required: false })
  tradeMethodTab: string;

  @ApiProperty({ required: false })
  userId: number;

  @ApiProperty({ required: false })
  orderId: string;

  @ApiProperty({ required: false })
  pool: string;

  @ApiProperty({ required: false })
  type: number;

  @ApiProperty({ required: false })
  coinId: number;

  @ApiProperty({ required: false })
  startDate: string;

  @ApiProperty({ required: false })
  endDate: string;
}

export class DownloadTradeDto {
  @ApiProperty({ required: false })
  pair: number;

  @ApiProperty({ required: false })
  wallet: string;

  @ApiProperty({ type: [String], required: false })
  tradeMethodTab: string;

  @ApiProperty({ required: false })
  userId: number;

  @ApiProperty({ required: false })
  orderId: string;

  @ApiProperty({ required: false })
  pool: string;

  @ApiProperty({ required: false })
  type: number;

  @ApiProperty({ required: false })
  coinId: number;

  @ApiProperty({ required: false })
  startDate: string;

  @ApiProperty({ required: false })
  endDate: string;

  @ApiProperty({ required: false })
  startDateTimestamp: number;

  @ApiProperty({ required: false })
  endDateTimestamp: number;

  @ApiProperty({ required: false })
  timezone: string;
}
