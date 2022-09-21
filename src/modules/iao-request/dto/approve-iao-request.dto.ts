import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_IAO_REQUEST_COMMENT } from 'src/datalayer/model';

export class ApproveIaoRequestDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  requestId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_IAO_REQUEST_COMMENT)
  comment: string;
}
