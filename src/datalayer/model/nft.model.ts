import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
  BOOST_NUMBER = 'boost_number',
  BOOST_PERCENTAGE = 'boost_percentage',
}

@Schema({
  timestamps: true,
  collection: 'Trait',
})
export class Trait {
  @Prop({ type: String })
  trait_type: string;

  @Prop({ type: String })
  value: string;

  @Prop({ type: String })
  display_type?: DISPLAY_TYPE;

  @Prop({ type: Number })
  max_value?: number;
}

export const TraitSchema = SchemaFactory.createForClass(Trait);

export class NftMetadata {
  @Prop({ type: [TraitSchema] })
  properties: Trait[];

  @Prop({ type: [TraitSchema] })
  levels: Trait[];

  @Prop({ type: [TraitSchema] })
  stats: Trait[];

  @Prop({ type: [TraitSchema] })
  date: Trait[];
}

@Schema({
  timestamps: true,
  collection: 'Nft',
})
export class Nft {
  @Prop({ type: Number })
  nftType: NFT_TYPE;

  @Prop({ type: String })
  assetId: string;

  @Prop({ type: String, required: false })
  assetCategory?: string;

  @Prop({ type: String, required: false })
  assetType?: string;

  @Prop({ type: String })
  tokenId: string;

  @Prop({ type: String })
  contractAddress: string;

  @Prop({ type: String })
  fNftId: string;

  @Prop({ type: Number, default: NFT_STATUS.DRAFT })
  status: NFT_STATUS;

  @Prop({ type: Boolean })
  display: boolean;

  @Prop({ type: Number })
  chainId: number;

  @Prop({ type: String })
  mediaUrl: string;

  @Prop({ type: String })
  previewUrl: string;

  @Prop({ type: NftMetadata })
  metadata: NftMetadata;

  @Prop({ type: String })
  unlockableContent?: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  mintedBy: string;

  @Prop({ type: Date })
  mintedAt: string;

  @Prop({ type: String })
  mintingHashTx: string;
}
export const NftSchema = SchemaFactory.createForClass(Nft);
NftSchema.index({ tokenId: 1 });
