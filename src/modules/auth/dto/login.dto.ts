import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: String, required: true, nullable: false })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  signData: string;
}
