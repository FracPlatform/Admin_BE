import { TieringPoolStatus } from 'src/common/constants';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEthereumAddress,
  IsEnum,
} from 'class-validator';

export class CreateTieringPoolDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  @IsString()
  _stakingToken: string;

  @IsNotEmpty()
  @IsNumber()
  _poolId;

  @IsNotEmpty()
  @IsNumber()
  _lockDuration: number;

  @IsNotEmpty()
  @IsNumber()
  _withdrawDelayDuration: number;
}

export class UpdateTieringPoolDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  @IsEnum(TieringPoolStatus)
  tieringPoolStatus: number;
}
