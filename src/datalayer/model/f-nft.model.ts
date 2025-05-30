import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PREFIX_ID } from 'src/common/constants';

export type FnftDocument = Fnft & Document;

export const FNFT_DECIMAL = 18;

export enum F_NFT_STATUS {
  INACTIVE = 0,
  ACTIVE = 1,
}

export enum F_NFT_MINTED_STATUS {
  PROCESS = 0,
  MINTED = 1,
}

export enum F_NFT_TYPE {
  AUTO_IMPORT = 1,
  SELECT_MANUALY = 2,
}
@Schema({
  timestamps: true,
  collection: 'Fnft',
})
export class Fnft {
  @Prop({ type: String })
  tokenSymbol: string;

  @Prop({ type: String })
  tokenName: string;

  @Prop({ type: Number })
  totalSupply: number;

  @Prop({ type: String })
  tokenLogo: string;

  @Prop({ type: Number })
  chainId: number;

  @Prop({ type: String })
  contractAddress: string;

  @Prop([{ type: Array }])
  items: string[];

  @Prop({ type: String })
  iaoRequestId: string;

  @Prop({ type: Number })
  fnftType: number;

  @Prop({ type: String })
  txhash: string;

  @Prop({ type: Number, default: F_NFT_STATUS.ACTIVE })
  status: number;

  @Prop({ type: Number, default: F_NFT_MINTED_STATUS.PROCESS })
  mintedStatus: number;

  @Prop({ type: String })
  fractionalizedBy: string;

  @Prop({ type: Date })
  fractionalizedOn: Date;

  @Prop({ type: String })
  lastUpdateBy: string;

  @Prop({ type: String, default: PREFIX_ID.F_NFT })
  fnftId?: string;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Number })
  availableSupply: number;
}

export const FnftSchema = SchemaFactory.createForClass(Fnft);
FnftSchema.index({ fnftId: 1 });
FnftSchema.index(
  { contractAddress: 1 },
  {
    unique: true,
    partialFilterExpression: {
      contractAddress: { $type: 'string' },
    },
  },
);
FnftSchema.index(
  { iaoRequestId: 1, mintedStatus: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      mintedStatus: { $eq: 1 },
      status: { $eq: 1 },
      iaoRequestId: { $type: 'string' },
    },
  },
);
