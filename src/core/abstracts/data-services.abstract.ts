import { IAOEvent } from 'src/datalayer/model/iao-event.model';
import {
  Fractor,
  Asset,
  AssetType,
  Admin,
  IAORequest,
  CounterId,
  Fnft,
  Nft,
  Whitelist,
  Settings,
  Signer,
  User,
  Purchase,
} from '../../datalayer/model';
import { IGenericRepository } from './generic-repository.abstract';

export abstract class IDataServices {
  abstract fractor: IGenericRepository<Fractor>;
  abstract asset: IGenericRepository<Asset>;
  abstract assetTypes: IGenericRepository<AssetType>;
  abstract admin: IGenericRepository<Admin>;
  abstract iaoRequest: IGenericRepository<IAORequest>;
  abstract counterId: IGenericRepository<CounterId>;
  abstract fnft: IGenericRepository<Fnft>;
  abstract nft: IGenericRepository<Nft>;
  abstract iaoEvent: IGenericRepository<IAOEvent>;
  abstract whitelist: IGenericRepository<Whitelist>;
  abstract settings: IGenericRepository<Settings>;
  abstract signer: IGenericRepository<Signer>;
  abstract user: IGenericRepository<User>;
  abstract purchase: IGenericRepository<Purchase>;
}
