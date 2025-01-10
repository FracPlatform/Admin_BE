import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CalenderDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  dateFrom: Date;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  dateTo: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  iaoEventStage: number[];

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  timezone: string;
}
