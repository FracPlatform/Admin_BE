import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateIaoRevenueDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  @Max(99)
  @Min(0)
  bdCommissionRate: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({ type: String, required: false })
  comment: string;
}
