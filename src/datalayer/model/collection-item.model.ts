import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type CollectionItemDocument = CollectionItem & Document;
@Schema({
  timestamps: true,
  collection: 'CollectionItem',
})
export class CollectionItem {
  @Prop({ type: String })
  name: string;

  @Prop({ type: Boolean })
  isDefault: boolean;
}

export const CollectionItemSchema =
  SchemaFactory.createForClass(CollectionItem);
