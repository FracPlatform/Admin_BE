import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './email.processor';
import { CommonModule } from 'src/common-service/common.module';
import { MailModule } from '../mail/mail.module';

@Module({
  providers: [EmailService, MailProcessor],
  imports: [
    BullModule.registerQueueAsync({
      name: 'sendMailFracAdmin',
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
        },
      }),
    }),
    CommonModule,
    MailModule
  ],
  exports: [EmailService],
})
export class EmailModule {}
