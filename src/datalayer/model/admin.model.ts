import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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

  @Prop({ type: String, default: null })
  walletAddress: string;

  @Prop({ type: Number })
  role: Role;

  @Prop({ type: Number, default: ADMIN_STATUS.ACTIVE })
  status: number;

  @Prop({ type: String })
  referral: string;

  @Prop({ type: String })
  createBy: string;

  @Prop({ type: String })
  lastUpdateBy: string;

  @Prop({ type: String, default: PREFIX_ID.ADMIN })
  adminId?: string;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.plugin(paginate);
AdminSchema.plugin(aggregatePaginate);
AdminSchema.index({ adminId: 1 });
AdminSchema.index(
  { email: 1, deleted: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deleted: { $eq: false },
      status: { $eq: 1 },
    },
  },
);
AdminSchema.index(
  { walletAddress: 1, deleted: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deleted: { $eq: false },
      status: { $eq: 1 },
    },
  },
);
