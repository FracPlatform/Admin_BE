import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsEnum,
  IsEmail,
  IsEthereumAddress,
  Min,
  Max,
} from 'class-validator';

export class FilterAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  @MaxLength(256)
  name: string;

  @ApiProperty({
    required: false,
    description:
      'SuperAdmin = 1, OperationAdmin = 2, HeadOfBD = 3, FractorBD = 4, MasterBD = 5',
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
}

export class CreateAdminDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(256)
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    required: true,
    description:
      'SuperAdmin = 1, OperationAdmin = 2, HeadOfBD = 3, FractorBD = 4, MasterBD = 5',
  })
  @Type(() => Number)
  @IsNumber()
  @IsEnum([1, 2, 3, 4, 5])
  role: number;

  @ApiProperty({
    required: false,
    description: "Commission rate of Affiliate's BD",
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99.99)
  @IsOptional()
  commissionRate: number;
}

export class UpdateAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description: string;

  @ApiProperty({
    required: false,
    description: "Commission rate of Affiliate's BD",
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99.99)
  @IsOptional()
  commissionRate: number;
}
