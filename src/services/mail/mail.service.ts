import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EMAIL_CONFIG } from 'src/common/email-config';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private MAIL_TITLE = process.env.MAIL_TITLE || '';

  async sendMail(data: any) {
    data.subject = `${process.env.MAIL_TITLE}${data.subject}`;
    data.context = {
      ...data.context,
      contactUs: `${process.env.FRACTOR_DOMAIN}/contact-us`,
      fractorDomain: process.env.FRACTOR_DOMAIN,
      adminDomain: process.env.ADMIN_DOMAIN,
      traderDomain: process.env.TRADER_DOMAIN,
      landingPage: process.env.LANDING_PAGE,
      dexDomain: process.env.DEX_DOMAIN,
      twitterLink: EMAIL_CONFIG.SOCIAL_LINK.TWITTER,
      youtubeLink: EMAIL_CONFIG.SOCIAL_LINK.YOUTUBE,
      linkedinLink: EMAIL_CONFIG.SOCIAL_LINK.LINKEDIN,
      bscDomain: process.env.BSC_SCAN_DOMAIN,
    };
    data.attachments = [
      {
        filename: 'logo-frac.png',
        path: './src/services/email/attachments/logo-frac.png',
        cid: 'logo-frac',
      },
      {
        filename: 'twitter.png',
        path: './src/services/email/attachments/twitter.png',
        cid: 'twitter',
      },
      // {
      //   filename: 'youtube.png',
      //   path: './src/services/email/attachments/youtube.png',
      //   cid: 'youtube',
      // },
      {
        filename: 'linkedin.png',
        path: './src/services/email/attachments/linkedin.png',
        cid: 'linkedin',
      },
    ];
    await this.mailerService.sendMail(data);
  }

  // async sendMailParticipationEndTimeToAdmin(
  //   email: string[],
  //   subject: string,
  //   template: string,
  //   data: any,
  // ) {
  //   await this.mailerService.sendMail({
  //     bcc: email,
  //     from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
  //     subject: this.MAIL_TITLE + subject,
  //     template,
  //     context: {
  //       eventName: data.eventName,
  //       eventDetailUrl: `${process.env.ADMIN_DOMAIN}/iao-event/${data.eventId}`,
  //       eventRevenueUrl: `${process.env.ADMIN_DOMAIN}/iao-revenue/${data.eventId}`,
  //       fractorDomain: process.env.FRACTOR_DOMAIN,
  //       adminDomain: process.env.ADMIN_DOMAIN,
  //       traderDomain: process.env.TRADER_DOMAIN,
  //       landingPage: process.env.LANDING_PAGE,
  //       dexDomain: process.env.DEX_DOMAIN,
  //       contactUs: `${process.env.TRADER_DOMAIN}/contact-us`,
  //     },
  //   });
  // }

  async sendMailFnftMergedToAdmin(email: string[], data: any) {
    await this.mailerService.sendMail({
      bcc: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject: this.MAIL_TITLE + EMAIL_CONFIG.TITLE.FNFT_MERGED,
      template: `./${EMAIL_CONFIG.DIR.FNFT_MERGED}`,
      context: {
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        fnftDetailUrl: `${process.env.ADMIN_DOMAIN}/f-nfts/${data.fnftId}`,
        walletAddress: data.walletAddress,
        userId: data.userId,
        fractorDomain: process.env.FRACTOR_DOMAIN,
        adminDomain: process.env.ADMIN_DOMAIN,
        traderDomain: process.env.TRADER_DOMAIN,
        landingPage: process.env.LANDING_PAGE,
        dexDomain: process.env.DEX_DOMAIN,
        contactUs: `${process.env.TRADER_DOMAIN}/contact-us`,
        twitterLink: EMAIL_CONFIG.SOCIAL_LINK.TWITTER,
        youtubeLink: EMAIL_CONFIG.SOCIAL_LINK.YOUTUBE,
        linkedinLink: EMAIL_CONFIG.SOCIAL_LINK.LINKEDIN,
        bscDomain: process.env.BSC_SCAN_DOMAIN,
      },
      attachments: [
        {
          filename: 'logo-frac.png',
          path: './src/services/email/attachments/logo-frac.png',
          cid: 'logo-frac',
        },
        {
          filename: 'twitter.png',
          path: './src/services/email/attachments/twitter.png',
          cid: 'twitter',
        },
        // {
        //   filename: 'youtube.png',
        //   path: './src/services/email/attachments/youtube.png',
        //   cid: 'youtube',
        // },
        {
          filename: 'linkedin.png',
          path: './src/services/email/attachments/linkedin.png',
          cid: 'linkedin',
        },
      ],
    });
  }

  // async sendMailWhitelistIsEmptyToAdmin(email: string[], data: any) {
  //   await this.mailerService.sendMail({
  //     bcc: email,
  //     from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
  //     subject: this.MAIL_TITLE + EMAIL_CONFIG.TITLE.WHITELIST_EMPTY,
  //     template: `./${EMAIL_CONFIG.DIR.WHITELIST_EMPTY}`,
  //     context: {
  //       eventName: data.eventName,
  //       eventId: data.eventId,
  //       fractorDomain: process.env.FRACTOR_DOMAIN,
  //       adminDomain: process.env.ADMIN_DOMAIN,
  //       traderDomain: process.env.TRADER_DOMAIN,
  //       landingPage: process.env.LANDING_PAGE,
  //       dexDomain: process.env.DEX_DOMAIN,
  //       contactUs: `${process.env.TRADER_DOMAIN}/contact-us`,
  //     },
  //   });
  // }

  // async sendMailWhitelistToTrader(
  //   email: string[],
  //   linkConfigMail,
  //   data: any,
  //   lang: string,
  // ) {
  //   await this.mailerService.sendMail({
  //     bcc: email,
  //     from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
  //     subject: this.MAIL_TITLE + EMAIL_CONFIG.TITLE?.[linkConfigMail]?.[lang],
  //     template: `./${EMAIL_CONFIG.DIR?.[linkConfigMail]}-${lang}`,
  //     context: {
  //       eventName: data.eventName,
  //       eventDetailUrl: `${process.env.TRADER_DOMAIN}/iao-event/${data.eventId}`,
  //       fractorDomain: process.env.FRACTOR_DOMAIN,
  //       adminDomain: process.env.ADMIN_DOMAIN,
  //       traderDomain: process.env.TRADER_DOMAIN,
  //       landingPage: process.env.LANDING_PAGE,
  //       dexDomain: process.env.DEX_DOMAIN,
  //       contactUs: `${process.env.TRADER_DOMAIN}/contact-us`,
  //     },
  //   });
  // }

  // async sendMailRejectIaoRevenueToTrader(
  //   email: string | string[],
  //   data: any,
  //   lang: string,
  // ) {
  //   await this.mailerService.sendMail({
  //     bcc: email,
  //     from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
  //     subject:
  //       this.MAIL_TITLE +
  //       EMAIL_CONFIG.TITLE.REJECT_IAO_REVENUE_TO_WHITELIST?.[lang],
  //     template: `./${EMAIL_CONFIG.DIR.REJECT_IAO_REVENUE_TO_WHITELIST}-${lang}`,
  //     context: {
  //       eventName: data.eventName,
  //       eventDetailUrl: `${process.env.TRADER_DOMAIN}/iao-event/${data.eventId}`,
  //       walletAddress: data.walletAddress,
  //       fractorDomain: process.env.FRACTOR_DOMAIN,
  //       adminDomain: process.env.ADMIN_DOMAIN,
  //       traderDomain: process.env.TRADER_DOMAIN,
  //       landingPage: process.env.LANDING_PAGE,
  //       dexDomain: process.env.DEX_DOMAIN,
  //       contactUs: `${process.env.TRADER_DOMAIN}/contact-us`,
  //     },
  //   });
  // }
}
