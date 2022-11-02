import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class DataLabel {
  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  0: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  1: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  2: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  3: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  4: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  5: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  6: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  7: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  8: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(256)
  9: string;
}

export class DataLabelNotEmpty {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  0: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  1: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  2: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  3: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  4: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  5: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  6: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  7: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  8: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  9: string;
}

export class Label {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DataLabelNotEmpty)
  en: DataLabelNotEmpty;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DataLabel)
  cn: DataLabel;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DataLabel)
  ja: DataLabel;
}

export enum EDITABLE_CUSTODIANSHIP_STATUS {
  FRACTOR = 0,
  FRACTOR_TO_FRAC_OR_IN_REVIEW = 1,
  FRAC = 2,
}

export class UpdateCustodianshipDto {
  @IsEnum(EDITABLE_CUSTODIANSHIP_STATUS)
  @IsOptional()
  @ApiProperty({
    required: false,
    type: Number,
    description: '0 => Fractor, 1 => In review, 2 => Frac',
  })
  status: EDITABLE_CUSTODIANSHIP_STATUS;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => Label)
  label: Label;

  @ApiProperty({
    required: false,
    type: Number,
    description: '0 => false, 1 => true',
  })
  @IsEnum([0, 1])
  @IsOptional()
  @IsNumber()
  storedByFrac: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(2500)
  warehousePublic: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(2500)
  warehousePrivate: string;
}
