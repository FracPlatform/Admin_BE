import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteSpecificationDto {
  @IsString()
  @ApiProperty({ type: String })
  id: string;
}
