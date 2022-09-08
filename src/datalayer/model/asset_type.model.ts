import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type AssetTypeDocument = AssetType & Document;

export enum CategoryType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
}

export class LanguageVariants {
  en: string;
  ja: string;
  cn: string;
}

export class SpecificationField {
  order: number;
  label: LanguageVariants;
  description: LanguageVariants;
  required: boolean;
  placeholder: LanguageVariants;
}

@Schema({ collection: 'AssetType', timestamps: true })
export class AssetType {
  @Prop({ type: String, default: 'ATYPE', required: false })
  prefix?: string;

  @Prop({ required: true, type: String })
  category: CategoryType;

  @Prop({ type: String })
  borderColor: string;

  @Prop({ type: LanguageVariants })
  name: LanguageVariants;

  @Prop({ type: LanguageVariants })
  description: LanguageVariants;

  @Prop({ type: String })
  logoImage: string;

  @Prop({ type: Boolean })
  isActive: boolean;

  @Prop({ type: Array })
  specifications: SpecificationField[];
}

export const AssetTypeSchema = SchemaFactory.createForClass(AssetType);
AssetTypeSchema.plugin(paginate);
AssetTypeSchema.plugin(aggregatePaginate);
