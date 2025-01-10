import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetAssetTypeByIdDto {
  @IsString()
  @ApiProperty({ type: String })
  id: string;
}
