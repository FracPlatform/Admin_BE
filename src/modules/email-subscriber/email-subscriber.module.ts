import { JWT_SUBSCRIBE_EMAIL } from './../../common/constants';
import { Module } from '@nestjs/common';
import { EmailSubcriberService } from './email-subscriber.service';
import { EmailSubscriberController } from './email-subscriber.controller';
import { DataServicesModule } from 'src/services';
import { EmailModule } from 'src/services/email/email.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DataServicesModule,
    EmailModule,
    JwtModule.register({
      secret: JWT_SUBSCRIBE_EMAIL.PRIVATE_KEY,
    }),
  ],
  controllers: [EmailSubscriberController],
  providers: [EmailSubcriberService],
})
export class EmailSubscriberModule {}
