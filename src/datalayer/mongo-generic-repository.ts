import { Model, PipelineStage } from 'mongoose';
import { IGenericRepository } from '../core/abstracts/generic-repository.abstract';

export class MongoGenericRepository<T> implements IGenericRepository<T> {
  private _repository: Model<T>;
  private _populateOnFind: string[];

  constructor(repository: Model<T>, populateOnFind: string[] = []) {
    this._repository = repository;
    this._populateOnFind = populateOnFind;
  }

  getAll(): Promise<T[]> {
    return this._repository.find().populate(this._populateOnFind).exec();
  }

  getById(id: any) {
    return this._repository.findById(id).populate(this._populateOnFind).exec();
  }

  create(item: T, options?: object) {
    return this._repository.create([item], options);
  }

  insertMany(items: T[], options?: object) {
    return this._repository.insertMany(items, options);
  }

  updateById(id: string, item: T) {
    return this._repository.findByIdAndUpdate(id, item);
  }

  updateOne(filter: object, update: object, options?: object) {
    return this._repository.updateOne(filter, update, options);
  }

  updateMany(filter: object, update: object, options?: object) {
    return this._repository.updateMany(filter, update, options);
  }

  findOne(
    conditions: object,
    projection?: object,
    options?: object,
  ): Promise<T> {
    return this._repository.findOne(conditions, projection, options).exec();
  }

  findOneAndUpdate(conditions: object, update: object, options?: object) {
    return this._repository.findOneAndUpdate(conditions, update, options);
  }

  findMany(conditions: object, options?: object): Promise<T[]> {
    return this._repository.find(conditions, options).exec();
  }

  aggregate(pipeline: PipelineStage[], options?: object) {
    return this._repository.aggregate(pipeline, options);
  }

  count(conditions: object) {
    return this._repository.count(conditions);
  }

  deleteMany(conditions: object, options?: object) {
    return this._repository.deleteMany(conditions, options);
  }
}
