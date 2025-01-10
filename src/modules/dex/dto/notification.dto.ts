import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class NotificationDto {
  @ApiProperty({ required: true })
  walletAddress: string;

  @ApiProperty({ required: true })
  uuid: string;

  @ApiProperty({ required: true })
  type: string;

  @ApiProperty({ required: false })
  data: object;
}

export class CreateNotificationDto {
  @ApiProperty({ type: NotificationDto, required: true, isArray: true })
  @IsArray()
  data: NotificationDto[];
}

export class UpdateNotificationDto {
  @ApiProperty({ required: true, type: String, isArray: true })
  uuids: string[];
}
