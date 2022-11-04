import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsDate,
  IsDateString,
} from 'class-validator';
import {
  LOCALIZATION,
  NOTIFICATION_QUEUE_TYPE,
  SENT_TO,
} from 'src/datalayer/model';

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
    required: true,
    example: LOCALIZATION.ENGLISH,
    description: 'en => English, ch => Chinna, ja => Japan',
  })
  @IsNotEmpty()
  @IsEnum(LOCALIZATION)
  localization: LOCALIZATION;

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
    example: 'Title notification',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  title: string;

  @ApiProperty({
    required: false,
    example: 'Description notification',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30000)
  description: string;
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
    required: true,
    example: LOCALIZATION.ENGLISH,
    description: 'en => English, ch => Chinna, ja => Japan',
  })
  @IsOptional()
  @IsEnum(LOCALIZATION)
  localization: LOCALIZATION;

  @ApiProperty({
    required: false,
    description: '1 => Fractors, 2 => Traders',
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  sendTo: SENT_TO[];

  @ApiProperty({
    required: false,
    example: 'Title notification',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  title: string;

  @ApiProperty({
    required: false,
    example: 'Desc notification',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30000)
  description: string;
}
