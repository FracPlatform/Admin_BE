import { ApiProperty } from '@nestjs/swagger';

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
