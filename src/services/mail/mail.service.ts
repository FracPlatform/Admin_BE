import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(
    email: string | string[],
    verificationCode: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Frac! Confirm your Email',
      template: './confirmation', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        verificationCode,
      },
    });
  }

  async sendNotification(email: string | string[], description: string) {
    await this.mailerService.sendMail({
      to: email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Announcement Notification',
      template: './notification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        description,
      },
    });
  }
}
