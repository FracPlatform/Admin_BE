import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
import * as mongoose from 'mongoose';
import { AssetType } from './asset_type.model';
import { CollectionItem } from './collection-item.model';
import { SpecificationField } from './asset_type.model';
import { DocumentItem, DocumentItemSchema } from './document-item.model';
import { PREFIX_ID } from 'src/common/constants';
import { TokenStandard } from 'src/common/common-type';

export type AssetDocument = Asset & Document;

export enum OWNERSHIP_PRIVACY {
  PUBLIC = 1,
  PRIVATE = 2,
}

export enum ASSET_STATUS {
  OPEN = 1,
  IN_REVIEW = 2,
  IAO_APPROVED = 3,
  CONVERTED_TO_NFT = 4,
  FRACTIONALIZED = 5,
  IAO_EVENT = 6,
  EXCHANGE = 7,
  REDEEMED = 8,
}

export enum CUSTODIANSHIP_STATUS {
  FRACTOR = 0,
  FRACTOR_TO_FRAC_OR_IN_REVIEW = 1,
  FRAC = 2,
  AVAILABLE_FOR_FRACTOR_TO_REDEEM = 3,
  FRACTOR_REDEEMS = 4,
  FRAC_TO_FRACTOR = 5,
  AVAILABLE_FOR_USER_TO_REDEEM = 6,
  USER_REDEEMS = 7,
  FRAC_TO_USER = 8,
  USER = 9,
}

export enum REVIEW_STATUS {
  REJECTED = 0,
  IN_REVIEW = 1,
  APPROVED = 2,
}

export enum NETWORK {
  ETH = 'eth',
  BSC = 'bsc',
  OTHER = 'other',
}

export enum MEDIA_TYPE {
  VIDEO = 1,
  AUDIO = 2,
  PHOTO = 3,
}

export const MAX_PHOTOS = 5;
export const MIN_PHOTOS = 1;

export const ITEM_PREFIX = 'ITEM';

export class Media {
  url: string;
  type: number;
}

export class Specifications extends SpecificationField {
  value: string;
}

export class Label {
  en: DataLabel;
  cn: DataLabel;
  ja: DataLabel;
}

export class DataLabel {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
}

@Schema({
  timestamps: false,
  collection: 'ShipmentInfo',
})
export class ShipmentInfo {
  @Prop({ type: String })
  shipmentStatus: string;

  @Prop({ type: Date, default: null })
  shipmentTime: any;
}

export const ShipmentInfoSchema = SchemaFactory.createForClass(ShipmentInfo);

@Schema({ collection: 'DigitalAssetFile', timestamps: true })
export class DigitalAssetFile {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String })
  fileUrl: string;

  @Prop({ type: Number })
  size: number; //MB

  @Prop({ type: Number })
  status: REVIEW_STATUS;
}
export const DigitalAssetFileSchema =
  SchemaFactory.createForClass(DigitalAssetFile);
@Schema({ collection: 'CustodianshipInfo', _id: false })
export class CustodianshipInfo {
  @Prop({ type: Number })
  status: CUSTODIANSHIP_STATUS;

  @Prop({ type: Label })
  label: Label;

  @Prop({ type: [DigitalAssetFileSchema] })
  files: DigitalAssetFile[];

  @Prop({ type: Number })
  storedByFrac?: number;

  @Prop({ type: String })
  warehousePublic?: string;

  @Prop({ type: String })
  warehousePrivate?: string;

  @Prop({ type: [ShipmentInfoSchema] })
  listShipmentInfo: ShipmentInfo[];
}
export const CustodianshipInfoSchema =
  SchemaFactory.createForClass(CustodianshipInfo);
@Schema({
  collection: 'DepositedNFT',
  timestamps: true,
})
export class DepositedNFT {
  @Prop({ type: String })
  contractAddress: string;

  @Prop({ type: String })
  tokenId: string;

  @Prop({ type: Number })
  balance: number;

  @Prop({ type: Object })
  metadata: object;

  @Prop({ type: Date })
  depositedOn: Date;

  @Prop({ type: Number })
  status: REVIEW_STATUS;

  @Prop({ type: String })
  tokenStandard: TokenStandard;

  @Prop({ type: Number })
  withdrawable: number;

  @Prop({ type: String })
  txHash: string;
}

export const DepositedNFTSchema = SchemaFactory.createForClass(DepositedNFT);
@Schema({
  timestamps: true,
  collection: 'Asset',
})
export class Asset {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ type: Boolean, default: false })
  isMintNFT: boolean;

  @Prop({ type: String })
  network: string;

  @Prop({ type: Number, default: OWNERSHIP_PRIVACY.PUBLIC })
  ownershipPrivacy: number;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Array, default: [] })
  specifications: Specifications[];

  @Prop({ type: Number, default: ASSET_STATUS.OPEN })
  status?: number;

  @Prop({ type: Array })
  media: Media[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: AssetType.name })
  typeId: string;

  @Prop({ type: String, default: PREFIX_ID.ASSET })
  itemId?: string;

  @Prop({ type: String })
  ownerId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: CollectionItem.name })
  collectionId: string;

  @Prop({ type: [DocumentItemSchema], default: [] })
  documents: DocumentItem[];

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Boolean, default: false })
  inDraft?: boolean;

  @Prop({ type: String })
  lastUpdatedBy: string;

  @Prop({ type: [DepositedNFTSchema], default: [] })
  depositedNFTs: DepositedNFT[];

  @Prop({ type: CustodianshipInfoSchema })
  custodianship?: CustodianshipInfo;

  @Prop({ type: String })
  updatedFrom?: string;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
AssetSchema.plugin(paginate);
AssetSchema.plugin(aggregatePaginate);
AssetSchema.index({ itemId: 1 });
