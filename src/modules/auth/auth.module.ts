import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthBuilderService } from './auth-factory.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/services/mail/mail.module';
import { DataServicesModule } from 'src/services';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    DataServicesModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION_TIME },
    }),
    MailModule,
  ],
  providers: [AuthService, AuthBuilderService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
