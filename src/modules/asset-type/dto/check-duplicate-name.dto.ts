import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum LANGUAGE {
  EN = 'en',
  JA = 'ja',
  CN = 'cn',
}

export class CheckDuplicateNameDto {
  @IsEnum(LANGUAGE)
  @ApiProperty({
    type: String,
    enum: LANGUAGE,
    description: 'en => English, ja => Japanese, cn => Chinese',
  })
  lang: LANGUAGE;

  @IsString()
  @ApiProperty({ type: String })
  name: string;
}

export class CheckDuplicateSpecificationDto {
  @IsEnum(LANGUAGE)
  @ApiProperty({
    type: String,
    enum: LANGUAGE,
    description: 'en => English, ja => Japanese, cn => Chinese',
  })
  lang: LANGUAGE;

  @IsString()
  @ApiProperty({ type: String })
  label: string;
}
