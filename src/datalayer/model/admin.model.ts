import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { PREFIX_ID } from 'src/common/constants';
import { Role } from '../../modules/auth/role.enum';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type AdminDocument = Admin & Document;

export enum ADMIN_STATUS {
  ACTIVE = 1,
  INACTIVE = 2,
}

@Schema({
  timestamps: true,
  collection: 'Admin',
})
export class Admin {
  @Prop({ type: String })
  email: string;

  @Prop({ type: String, default: '' })
  fullname: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: '' })
  avatar: string;

  @Prop({ type: Number, default: null })
  networkType: number;

  @Prop({ type: String, default: null })
  walletAddress: string;

  @Prop({ type: String })
  role: Role;

  @Prop({ type: Number, default: ADMIN_STATUS.ACTIVE })
  status: number;

  @Prop({ type: String })
  referral: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  createBy: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  lastUpdateBy: string;

  @Prop({ type: String, default: PREFIX_ID.ADMIN })
  adminId?: string;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.plugin(paginate);
AdminSchema.plugin(aggregatePaginate);
