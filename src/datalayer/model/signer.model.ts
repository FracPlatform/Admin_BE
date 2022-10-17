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

  @Prop({ type: String })
  publicKey: string;

  @Prop({ type: Boolean })
  isActive: boolean;

  @Prop({ type: String })
  chain: string;
}

export const SignerSchema = SchemaFactory.createForClass(Signer);
