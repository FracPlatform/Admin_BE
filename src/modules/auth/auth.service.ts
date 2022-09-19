import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { MailService } from 'src/services/mail/mail.service';
import { AuthBuilderService } from './auth-factory.service';
import { Utils } from 'src/common/utils';
import { ethers } from 'ethers';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { Web3Utils } from 'src/common/web3';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataServices: IDataServices,
    private readonly mailService: MailService,
    private readonly authBuilder: AuthBuilderService,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithSignData(data: LoginDto) {
    const user = await this._validateUser(data.email, data.signData);
    if (!user)
      throw ApiError(
        ErrorCode.INVALID_EMAIL_OR_PASSWORD,
        'Invalid email or password',
      );

    const accessToken = await this._signJwtToken({
      email: user.email,
      id: user['_id'],
      fullname: user.fullname,
    });
    return { accessToken };
  }

  private async _signJwtToken(data: {
    email: string;
    id: string;
    fullname: string;
  }) {
    return await this.jwtService.signAsync(data);
  }

  private async _validateUser(email: string, signData: string) {
    const user = await this._validateEmail(email);
    const isSignVerified = await this._verifySign(signData, user.walletAddress);
    console.log(49, isSignVerified);
    
    return isSignVerified ? user : null;
  }

  private async _validateEmail(email: string) {
    const user = await this.dataServices.admin.findOne({ email });
    if (!user)
      throw ApiError(ErrorCode.INVALID_EMAIL_OR_PASSWORD, 'Email not exists');
    return user;
  }

  private async _verifySign(signData: string, walletAddress: string) {
    const hashData = ethers.utils.solidityKeccak256(
      ['address'],
      [walletAddress],
    );

    return await Web3Utils.verifySignatureData(hashData, signData, walletAddress);
  }
}
