import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type GasWalletDocument = GasWalletModel & Document;

export enum WALLET_TYPE {
  IAO = 1,
  DEX = 2,
}

@Schema({
  timestamps: true,
  collection: 'GasWallet',
  versionKey: false,
})
export class GasWalletModel {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: String })
  hashKey: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: Number })
  chain: number;

  @Prop({ type: Number })
  walletType: WALLET_TYPE;
}

export const GasWalletSchema = SchemaFactory.createForClass(GasWalletModel);
