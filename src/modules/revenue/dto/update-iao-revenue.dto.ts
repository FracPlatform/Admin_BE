import { ApiProperty } from '@nestjs/swagger';
import {
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
  @Max(99.99)
  @Min(0.01)
  bdCommissionRate: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  comment: string;
}
