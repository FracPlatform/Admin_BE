import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import 'dotenv/config';
import { ApiError } from 'src/common/api';
import { FILE_PRESIGN_URL, PresignUrlDto } from './dto/s3.dto';

@Injectable()
export class S3Service {
  async getPresignedUrl(presignUrlDto: PresignUrlDto, user: any) {
    const nameArr = presignUrlDto.name.split('.');
    const fileExt = nameArr[nameArr.length - 1];

    if (!FILE_PRESIGN_URL.includes(fileExt)) {
      throw ApiError('', `Invalid file type`);
    }

    const s3 = this.getS3();
    const putPresignedURL = s3.getSignedUrl('putObject', {
      Bucket: process.env.AWS_BUCKET,
      Key: `${user._id}/${presignUrlDto.type}/${String(
        presignUrlDto.name,
      ).toLowerCase()}`, //filename,
      ACL: 'public-read',
    });

    const getPresignedS3Url = `${process.env.AWS_S3_URL}/${user._id}/${
      presignUrlDto.type
    }/${String(presignUrlDto.name).toLowerCase()}`;
    return {
      putPresignedURL,
      getPresignedS3Url,
    };
  }

  async uploadNftMetadata(metadata: object, tokenId: string) {
    const data = {
      Bucket: process.env.AWS_BUCKET,
      Key: `metadata/${tokenId.toLowerCase()}`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
      ACL: 'public-read',
    };
    const s3 = this.getS3();
    s3.putObject(data, (err, data) => {
      if (err) throw err;
    });
    const metadataUrl = `${
      process.env.AWS_S3_URL
    }/metadata/${tokenId.toLowerCase()}`;
    return metadataUrl;
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      signatureVersion: 'v4',
    });
  }
}
