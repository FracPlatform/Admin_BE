import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Language } from './notification-queue.model';

export type NotificationDocument = Notification & Document;

export enum NOTIFICATION_TYPE {
  ANNOUNCEMENT = 1,
  SYSTEM_MESSAGES = 2,
}

export enum NOTIFICATION_SUBTYPE {
  PairCreated = 'PairCreated',
  PairDeleted = 'PairDeleted',
  UpdateTradingLevel = 'UpdateTradingLevel',
  UserTierChanged = 'UserTierChanged',
  WHITELISTS = 'Whitelists',
  IAO_PARTICIPATION_START = 'IaoParticipationStart',
  IAO_VAULT_SUCCEEDED = 'IaoVaultSuccess',
  IAO_VAULT_FAILED = 'IaoVaultFailed',
  IAO_NON_VAULT_SUCCEEDED = 'IaoNonVaultSuccess',
  REJECT_IAO_REVENUE = 'RejectIaoRevenue',
  REDEMPTION_REQUEST_APPROVAL = 'RedemptionRequestApproval',
  REDEMPTION_REQUEST_REJECT = 'RedemptionRequestReject',
  NEW_AFFILIATE_OFFER = 'NewAffiliateOffer',
  ACCEPT_AFFILIATE_OFFER = 'AcceptAffiliateOffer',
  SECOND_APPROVED_IAO_REQUEST = 'SecondApprovedIAORequest',
  CREATE_IAO_EVENT_PUBLIC = 'CreateIAOEventPublic',
  REJECT_IAO_REQUEST = 'RejectIAORequest',
  APPROVE_IAO_REVENUE = 'ApproveIAORevenue',
  WITHDRAWAL_REQUEST_SUCCEEDED = 'WithdrawRequestSucceeded',
  FNFT_MERGED = 'FnftMerged',
  ANNOUNCEMENT = 'Announcement',
  CANCEL_WITHDRAWAL = 'CancelWithdrawal',
}

export const DEX_NOTIFICATION_TYPES = [
  NOTIFICATION_SUBTYPE.PairCreated,
  NOTIFICATION_SUBTYPE.PairDeleted,
  NOTIFICATION_SUBTYPE.UpdateTradingLevel,
  NOTIFICATION_SUBTYPE.UserTierChanged,
];

export class NotificationExtraData {
  iaoEventId?: string;
  iaoEventName?: any;
  affiliateOffers?: object;
  redempId?: string;
  iaoRequestId?: string;
  withdrawRequestId?: any;
  recipientAddress?: any;
  withdrawalId?: any;
}
@Schema({ collection: 'Notification', timestamps: true })
export class Notification {
  @Prop({ type: Number })
  type: NOTIFICATION_TYPE;

  @Prop({ type: String })
  receiver: string;

  @Prop({ type: Object })
  title?: Language;

  @Prop({ type: Object })
  content?: Language;

  @Prop({ type: String, required: false })
  notiQueueId?: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: String, required: false })
  subtype: string;

  @Prop({ type: () => NotificationExtraData, required: false })
  extraData?: NotificationExtraData;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Boolean, default: false })
  hided: boolean;

  @Prop({ type: String, required: false })
  dexId: string;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ receiver: 1 });
