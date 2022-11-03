import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum S3_TYPE {
  ASSET = 'asset',
  IAO_EVENT = 'iao-event',
  NFT = 'nft',
  FNFT = 'fnft',
  IAO_REQUEST = 'iao-request',
  ASSET_TYPE = 'asset-type',
  BANNER = 'banner',
}

export const FILE_PRESIGN_URL = [
  'png',
  'jpg',
  'jpeg',
  'svg+xml',
  'gif',
  'svg',
  'jfif',
  'glb',
  'x-aiff',
  'basic',
  'x-mpegurl',
  'mid',
  'mpeg',
  'x-pn-realaudio',
  'wav',
  'webm',
  'ogg',
  'mp3',
  'x-ms-asf',
  'x-msvideo',
  'x-la-asf',
  'quicktime',
  'x-sgi-movie',
  'mpeg',
  'mp4',
  'webm',
  'ogg',
  'x-vrml',
  'x-troff-ms',
  'gltf-binary',
  'pdf',
  'docx',
];

export class PresignUrlDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @IsEnum(S3_TYPE)
  type: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;
}
