import { Fractor, Asset, AssetType } from '../../datalayer/model';
import { IGenericRepository } from './generic-repository.abstract';

export abstract class IDataServices {
  abstract fractor: IGenericRepository<Fractor>;
  abstract asset: IGenericRepository<Asset>;
  abstract assetTypes: IGenericRepository<AssetType>;
}
