import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum QUERY_TYPE {
  AFFILIATE = 1,
}

export class FilterUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  textSearch: string;

  @ApiProperty({
    required: false,
    description: 'NORMAL = 1, MASTER = 2, SUB_1 = 3, SUB_2 = 4 ',
  })
  @IsOptional()
  role: string;

  @ApiProperty({ required: false, description: '1- Active, 0 - Inactive' })
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
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsEnum(QUERY_TYPE)
  queryType: number;
}

export class CreateAffiliateDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Max(50, { message: 'E10' })
  @Min(20, { message: 'E24' })
  commissionRate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Max(100)
  @Min(1)
  maxSubFristCommissionRate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Max(100)
  @Min(1)
  maxSubSecondCommissionRate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bd: string;
}
export class DeactivateUserDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  @MinLength(1)
  comment: string;
}

export class UpdateAffiliateDTO extends CreateAffiliateDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  walletAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @MinLength(1)
  deactivationComment: string;
}
