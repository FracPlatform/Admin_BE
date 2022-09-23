import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchSpecificationsDto {
  @IsString()
  @MaxLength(256)
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  keyword: string;
}
