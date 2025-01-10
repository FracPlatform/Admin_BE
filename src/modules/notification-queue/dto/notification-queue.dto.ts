import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { NOTIFICATION_QUEUE_TYPE, SENT_TO } from 'src/datalayer/model';

export class MultiLanguageTitle {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  en: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  ja: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  cn: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  vi: string;
}

export class MultiLanguageDescription {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  en: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  ja: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  cn: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  vi: string;
}

export class CreateNotifQueueDto {
  @ApiProperty({
    required: true,
    example: NOTIFICATION_QUEUE_TYPE.ANNOUNCEMENT,
    description: '1 => Announcement',
  })
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  @IsEnum(NOTIFICATION_QUEUE_TYPE)
  type: NOTIFICATION_QUEUE_TYPE;

  @ApiProperty({
    required: false,
    description: '1 => Fractors, 2 => Traders',
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  sendTo: SENT_TO[];

  @ApiProperty({
    required: true,
    example: '{"en": "Title In EN", "ja": "Title In JA", "cn": "Title In CN"}',
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => MultiLanguageTitle)
  title: MultiLanguageTitle;

  @ApiProperty({
    required: false,
    example: '{"en": "Desc In EN", "ja": "Desc In JA", "cn": "Desc In CN"}',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MultiLanguageDescription)
  description: MultiLanguageDescription;
}

export class ScheduleNotificationDto {
  @ApiProperty({
    type: Date,
    description: 'Date schedule notification',
    example: '2023-11-04T02:39:47.013Z',
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  sentOn: Date;
}

export class UpdateNotifQueueDto {
  @ApiProperty({
    required: false,
    description: '1 => Fractors, 2 => Traders',
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  sendTo: SENT_TO[];

  @ApiProperty({
    required: true,
    example: '{"en": "Title In EN", "ja": "Title In JP", "cn": "Title In CN"}',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MultiLanguageTitle)
  title: MultiLanguageTitle;

  @ApiProperty({
    required: false,
    example: '{"en": "Desc In EN", "ja": "Desc In JP", "cn": "Desc In CN"}',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MultiLanguageDescription)
  description: MultiLanguageDescription;
}

export class FilterNotificationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  textSearch: string;

  @ApiProperty({
    required: false,
    description: ' 1 - Draft, 2- Scheduled, 3 - Send, 4- Inative ',
    enum: { DRAFT: 1, SCHEDULED: 2, SEND: 3, INACTIVE: 4 },
    enumName: 'status',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status: number;

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

  @ApiProperty({
    required: false,
    enum: { createdAt: 'createdAt', sentOn: 'sentOn' },
    enumName: 'sortField',
  })
  @IsOptional()
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({
    required: false,
    description: '-1 => DESC, 1 => ASC',
    enum: { DESC: -1, ASC: 1 },
    enumName: 'sortType',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}
