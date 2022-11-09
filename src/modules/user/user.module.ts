import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DataServicesModule } from 'src/services';
import { UserBuilderService } from './user.factory.service';
import { MailModule } from 'src/services/mail/mail.module';

@Module({
  imports: [DataServicesModule, MailModule],
  controllers: [UserController],
  providers: [UserService, UserBuilderService],
})
export class UserModule {}
