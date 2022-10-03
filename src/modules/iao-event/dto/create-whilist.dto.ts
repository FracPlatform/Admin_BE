import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from 'class-validator';

export class CreateWhitelistDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  whitelistAddresses: [];

  @ApiProperty({ required: true })
  @IsNotEmpty()
  iaoEventId: string;
}
