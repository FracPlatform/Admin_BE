import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateFractorDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  assignedBD: string;

  @ApiProperty({ required: false })
  @IsNumber({ allowNaN: true, maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  iaoFeeRate: number;

  @ApiProperty({ required: false })
  @IsNumber({ allowNaN: true, maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  @Max(20)
  tradingFeeProfit: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  deactivationComment: string;
}
