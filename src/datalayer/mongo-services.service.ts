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
  IAORequest,
  IAORequestDocument,
  CounterId,
  CounterIdDocument,
} from './model';
import { MongoGenericRepository } from './mongo-generic-repository';

@Injectable()
export class MongoServices implements IDataServices, OnApplicationBootstrap {
  fractor: IGenericRepository<Fractor>;
  assetTypes: IGenericRepository<AssetType>;
  asset: IGenericRepository<Asset>;
  admin: IGenericRepository<Admin>;
  iaoRequest: IGenericRepository<IAORequest>;
  counterId: IGenericRepository<CounterId>;

  constructor(
    @InjectModel(Fractor.name)
    private FractorUserRepository: Model<FractorDocument>,
    @InjectModel(AssetType.name)
    private AssetTypeRepository: Model<AssetTypeDocument>,
    @InjectModel(Asset.name)
    private AssetRepository: Model<AssetDocument>,
    @InjectModel(Admin.name)
    private AdminRepository: Model<AdminDocument>,
    @InjectModel(IAORequest.name)
    private IAORequestRepository: Model<IAORequestDocument>,
    @InjectModel(CounterId.name)
    private CounterIdRepository: Model<CounterIdDocument>,
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
    this.iaoRequest = new MongoGenericRepository<IAORequestDocument>(
      this.IAORequestRepository,
    );
    this.counterId = new MongoGenericRepository<CounterIdDocument>(
      this.CounterIdRepository,
    );
  }
}
