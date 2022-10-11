import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IAO_EVENT_STAGE } from 'src/datalayer/model';

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
  @IsEnum(IAO_EVENT_STAGE)
  iaoEventStage: number;
}
