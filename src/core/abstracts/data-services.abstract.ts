import { Fractor, Asset, AssetType, IAORequest, CounterId } from '../../datalayer/model';
import { IGenericRepository } from './generic-repository.abstract';

export abstract class IDataServices {
  abstract fractor: IGenericRepository<Fractor>;
  abstract asset: IGenericRepository<Asset>;
  abstract assetTypes: IGenericRepository<AssetType>;
  abstract iaoRequest: IGenericRepository<IAORequest>;
  abstract counterId: IGenericRepository<CounterId>;
}
