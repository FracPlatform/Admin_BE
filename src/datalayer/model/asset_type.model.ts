import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type AssetTypeDocument = AssetType & Document;
export type SpecificationFieldDocument = SpecificationField & Document;

export enum CategoryType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
}

export class LanguageVariants {
  en: string;
  ja: string;
  cn: string;
}

@Schema({
  timestamps: true,
  collection: 'SpecificationField',
})
export class SpecificationField {
  @Prop({ type: LanguageVariants })
  label: LanguageVariants;

  @Prop({ type: LanguageVariants })
  description: LanguageVariants;

  @Prop({ type: Boolean })
  required: boolean;

  @Prop({ type: LanguageVariants })
  placeholder: LanguageVariants;
}

export const SpecificationFieldSchema =
  SchemaFactory.createForClass(SpecificationField);

@Schema({ collection: 'AssetType', timestamps: true })
export class AssetType {
  @Prop({ type: String })
  assetTypeId: string;

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

  @Prop({ type: [SpecificationFieldSchema] })
  specifications: SpecificationField[];
}

export const AssetTypeSchema = SchemaFactory.createForClass(AssetType);
AssetTypeSchema.plugin(paginate);
AssetTypeSchema.plugin(aggregatePaginate);
AssetTypeSchema.index({ assetTypeId: 1 });
