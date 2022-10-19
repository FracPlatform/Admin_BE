import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import 'dotenv/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'dex') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_DEX_SECRET,
      ignoreExpiration: true,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
