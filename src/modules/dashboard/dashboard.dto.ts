import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class DashboardDTO {
  @ApiProperty({ required: true })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  dateFrom: Date;

  @ApiProperty({ required: true })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  dateTo: Date;
}
