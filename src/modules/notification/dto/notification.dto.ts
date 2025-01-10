import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NOTIFICATION_TYPE } from 'src/datalayer/model';

export class FilterNotificationDto {
  @ApiProperty({
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => JSON.parse(value))
  read: boolean;

  @ApiProperty({
    required: false,
    description: '1 => ANNOUNCEMENT, 2 => SYSTEM_MESSAGES',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsEnum(NOTIFICATION_TYPE)
  type: string;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => JSON.parse(value))
  deleted: boolean;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => JSON.parse(value))
  hided: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({
    required: false,
    description: '-1 => DESC, 1 => ASC',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortType: number;
}
