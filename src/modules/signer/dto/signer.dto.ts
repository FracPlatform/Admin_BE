import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetSignerDto {
  @ApiProperty({ required: true })
  @IsString()
  secretKey: string;
}
