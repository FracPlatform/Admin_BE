import { Controller, Delete, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { DeleteFileDTO, PresignUrlDto } from './dto/s3.dto';
import { S3Service } from './s3.service';

@Controller('s3')
@ApiTags('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'get presigned URL' })
  @ApiBearerAuth()
  async create(@Query() presignUrlDto: PresignUrlDto, @Req() req: Request) {
    try {
      const result = await this.s3Service.getPresignedUrl(
        presignUrlDto,
        req.user,
      );
      return new ApiSuccessResponse().success(result, '');
    } catch (error) {
      throw error;
    }
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'delete file s3' })
  @ApiBearerAuth()
  async delete(@Query() data: DeleteFileDTO) {
    try {
      const result = await this.s3Service.deleteFile(data.url);
      return new ApiSuccessResponse().success(result, '');
    } catch (error) {
      throw error;
    }
  }
}
