import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { LOCALIZATION, PLATFORM_SITE } from 'src/common/constants';

export class SubscriberDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(256)
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsEnum(LOCALIZATION)
  localization: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsEnum(PLATFORM_SITE)
  platformSite: number;
}

export class UnSubscriberDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(256)
  email: string;

  @ApiProperty({ type: String, required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsEnum(PLATFORM_SITE)
  platformSite: number;
}
