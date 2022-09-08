import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
import * as mongoose from 'mongoose';
import { AssetType } from './asset_type.model';
import { CollectionItem } from './collection-item.model';
import { Fractor } from './fractor.model';

export type AssetDocument = Asset & Document;

export enum OWNERSHIP_PRIVACY {
    PUBLIC = 1,
    PRIVATE = 2,
}

export enum ASSET_STATUS {
    OPEN = 1,
    IN_REVIEW = 2,
    IAO = 3,
    EXCHANGE = 4,
    SOLD_OUT = 5,
}

export enum NETWORK {
    ETH = 'eth',
    BSC = 'bsc',
    OTHER = 'other'
}


export enum MEDIA_TYPE {
    VIDEO = 1,
    AUDIO = 2,
    PHOTO = 3,
}

export const MAX_PHOTOS = 5;
export const MIN_PHOTOS = 1;

export enum CATEGORY_TYPE {
    PHYSICAL = 'physical',
    VIRTUAL = 'virtual',
}

export const ITEM_PREFIX = 'ITEM';

export class Media {
    url: string;
    type: number;
}

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
    specifications: [];

    @Prop({ type: Number, default: ASSET_STATUS.OPEN })
    status?: number;

    @Prop({ type: Array })
    media: Media[];

    @Prop({ type: String })
    previewUrl: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: AssetType.name })
    typeId: string;

    @Prop({ unique: true })
    itemId?: number;

    @Prop({ type: String, default: ITEM_PREFIX })
    itemPrefix?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Fractor.name })
    ownerId: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: CollectionItem.name })
    collectionId: string;

    @Prop({ type: Boolean, default: false })
    deleted: boolean;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
AssetSchema.plugin(paginate);
AssetSchema.plugin(aggregatePaginate);

