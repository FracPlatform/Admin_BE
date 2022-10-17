import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SetSignerDto } from './dto/signer.dto';
import { SignerService } from './signer.service';

@Controller('signer')
@ApiTags('Signer')
export class SignerController {
  constructor(private readonly signerService: SignerService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'genSigner' })
  async genSigner(@Body() data: SetSignerDto) {
    return await this.signerService.createSigner(data);
  }
}
