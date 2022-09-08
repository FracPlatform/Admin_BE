import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsObject, IsString } from 'class-validator';

export class WorkerDataDto {
  @ApiProperty()
  @IsDateString()
  timeStamp: string;

  @ApiProperty()
  @IsString()
  hash: string;

  @ApiProperty()
  @IsString()
  from: string;

  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  contractAddress: string;

  @ApiProperty()
  @IsString()
  eventType: string;

  @ApiProperty()
  @IsObject()
  data: object;
}
