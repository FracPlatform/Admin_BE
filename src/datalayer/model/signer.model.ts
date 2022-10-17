import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SignerDocument = Signer & Document;

@Schema({
  timestamps: true,
  collection: 'Signer',
  versionKey: false,
})
export class Signer {
  @Prop({ type: String })
  signer: string;

  @Prop({ type: String })
  hashKey: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: Number })
  chain: number;
}

export const SignerSchema = SchemaFactory.createForClass(Signer);
