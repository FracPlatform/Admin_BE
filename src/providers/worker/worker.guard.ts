import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WorkerUnauthorizedException } from '../../modules/auth/exception.decorator';

const jwt = require('jsonwebtoken');

@Injectable()
export class WorkerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;
    if (!headers.authorization) {
      throw new WorkerUnauthorizedException();
    }
    try {
      jwt.verify(headers.authorization.split(' ')[1], process.env.JWT_SECRET);
      return true;
    } catch (error) {
      throw new WorkerUnauthorizedException();
    }
  }
}
