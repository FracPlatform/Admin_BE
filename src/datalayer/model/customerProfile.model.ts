import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CustomerProfileDocument = CustomerProfile & Document;

export enum VERIFICATION_STATUS {
  VERIFIED = 'verified',
  PENDING = 'pending'
}

export enum REGISTRATION_TYPE {
  PERSONAL = 'personal',
  BUSSIESS = 'business'
}

@Schema({
  timestamps: true,
  collection: 'CustomerProfile',
})
export class CustomerProfile {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  userID: string;

  @Prop({ type: String })
  customerName: string;

  @Prop({ type: String })
  registrationId: string;

  @Prop({ type: String, default: REGISTRATION_TYPE.PERSONAL })
  registrationType: REGISTRATION_TYPE;

  @Prop({ type: String })
  verificationStatus: VERIFICATION_STATUS;

  @Prop({ type: String })
  type: string;

  @Prop({ type: String })
  nationality: string;

  @Prop({ type: String })
  dateOfBirth: string;

  @Prop({ type: String })
  referenceId: string;

  @Prop({ type: String })
  countryOfResidence: string;

  @Prop({ type: String })
  gender?: string;

  @Prop({ type: String })
  phoneNo?: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  createdAt?: string;
}

export const CustomerProfileSchema = SchemaFactory.createForClass(CustomerProfile);
