import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PREFIX_ID } from 'src/common/constants';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type FnftDocument = Fnft & Document;

export enum F_NFT_STATUS {
	INACTIVE = 0,
	ACTIVE = 1,
}

@Schema({
	timestamps: true,
	collection: 'Fnft',
})
export class Fnft {
	@Prop({ type: String })
	tokenSymbol: string;

	@Prop({ type: String, default: null })
	tokenName: string;

	@Prop({ type: Number })
  totalSupply: number;

	@Prop({ type: String })
	tokenLogo: string;

	@Prop({ type: Number })
  chainId: number;

	@Prop({ type: String, default: null })
	contractAddress: string;

	@Prop([{ type: String }])
  items: string[];

  @Prop({ type: String, default: null })
	iaoRequestId: string;

  @Prop({ type: String, default: null })
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
FnftSchema.plugin(paginate);
FnftSchema.plugin(aggregatePaginate);
FnftSchema.index({ fnftId: 1 });
