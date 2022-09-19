import { PipelineStage } from 'mongoose';

export abstract class IGenericRepository<T> {
  abstract getAll(): Promise<T[]>;

  abstract getById(id: string);

  abstract create(item: T, options?: object);

  abstract updateById(id: string, item: T);

  abstract updateOne(filter: object, update: object, options?: object);

  abstract updateMany(filter: object, update: object, options?: object);

  abstract findOne(conditions: object, projection?: object, options?: object): Promise<T>;

  abstract findOneAndUpdate(
    conditions: object,
    update: object,
    options: object,
  );

  abstract findMany(conditions: object, options?: object): Promise<T[]>;

  abstract aggregate(pipeline: PipelineStage[], options?: object);
}
