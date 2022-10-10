import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IAO_EVENT_STAGE } from 'src/datalayer/model';

export class GetListIaoEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  keyword: string;

  @IsEnum(IAO_EVENT_STAGE)
  @IsOptional()
  @ApiProperty({
    required: false,
    type: Number,
    description:
      '1 => Upcomming, 2 => Register now, 3 => On sale soon, 4 => On sale, 5 => Completed, 6 => Failed',
  })
  @Type(() => Number)
  stage: IAO_EVENT_STAGE;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  registrationFromDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  registrationToDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  particicationFromDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  particicationToDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}
