import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guard/roles.guard';
import { FileUploadDto } from './dto/upload-file.dto';
import { IpfsGateway } from './ipfs.gateway';
import { IpfsClientType } from './ipfs.type';

@Controller('ipfs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('IPFS')
export class IPFSController {
  private ipfsService: IpfsGateway;
  constructor() {
    this.ipfsService = new IpfsGateway(IpfsClientType.SELF_HOST);
  }
  @Post()
  @ApiOperation({ summary: 'Upload file to IPFS' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Media',
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const url = await this.ipfsService.upload(file);
      return new ApiSuccessResponse().success(url, '');
    } catch (error) {
      throw error;
    }
  }
}
