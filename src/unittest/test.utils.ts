import { getModelToken } from '@nestjs/mongoose';

import { CommonService } from 'src/common-service/common.service';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { Fractor } from '../datalayer/model';
import { AuthService } from '../modules/fractor/auth/auth.service';

export class TestUtils {
  public static INIT_MODULES = [];

  public static INIT_PROVIDERS = [CommonService, AuthService];

  public static getServices(module: TestingModule) {
    const commonService = module.get<CommonService>(CommonService);
    const jwtService = module.get<JwtService>(JwtService);
    const authService = module.get<AuthService>(AuthService);

    return { commonService, jwtService, authService };
  }

  public static getModels(module: TestingModule) {
    const fractorModel = module.get(getModelToken(Fractor.name)) as Model<any>;

    return { fractorModel};
  }

  public static async clearDB(module: TestingModule) {
    const models = this.getModels(module);
    const promises = [];
    for (const [key, model] of Object.entries(models)) {
      console.log(key)
      promises.push(model.deleteMany());
    }
    await Promise.all(promises);
  }
}
