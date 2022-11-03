import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class ApproveIaoRevenueDto {
  @IsNumber()
  @Max(99.99)
  @Min(0.01)
  @ApiProperty({ type: Number })
  platformCommissionRate: number;

  @IsNumber()
  @Max(99.99)
  @Min(0.01)
  @ApiProperty({ type: Number })
  bdCommissionRate: number;
}
