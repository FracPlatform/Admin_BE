import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IDataServices } from '../core/abstracts/data-services.abstract';
import { IGenericRepository } from '../core/abstracts/generic-repository.abstract';
import { Model } from 'mongoose';
import {
  Asset,
  AssetDocument,
  Fractor,
  FractorDocument,
  AssetType,
  AssetTypeDocument,
  Admin,
  AdminDocument,
} from './model';
import { MongoGenericRepository } from './mongo-generic-repository';

@Injectable()
export class MongoServices implements IDataServices, OnApplicationBootstrap {
  fractor: IGenericRepository<Fractor>;
  assetTypes: IGenericRepository<AssetType>;
  asset: IGenericRepository<Asset>;
  admin: IGenericRepository<Admin>;

  constructor(
    @InjectModel(Fractor.name)
    private FractorUserRepository: Model<FractorDocument>,
    @InjectModel(AssetType.name)
    private AssetTypeRepository: Model<AssetTypeDocument>,
    @InjectModel(Asset.name)
    private AssetRepository: Model<AssetDocument>,
    @InjectModel(Admin.name)
    private AdminRepository: Model<AdminDocument>,
  ) {}

  onApplicationBootstrap() {
    this.fractor = new MongoGenericRepository<FractorDocument>(
      this.FractorUserRepository,
    );
    this.assetTypes = new MongoGenericRepository<AssetTypeDocument>(
      this.AssetTypeRepository,
    );
    this.asset = new MongoGenericRepository<AssetDocument>(
      this.AssetRepository,
    );
    this.admin = new MongoGenericRepository<AdminDocument>(
      this.AdminRepository,
    );
  }
}
