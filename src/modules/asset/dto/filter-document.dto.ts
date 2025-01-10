import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DISPLAY_STATUS {
  DISPLAY = 1,
  NOT_DISPLAY = 0,
}

export class FilterDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(256)
  @ApiProperty({ type: String, required: false })
  keyword?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  @ApiProperty({
    type: DISPLAY_STATUS,
    required: false,
    description: '1 => true, 0 => false',
  })
  display?: DISPLAY_STATUS;
}

export class GetDetailAssetDto {
  @IsString()
  @IsOptional()
  @MaxLength(256)
  @ApiProperty({ type: String, required: false })
  nftId?: string;
}
