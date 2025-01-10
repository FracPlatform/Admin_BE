import {
  IsString,
  IsNotEmpty,
  IsEthereumAddress,
  IsOptional,
} from 'class-validator';

export class StakingInfoDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  @IsString()
  walletAddress: string;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  transactionHash: string;
}
