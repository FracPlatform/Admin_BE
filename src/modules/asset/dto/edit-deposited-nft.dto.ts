import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { DEPOSITED_NFT_STATUS } from 'src/datalayer/model';

export class EditDepositedNftDto {
  @IsEnum(DEPOSITED_NFT_STATUS)
  @IsOptional()
  @ApiProperty({
    type: Number,
    description: '0 => Rejected, 1 => In review, 2 => Approved',
  })
  status: DEPOSITED_NFT_STATUS;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number })
  withdrawable: number;
}
