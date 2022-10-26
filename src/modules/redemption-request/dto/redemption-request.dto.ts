import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { REDEMPTION_REQUEST_TYPE } from 'src/common/constants';

export class FilterRedemptionRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  name: string;

  @ApiProperty({
    required: false,
    description:
      '1 - In review, 2 - Processing, 3 - Redeemed, 4 - Rejected, 0 - Cancelled',
  })
  @IsOptional()
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}

export class ChangeStatusDto {
  @ApiProperty({
    required: true,
    nullable: false,
    description: '1 - approve, 2 - reject',
  })
  @IsInt()
  @IsEnum([
    REDEMPTION_REQUEST_TYPE.APPROVE,
    REDEMPTION_REQUEST_TYPE.REJECT,
    REDEMPTION_REQUEST_TYPE.REDEEM,
  ])
  readonly type: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2500)
  reviewComment: string;
}
