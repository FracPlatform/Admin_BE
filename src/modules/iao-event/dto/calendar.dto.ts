import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IAO_EVENT_CALENDER } from 'src/datalayer/model';

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
  @IsEnum(IAO_EVENT_CALENDER)
  iaoEventStage: number;
}
