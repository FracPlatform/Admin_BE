import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';

@Processor('sendMailFracAdmin')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  constructor(private readonly mailService: EmailService) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processor:@OnQueueActive - Processing job ${job.id} of type ${job.name}.`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.log(
      `Processor:@OnQueueCompleted - Completed job ${job.id} of type ${job.name}.`,
    );
  }

  @OnQueueFailed()
  onError(job: Job<any>, error) {
    this.logger.log(
      `Processor:@OnQueueFailed - Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }

  @Process('sendmailFracAdmin')
  async sendWelcomeEmail(job: Job): Promise<any> {
    this.logger.log('Processor:@Process - Sending email.');
    try {
      if (job.data['addQueue'])
        return await this.mailService._sendMailV2(job.data['mail']);
      return await this.mailService.sendEmail(job.data['mail'], job.id);
    } catch (error) {
      this.logger.error('Failed to send email.', error.stack);
      throw error;
    }
  }
}
