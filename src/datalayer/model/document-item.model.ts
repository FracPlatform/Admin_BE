import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type DocumentItemDocument = DocumentItem & Document;

export const MAX_FILE_SIZE = 10485760; //10 MB

export enum DOCUMENT_STATUS {
  NONE = 0,
  NEWLY_UPLOADED = 1,
  UPDATE_DISPLAY = 2,
  UPDATE_DESCRIPTION = 3,
  UPDATE_HIDDEN = 4,
  UPDATE_DELETE = 5,
}

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

  @Prop({ type: String })
  ipfsCid: string;

  @Prop({ type: Number, default: DOCUMENT_STATUS.NONE })
  status: DOCUMENT_STATUS;
}

export const DocumentItemSchema = SchemaFactory.createForClass(DocumentItem);
