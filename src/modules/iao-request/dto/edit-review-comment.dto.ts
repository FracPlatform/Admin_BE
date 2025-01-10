import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MAX_IAO_REQUEST_COMMENT } from 'src/datalayer/model';

export class EditReviewComment {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  requestId: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(MAX_IAO_REQUEST_COMMENT)
  firstComment: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_IAO_REQUEST_COMMENT)
  secondComment: string;
}
