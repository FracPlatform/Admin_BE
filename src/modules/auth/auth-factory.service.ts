import { Injectable } from '@nestjs/common';
import { Admin } from 'src/datalayer/model';
import { ProfileAdmin } from 'src/entity';

@Injectable()
export class AuthBuilderService {

  createProfile(user: Admin): ProfileAdmin {
    const profile: ProfileAdmin = {
      email: user.email,
      fullname: user.fullname,
      description: user.description,
      avatar: user.avatar,
      referral: user.referral,
    };
    return profile;
  }
}
