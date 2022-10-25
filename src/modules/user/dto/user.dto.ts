import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAffiliateDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Max(50, { message: 'E10' })
  @Min(20, { message: 'E24' })
  masterCommissionRate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  @Min(1)
  maxSubFristCommissionRate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  @Min(1)
  maxSubSecondCommissionRate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bd: string;
}
