import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { REVIEW_STATUS } from 'src/datalayer/model';

export class UpdateCustodianshipFile {
  @ApiProperty({ required: false, type: String })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  description: string;

  @IsEnum(REVIEW_STATUS)
  @IsOptional()
  @ApiProperty({
    type: Number,
    required: false,
    description: '0 => Rejected, 1 => In Review, 2 => Approved',
  })
  status: REVIEW_STATUS;
}
