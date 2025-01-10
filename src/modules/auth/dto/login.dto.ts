import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: String, required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  walletAddress: string;

  @ApiProperty({ type: String, required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  signData: string;
}

export class RefreshTokenDto {
  @ApiProperty({ type: String, required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}