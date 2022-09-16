import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type DocumentItemDocument = DocumentItem & Document;

export const MAX_FILE_SIZE = 10485760; //10 MB

@Schema({
  timestamps: true,
  collection: 'DocumentItem',
})
export class DocumentItem {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String })
  fileUrl: string;

  @Prop({ type: Number })
  size: number; //MB

  @Prop({ type: String })
  uploadBy: string;

  @Prop({ type: Boolean, default: false })
  display: boolean;
}

export const DocumentItemSchema = SchemaFactory.createForClass(DocumentItem);
