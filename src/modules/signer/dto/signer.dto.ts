import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { WALLET_TYPE } from 'src/datalayer/model';
export class SetSignerDto {
  @ApiProperty({ required: true })
  @IsString()
  secretKey: string;
}

export class SetGasWalletDTO {
  @ApiProperty({ required: true })
  @IsString()
  secretKey: string;

  @ApiProperty({ required: true, description: 'IAO => 1, DEX => 2' })
  @Type(() => Number)
  @IsEnum(WALLET_TYPE)
  type: number;
}
