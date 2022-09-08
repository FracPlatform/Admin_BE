import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class SearchDto {
  @ApiProperty()
  @Transform(({ value }) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  keyword = '';

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  page = 1;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  limit = 10;

  @ApiProperty()
  sort: object;

  @ApiProperty()
  projection: object;
}
