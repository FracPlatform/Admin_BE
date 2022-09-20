import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateFractorDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  assignedBD: string;

  @ApiProperty({ required: false })
  @IsNumber({ allowNaN: true, maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  iaoFeeRate: number;

  @ApiProperty({ required: false })
  @IsNumber({ allowNaN: true, maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  tradingFeeProfit: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  deactivationComment: string;
}
