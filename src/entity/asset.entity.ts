import { Media, CUSTODIANSHIP_STATUS } from '../datalayer/model/asset.model';
import { Specifications } from 'src/datalayer/model';
import { DocumentItem } from 'src/datalayer/model/document-item.model';
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
  custodianshipStatus: CUSTODIANSHIP_STATUS;
}

export class DocumentItemEntity {
  name: string;
  description: string;
  fileUrl: string;
  size: number;
  uploadBy: string;
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
  custodianshipStatus: CUSTODIANSHIP_STATUS;
  deleted: boolean;
  lastUpdatedBy?: object;
  createdAt: Date;
  updatedAt: Date;
}
