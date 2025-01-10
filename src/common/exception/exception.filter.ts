import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // const status = exception.getStatus();

    const errorName = exception['name'];
    if (exception instanceof HttpException || exception instanceof Error) {
      this.logger.debug(`Error ${request.method} ${request.originalUrl}`);
      this.logger.debug(exception.message, exception.stack);
    }
    if (errorName === 'ValidationError') {
      response.status(400).json({
        statusCode: 400,
        message: exception['message'],
      });
    } else if (errorName === 'MongoServerError') {
      // duplicate unique exception
      if (exception['code'] === 11000) {
        const fields = Object.keys(exception['keyPattern']);
        const messages = [];
        const specField = ['walletAddress'];
        const mapSpecField = {
          walletAddress: 'Wallet Address',
        };
        fields.forEach((field) => {
          if (specField.includes(field)) {
            messages.push(
              `${mapSpecField[field]} has already existed. Please use another ${mapSpecField[field]}`,
            );
          } else {
            messages.push(`${field} already existed!`);
          }
        });
        response.status(400).json({
          code: 'E11',
          statusCode: 400,
          message: messages,
          fields: fields,
        });
      } else {
        response.status(400).json({
          code: '',
          statusCode: 400,
          message: exception['message'],
        });
      }
    } else if (errorName === 'AxiosError') {
      response.status(400).json({
        code: exception?.response?.data?.code || null,
        statusCode: 400,
        message: `AxiosError: ${exception['message']}. Detail error: ${exception?.response?.data?.message}`,
        data: exception?.response?.data,
      });
    } else if (errorName === 'Error') {
      const detailErr = exception['stack'];
      response.status(400).json({
        code: '',
        statusCode: 400,
        message: `${exception['message']}. Detail error: ${detailErr}`,
      });
    } else if (errorName === 'TypeError') {
      response.status(400).json({
        code: exception?.response?.data?.code || null,
        statusCode: 400,
        message: `TypeError: ${exception['message']}. Detail error: ${exception['stack']}`,
      });
    } else {
      if (process.env.LOG_MONITOR && !(exception instanceof HttpException)) {
        const realIp =
          request.headers['x-real-ip'] || request.headers['x-forwarded-for'];
        // prettier-ignore
        const requestData = `${request.user ? `[${request.user['address']}]` : ''}[${realIp ? realIp : request.ip}] ${request?.method} ${request?.originalUrl}`;
        this.webhook(requestData, exception);
      }
      super.catch(exception, host);
    }
  }

  webhook(requestData, exception) {
    const fetch = require('node-fetch');
    const webhookURL = process.env.LOG_MONITOR;

    const data = JSON.stringify({
      text: requestData + '\n' + exception.message + '\n' + exception.stack,
    });
    fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: data,
    }).catch((error) => {
      this.logger.error(error);
    });
  }
}
