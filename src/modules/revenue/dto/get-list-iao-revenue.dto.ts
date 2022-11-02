import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IAO_EVENT_STAGE, REVENUE_STATUS } from 'src/datalayer/model';

export enum IAO_REVENUE_SORT_FIELD {
  PARTICIPATION_START_TIME = 'participationStartTime',
  PARTICIPATION_END_TIME = 'participationEndTime',
  EVENT_ID = 'iaoEventId',
  SOLD_AMOUNT = 'soldAmount',
  PARTICIPATED_AMOUNT = 'participatedAmount',
  PARTICIPANTS = 'participants',
  PROGRESS = 'progress',
}

export class GetListIaoRevenueDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  keyword: string;

  @IsEnum(IAO_EVENT_STAGE)
  @IsOptional()
  @ApiProperty({
    required: false,
    type: Number,
    description:
      '1 => Upcomming, 2 => Register now, 3 => On sale soon, 4 => On sale, 5 => Completed, 6 => Failed',
  })
  @Type(() => Number)
  stage: IAO_EVENT_STAGE;

  @IsEnum(REVENUE_STATUS)
  @IsOptional()
  @ApiProperty({
    type: Number,
    required: false,
    description:
      '0 => Pending, 1 => In review, 2 => Approve, 3 => Rejected, 4 => Closed',
  })
  @Type(() => Number)
  status: REVENUE_STATUS;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  startFrom: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  startTo: string;

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

  @IsEnum(IAO_REVENUE_SORT_FIELD)
  @ApiProperty({
    required: false,
    type: String,
    description:
      'participationStartTime => Participation Start Time, participationEndTime => Participation Start Time, iaoEventId => Event ID, soldAmount => Sold Amount, participatedAmount => Participated Amount, participants => Participants, progress => Progress',
  })
  @IsOptional()
  sortField: IAO_REVENUE_SORT_FIELD;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}
