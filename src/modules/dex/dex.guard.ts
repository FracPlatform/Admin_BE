import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
@Injectable()
export class DexGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;
    if (!Object.keys(headers).includes('api-key')) {
      throw new UnauthorizedException();
    }
    try {
      if (headers['api-key'] !== process.env.IAO_API_KEY) {
        throw new UnauthorizedException();
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
