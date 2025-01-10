import { getModelToken } from '@nestjs/mongoose';

import { TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { Fractor } from '../datalayer/model';

export class TestUtils {
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
