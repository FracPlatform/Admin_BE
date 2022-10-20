import { Media } from '../datalayer/model/asset.model';
import { Custodianship, Specifications } from 'src/datalayer/model';
import { DocumentItem } from 'src/datalayer/model/document-item.model';
import { TokenStandard } from 'src/common/common-type';
import { REVIEW_STATUS } from 'src/datalayer/model';
export class AssetEntity {
  name: string;
  media: Media[];
  category: string;
  isMintNFT: boolean;
  network: string;
  ownershipPrivacy: number;
  description: string;
  previewUrl: string;
  ownerId: string;
  collectionId: string;
  typeId: string;
  specifications: Specifications[];
  documents: DocumentItem[];
  deleted: boolean;
  itemId?: string;
  custodianship: Custodianship;
}

export class DocumentItemEntity {
  name: string;
  description: string;
  fileUrl: string;
  size: number;
  uploadBy: string;
  display?: boolean;
  _id?: string;
  updatedAt?: string;
  createdAt?: string;
  uploaderAdmin?: object;
}

export class AssetForOwnerEntity {
  _id: string;
  name: string;
  media: Media[];
  category: string;
  isMintNFT: boolean;
  network: string;
  ownershipPrivacy: number;
  description: string;
  previewUrl: string;
  ownerId: string;
  typeId: string;
  collectionId: string;
  specifications: [];
  status: number;
  owner: object;
  itemId: string;
  assetTypeName: string;
  documents: DocumentItem[];
  deleted: boolean;
  iaoRequest?: object;
  lastUpdatedBy?: object;
  createdAt: Date;
  updatedAt: Date;
  custodianship: Custodianship;
}

export class DepositedNFT {
  contractAddress: string;
  tokenId: string;
  balance: number;
  metadata: object;
  depositedOn: Date;
  status: REVIEW_STATUS;
  tokenStandard: TokenStandard;
  withdrawable: number;
  txHash: string;
}

export class ShipmentInfoEntity {
  shipment_status: string;
  shipment_time: Date;
}
