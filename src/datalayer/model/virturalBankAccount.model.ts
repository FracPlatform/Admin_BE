import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type VirturalBankAccountDocument = VirturalBankAccount & Document;

@Schema({
  timestamps: true,
  collection: 'VirturalBankAccount',
})
export class VirturalBankAccount {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  customerProfile: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: String })
  referenceId: string;

  @Prop({ type: String })
  bankShortCode: string;

  @Prop({ type: String })
  accountNo: string;

  @Prop({ type: String })
  bankPayeeName: string;
}

export const VirturalBankAccountSchema = SchemaFactory.createForClass(VirturalBankAccount);
