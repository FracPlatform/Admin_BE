import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import 'dotenv/config';
import { ApiError } from 'src/common/api';
import { FILE_PRESIGN_URL, PresignUrlDto } from './dto/s3.dto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
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
      this.logger.debug(data);
    });
    const metadataUrl = `${
      process.env.AWS_S3_URL
    }/metadata/${tokenId.toLowerCase()}`;
    return metadataUrl;
  }

  async uploadS3(buffer, mimetype, name) {
    const s3 = this.getS3();
    const params: S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: String(name),
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    };
    return new Promise<string>((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data['Location']);
      });
    });
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
