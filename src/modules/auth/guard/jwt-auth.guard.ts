import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ADMIN_STATUS } from '../../../datalayer/model';
import { DeactiveAccountException } from '../exception.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    if (user.status === ADMIN_STATUS.INACTIVE) {
      throw new DeactiveAccountException();
    }
    return user;
  }
}

export class JwtAuthGuardNonToken extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;
    if (!headers.authorization) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    if (user.status === ADMIN_STATUS.INACTIVE) {
      throw new DeactiveAccountException();
    }
    return user;
  }
}
