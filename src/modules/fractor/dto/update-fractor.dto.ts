import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFractorDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedBD: string;

  @ApiProperty({ required: false })
  @IsNumber({ allowNaN: true, maxDecimalPlaces: 2 })
  @IsOptional()
  iaoFeeRate: number;

  @ApiProperty({ required: false })
  @IsNumber({ allowNaN: true, maxDecimalPlaces: 2 })
  @IsOptional()
  tradingFeeProfit: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  deactivationComment: string;
}
