import { JWT_SUBSCRIBE_EMAIL, PLATFORM_SITE } from './../../common/constants';
import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { EmailService, Mail } from 'src/services/email/email.service';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { SubscriberDto, UnSubscriberDto } from './dto/email-subscriber.dto';
import { LOCALIZATION } from 'src/common/constants';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class EmailSubcriberService {
  private readonly logger = new Logger(EmailSubcriberService.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async subscribe(body: SubscriberDto) {
    const email = body.email.toLocaleLowerCase();
    // check mail was subscribed
    const checkSubscriber = await this.dataService.emailSubscriber.findOne({
      email: email,
    });
    if (checkSubscriber?.isSubscribed) {
      throw ApiError('E42', 'The email was subscribed');
    }

    if (checkSubscriber) {
      await this.dataService.emailSubscriber.findOneAndUpdate(
        {
          email: email,
        },
        {
          isSubscribed: true,
        },
      );
    } else {
      await this.dataService.emailSubscriber.create({
        email: email,
        isSubscribed: true,
      });
    }

    const token = await this.jwtService.signAsync(
      { email: email },
      {
        secret: JWT_SUBSCRIBE_EMAIL.PRIVATE_KEY,
      },
    );

    await this.sendMailSubscription(body, token);
    return { success: true };
  }

  async unSubscribe(body: UnSubscriberDto) {
    const email = body.email.toLocaleLowerCase();

    const emailSubscriber = await this.dataService.emailSubscriber.findOne({
      email: body.email.toLocaleLowerCase(),
    });

    if (!emailSubscriber) {
      throw ApiError('', 'This email is not subscribed');
    }

    const payload = await this.decodeToken(body.token);

    if (payload.email !== email) {
      throw ApiError('', 'Email not match');
    }

    if (!emailSubscriber.isSubscribed) {
      return { success: true };
    }

    await this.dataService.emailSubscriber.findOneAndUpdate(
      {
        email: email,
      },
      { isSubscribed: false },
    );

    await this.sendMailUnSubscription(body);
    return { success: true };
  }

  async sendMailSubscription(body: SubscriberDto, token: string) {
    // send mail
    const localization = body.localization;
    let localizeUrl = '';
    let title = EMAIL_CONFIG.TITLE.SUBSCRIBER.EN;
    let template = 'SO_en';
    if (localization === LOCALIZATION.CN) {
      title = EMAIL_CONFIG.TITLE.SUBSCRIBER.CN;
      template = 'SO_cn';
      localizeUrl = '/cn';
    }
    if (localization === LOCALIZATION.JP) {
      title = EMAIL_CONFIG.TITLE.SUBSCRIBER.JA;
      template = 'SO_ja';
      localizeUrl = '/ja';
    }
    if (localization === LOCALIZATION.VN) {
      title = EMAIL_CONFIG.TITLE.SUBSCRIBER.VI;
      template = 'SO_vi';
      localizeUrl = '/vi';
    }

    let siteUrl = process.env.FRACTOR_DOMAIN;
    if (body.platformSite === PLATFORM_SITE.TRADER) {
      siteUrl = process.env.TRADER_DOMAIN;
    }
    if (body.platformSite === PLATFORM_SITE.LANDING_PAGE) {
      siteUrl = process.env.LANDING_PAGE;
    }
    const mail = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      body.email,
      title,
      {
        localization: localization,
        linkUnsubscribe: `${siteUrl}${localizeUrl}/?email=${encodeURIComponent(
          body.email,
        )}&token=${token}`,
        siteUrl,
      },
      EMAIL_CONFIG.DIR.SUBSCRIBER,
      template,
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );

    // send to Admin
    const mailAdmin = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      EMAIL_CONFIG.HELLO_MAIL,
      EMAIL_CONFIG.TITLE.NEW_SUBSCRIPTION,
      { email: body.email },
      EMAIL_CONFIG.DIR.SUBSCRIBER,
      'NS',
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );

    await Promise.all([
      this.emailService.sendMailFrac(mail),
      this.emailService.sendMailFrac(mailAdmin),
    ]);
  }

  async sendMailUnSubscription(body: UnSubscriberDto) {
    const mailAdmin = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      EMAIL_CONFIG.HELLO_MAIL,
      EMAIL_CONFIG.TITLE.NEW_UNSUBSCRIPTION,
      { email: body.email },
      EMAIL_CONFIG.DIR.SUBSCRIBER,
      'NU',
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );
    await Promise.all([this.emailService.sendMailFrac(mailAdmin)]);
  }

  async decodeToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: JWT_SUBSCRIBE_EMAIL.PRIVATE_KEY,
      });
      if (typeof payload === 'object' && 'email' in payload) {
        return payload;
      }
      throw ApiError('', 'Confirm Link is invalid');
    } catch (error) {
      throw ApiError('', 'Bad confirmation token');
    }
  }
}
