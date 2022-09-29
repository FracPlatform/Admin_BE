import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { CHAIN_ID } from 'src/common/constants';
import { CategoryType } from '.';

export type NftDocument = Nft & Document;

export enum NFT_TYPE {
  FRACTOR_ASSET = 1,
  FRAC_ASSET = 2,
}

export enum NFT_STATUS {
  DRAFT = 1,
  MINTED = 2,
  FRACTIONLIZED = 3,
  CLOSED = 4,
}

export enum DISPLAY_TYPE {
  NUMBER = 'number',
}

@Schema({
  timestamps: true,
  collection: 'Trait',
})
export class Trait {
  @Prop({ type: String })
  trait_type: string;

  @Prop({ type: SchemaTypes.Mixed })
  value: string | number;

  @Prop({ type: String })
  display_type?: DISPLAY_TYPE;
}

export const TraitSchema = SchemaFactory.createForClass(Trait);

@Schema({
  timestamps: true,
  collection: 'Nft',
})
export class Nft {
  @Prop({ type: Number })
  nftType: NFT_TYPE;

  @Prop({ type: String, required: false })
  assetId?: string;

  @Prop({ type: String, required: false })
  assetCategory?: CategoryType;

  @Prop({ type: String, required: false })
  assetType?: string;

  @Prop({ type: String })
  tokenId: string;

  @Prop({ type: String })
  contractAddress: string;

  @Prop({ type: String, required: false })
  fNftId?: string;

  @Prop({ type: Number, default: NFT_STATUS.DRAFT })
  status: NFT_STATUS;

  @Prop({ type: Boolean })
  display: boolean;

  @Prop({ type: Number })
  chainId: CHAIN_ID;

  @Prop({ type: String })
  mediaUrl: string;

  @Prop({ type: String })
  previewUrl: string;

  @Prop({ type: [TraitSchema] })
  metadata: Trait[];

  @Prop({ type: String })
  unlockableContent?: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  metadataUrl: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String, required: false })
  mintedBy?: string;

  @Prop({ type: Date, required: false })
  mintedAt?: string;

  @Prop({ type: String, required: false })
  mintingHashTx?: string;
}
export const NftSchema = SchemaFactory.createForClass(Nft);
NftSchema.index({ tokenId: 1 });
