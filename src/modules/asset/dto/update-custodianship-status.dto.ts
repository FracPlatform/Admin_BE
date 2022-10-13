import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum EDITABLE_CUSTODIANSHIP_STATUS {
  FRACTOR = 0,
  FRACTOR_TO_FRAC_OR_IN_REVIEW = 1,
  FRAC = 2,
}

export class UpdateCustodianshipStatusDto {
  @IsEnum(EDITABLE_CUSTODIANSHIP_STATUS)
  @ApiProperty({
    type: Number,
    description: '0 => Fractor, 1 => In review, 2 => Frac',
  })
  status: EDITABLE_CUSTODIANSHIP_STATUS;
}
