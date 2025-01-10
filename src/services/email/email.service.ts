import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
// import * as hbs from 'nodemailer-express-handlebars';
import { CommonService } from 'src/common-service/common.service';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { MailService } from '../mail/mail.service';
const hbs = require('nodemailer-express-handlebars');

@Injectable()
export class EmailService {
  private transporter: any = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue('sendMailFracAdmin')
    private mailQueue: Queue,
    private readonly commonService: CommonService,
    private readonly mailService: MailService,
  ) {}

  public async sendMailFrac(mail: Mail): Promise<boolean> {
    try {
      this.logger.log('sent mail: ', mail.template);
      await this.mailQueue.add(
        'sendmailFracAdmin',
        { mail },
        { attempts: 5, backoff: 2000, timeout: 30000, removeOnComplete: true },
      );
      return true;
    } catch (err) {
      this.logger.log('Error send mail: ' + err);
      return false;
    }
  }

  public async addQueue(mail: any): Promise<boolean> {
    try {
      this.logger.log(
        'Add mail to queue: ',
        JSON.stringify({
          template: mail.template,
        }),
      );
      await this.mailQueue.add(
        'sendmailFracAdmin',
        { mail, addQueue: true },
        { attempts: 6, backoff: 5000, timeout: 30000, removeOnComplete: true },
      );
      return true;
    } catch (err) {
      this.logger.log('Error add mail to queue: ' + err);
      return false;
    }
  }

  public async _sendMailV2(data) {
    await this.mailService.sendMail(data);
  }

  public async sendEmail(mail: Mail, jobId: any) {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: +process.env.MAIL_PORT,
      // secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      pool: true,
    });

    const mailOption = {
      from: {
        name: mail.fromEmail,
        address: process.env.MAIL_FROM,
      },
      to: mail.toEmail,
      subject: `${process.env.MAIL_TITLE}${mail.subject}`,
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
      template: mail.template,
      context: {
        fractorDomain: process.env.FRACTOR_DOMAIN,
        adminDomain: process.env.ADMIN_DOMAIN,
        traderDomain: process.env.TRADER_DOMAIN,
        landingPage: process.env.LANDING_PAGE,
        dexDomain: process.env.DEX_DOMAIN,
        twitterLink: EMAIL_CONFIG.SOCIAL_LINK.TWITTER,
        youtubeLink: EMAIL_CONFIG.SOCIAL_LINK.YOUTUBE,
        linkedinLink: EMAIL_CONFIG.SOCIAL_LINK.LINKEDIN,
        traderContactUs: EMAIL_CONFIG.CONTACT_US.TRADER,
        fractorContactUs: EMAIL_CONFIG.CONTACT_US.FRACTOR,
        ...mail.context,
      },
      replyTo: mail.replyTo,
      bcc: mail.bcc,
    };

    console.log('hbs', hbs);
    
    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          partialsDir: '/src/services/email/mail-templates',
          layoutsDir:
            process.cwd() + `/src/services/email/mail-templates/${mail.dir}`,
          defaultLayout: mail.template,
        },
        viewPath: 'src/services/email/mail-templates/' + mail.dir,
        extName: '.hbs',
      }),
    );

    await this.send(mailOption, jobId, this.transporter, this.logger);
  }

  private send(mailOptions, jobId, transporter, logger) {
    return new Promise(function (resolve, reject) {
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          logger.error('Email Sending Error...:::');
          logger.error(err);
          reject(err);
        } else {
          logger.log(`Email Sent Successfully:: ${jobId}`);
          resolve(info);
        }
      });
    });
  }
}

/**
 * Class Mail includes property:
 * fromEmail: name of Sender
 * toEmail: send to email
 * subject: subject email
 * context: context email
 * dir: dir of template to send
 * template
 * replyTo: mail when replyTo
 * bcc: bcc mails
 */
export class Mail {
  fromEmail: string;
  toEmail: string | string[];
  subject: string;
  context: object;
  dir: string;
  template: string;
  replyTo: string;
  bcc: string | string[];

  constructor(
    fromEmail: string,
    toEmail: string | string[],
    subject: string,
    context: object,
    dir: string,
    template: string,
    replyTo: string,
    bcc: string | string[] = undefined,
  ) {
    this.fromEmail = fromEmail;
    this.toEmail = toEmail;
    this.subject = subject;
    this.context = context;
    this.dir = dir;
    this.template = template;
    this.replyTo = replyTo;
    this.bcc = bcc;
  }
}
