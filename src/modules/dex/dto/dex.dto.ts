import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
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

export class LoginDto {
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
  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  page: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  limit: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  status: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  base_symbol_coin: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  search: string;

  @IsNumber()
  @IsOptional()
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
  @IsBoolean()
  @IsOptional()
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
