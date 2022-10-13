import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { REVIEW_STATUS } from 'src/datalayer/model';

export class EditDepositedNftDto {
  @IsEnum(REVIEW_STATUS)
  @IsOptional()
  @ApiProperty({
    type: Number,
    description: '0 => Rejected, 1 => In review, 2 => Approved',
  })
  status: REVIEW_STATUS;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number })
  withdrawable: number;
}
