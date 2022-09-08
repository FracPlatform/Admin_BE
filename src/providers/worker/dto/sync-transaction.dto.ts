import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
} from 'class-validator';
import { TokenStandard } from 'src/common/common-type';

export class SyncTransactionDto {
  @ApiProperty()
  @IsEnum(TokenStandard)
  type: TokenStandard;

  @ApiProperty()
  @IsOptional()
  blockNumber: number;
}
