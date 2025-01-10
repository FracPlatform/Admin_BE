import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { Web3Gateway } from 'src/blockchain/web3.gateway';
import { Web3ETH } from 'src/blockchain/web3.eth';
import { ADMIN_STATUS } from '../../datalayer/model';
import { Role } from './role.enum';
import { DeactiveAccountException } from './exception.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataServices: IDataServices,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithSignData(data: LoginDto) {
    const user = await this._validateUser(data.walletAddress, data.signData);
    if (!user)
      throw ApiError(
        ErrorCode.INVALID_ADDRESS_OR_SIGNDATA,
        'Invalid address or signData',
      );

    const role = await this.getRoleForAdmin(data.walletAddress);

    if (+role === Role.Deactive) {
      throw new DeactiveAccountException();
    }

    const accessToken = await this._genJwtToken({
      email: user.email,
      id: user['_id'],
      fullname: user.fullname,
      role,
    });

    const refreshToken = await this._genJwtRefreshToken({
      email: user.email,
      id: user['_id'],
      fullname: user.fullname,
      role,
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(data: RefreshTokenDto) {
    try {
      const decodeToken = await this.jwtService.verify(data.refreshToken);
      const accessToken = await this._genJwtToken({
        email: decodeToken.email,
        id: decodeToken.id,
        fullname: decodeToken.fullname,
        role: decodeToken.role,
      });
      return { accessToken };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  private async _genJwtToken(data: {
    email: string;
    id: string;
    fullname: string;
    role: string;
  }) {
    return await this.jwtService.signAsync(data, {
      expiresIn: process.env.JWT_EXPIRATION_TIME,
    });
  }

  private async _genJwtRefreshToken(data: {
    email: string;
    id: string;
    fullname: string;
    role: string;
  }) {
    return await this.jwtService.signAsync(data, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
    });
  }

  private async _validateUser(walletAddress: string, signData: string) {
    const user = await this._validateAddress(walletAddress);
    const isSignVerified = await this._verifySign(signData, user.walletAddress);

    return isSignVerified ? user : null;
  }

  private async _validateAddress(walletAddress: string) {
    const web3Service = new Web3ETH();
    const user = await this.dataServices.admin.findOne({
      walletAddress: web3Service.toChecksumAddress(walletAddress),
      status: ADMIN_STATUS.ACTIVE,
      deleted: false,
    });
    if (!user)
      throw ApiError(
        ErrorCode.INVALID_ADDRESS_OR_SIGNDATA,
        'Address not exists',
      );
    return user;
  }

  private async _verifySign(signData: string, walletAddress: string) {
    try {
      const web3Gateway = new Web3Gateway(+process.env.CHAIN_ID);
      const addressRecover = await web3Gateway.recover(
        [walletAddress.trim()],
        signData,
      );
      return addressRecover.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      throw ApiError('', `Can't verify signature: ${error.message}`);
    }
  }

  private async getRoleForAdmin(walletAddress: string) {
    try {
      const contractProxy = await new Web3ETH().getContractInstance();
      const resVerifyAdmin = await contractProxy.methods
        .getAdminRole(walletAddress.trim())
        .call();
      return resVerifyAdmin;
    } catch (error) {
      throw ApiError('', `Can't call contract: ${error.message}`);
    }
  }
}
