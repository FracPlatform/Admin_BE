import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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
