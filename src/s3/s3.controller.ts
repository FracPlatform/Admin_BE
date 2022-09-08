import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { PresignUrlDto } from './dto/s3.dto';
import { S3Service } from './s3.service';

@Controller('s3')
@ApiTags('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) { }

  @Get()
  @ApiOperation({ summary: 'get presigned URL' })
  @ApiBearerAuth()
  async create(
    @Query() presignUrlDto: PresignUrlDto,
    @Req() req: Request,
  ) {
    try {
      const result = await this.s3Service.getPresignedUrl(presignUrlDto, req.user);
      return new ApiSuccessResponse().success(result, '');
    } catch (error) {
      throw error;
    }
  }

}
