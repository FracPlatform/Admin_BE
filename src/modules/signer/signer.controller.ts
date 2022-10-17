import { Controller } from '@nestjs/common';
import { SignerService } from './signer.service';

@Controller('signer')
export class SignerController {
  constructor(private readonly signerService: SignerService) {}
}
