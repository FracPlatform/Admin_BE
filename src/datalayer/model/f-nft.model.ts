import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PREFIX_ID } from 'src/common/constants';

export type FnftDocument = Fnft & Document;

export enum F_NFT_STATUS {
	INACTIVE = 0,
	ACTIVE = 1,
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

	@Prop([{ type: String }])
  items: string[];

  @Prop({ type: String })
	iaoRequestId: string;

  @Prop({ type: Number })
  fnftType: F_NFT_TYPE;

  @Prop({ type: String })
	txhash: string;

	@Prop({ type: Number, default: F_NFT_STATUS.ACTIVE })
	status: number;

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
}

export const FnftSchema = SchemaFactory.createForClass(Fnft);
FnftSchema.index({ fnftId: 1, contractAddress: 1 });
FnftSchema.index({ tokenSymbol: 1, tokenName: 1 }, { unique: true });
