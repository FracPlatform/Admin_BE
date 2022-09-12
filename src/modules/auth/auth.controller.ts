import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { AdminDocument } from 'src/datalayer/model';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GetUser } from './get-user.decorator';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AuthBuilderService } from './auth-factory.service';
import { ProfileAdmin } from 'src/entity';

@Controller('admin/auth')
@ApiTags('Admin Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authBuilderService: AuthBuilderService,
  ) {}

  @Post('login')
  async loginWithHashData(@Body() loginDto: LoginDto) {
    try {
      const responseData = await this.authService.loginWithSignData(loginDto);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Req() req) {
    try {
      const profile: ProfileAdmin = this.authBuilderService.createProfile(req.user);
      return new ApiSuccessResponse().success(profile, '');
    } catch (err) {
      throw err;
    }
  }
}
