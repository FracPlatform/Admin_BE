import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type IAOEventDocument = IAOEvent & Document;

@Schema({
  timestamps: true,
  collection: 'IAOEvent',
})
export class IAOEvent {
  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: Boolean })
  isDisplay: boolean;

  @Prop({ type: Number })
  chainId: number;

  @Prop({ type: String })
  contractAddress: string;

  @Prop({ type: String })
  iaoRequestId: string;

  @Prop({ type: Date })
  registrationStartTime: Date;

  @Prop({ type: Date })
  registrationEndTime: Date;

  @Prop({ type: Number })
  iaoEventDuration: number;

  @Prop({ type: Date })
  participationStartTime: Date;

  @Prop({ type: Date })
  participationEndTime: Date;

  @Prop({ type: String })
  vaultType: string;

  @Prop({ type: String })
  acceptedCurrencyAddress: string;

  @Prop({ type: Number })
  exchangeRate: number;

  @Prop({ type: Number })
  percentageOffered: number;

  @Prop({ type: Number })
  vaultUnlockThreshold: number;

  @Prop({ type: String })
  eventPhotoUrl: string;

  @Prop({ type: String })
  eventBannerUrl: string;

  @Prop({ type: Number })
  localization: number;

  @Prop({ type: String })
  iaoEventName: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  allocationType: number;

  @Prop({ type: Number })
  hardCapPerUser: number;

  @Prop({ type: String })
  whitelistRegistrationUrl: string;

  @Prop({ type: Date })
  whitelistAnnouncementTime: Date;

  @Prop({ type: Array })
  whitelist: string[];

  @Prop({ type: Number })
  onChainStatus: number;

  @Prop({ type: Number })
  status: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: Date })
  createdOnChainAt: Date;

  @Prop({ type: String })
  createdOnChainBy: string;

  @Prop({ type: Date })
  lastWhitelistUpdatedAt: Date;

  @Prop({ type: String })
  lastWhitelistUpdatedBy: string;
}

export const IaoEventSchema = SchemaFactory.createForClass(IAOEvent);
IaoEventSchema.index({ iaoEventId: 1 });
