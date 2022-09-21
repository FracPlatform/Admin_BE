import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class WorkerDataDto {
  @ApiProperty()
  @IsString()
  recordId: string;

  @ApiProperty()
  @IsString()
  chainId: string;
  
  @ApiProperty()
  @IsString()
  contractAddress: string;

  @ApiProperty()
  @IsString()
  eventName: string;

  @ApiProperty()
  @IsObject()
  metadata: object;
}
