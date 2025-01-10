import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FiatHistoryTransactionDocument = FiatHistoryTransaction & Document;

export enum FIAT_TRANSACTION_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

export enum ERROR_CODE_TRAXX {
  TRANSACTION_PROCESSED = '0',
  TRANSACTION_PROHIBITED = 'TR01',
  INVALID_MISSING_PARAMETER = 'TR1001',
  MERCHANT_CURRENCY_MISMATCH = 'TR1003',
  INVALID_TRANSACTION_ID = 'TR1020',
  CARD_EXPIRY_FORMAT = 'TR104',
  INVALID_CARD_NUMBER = 'TR105',
  CURRENCY_CODE_FORMAT = 'TR108',
  UNAUTHORIZED_MERCHANT_ACCESS = 'TR109',
  INVALID_MERCHANT_USERNAME = 'TR113',
  INVALID_MERCHANT_PASSWORD = 'TR114',
  NO_PROVIDER_SET = 'TR16',
  INVALID_COMMAND = 'TR18',
  INVALID_CVV = 'TR210',
  INVALID_MISSING_PARAMETER_GENERIC = 'TR22',
  AMOUNT_MUST_BE_GREATER_THAN_ZERO = 'TR23',
  INVALID_REVERSAL_ID_FORMAT = 'TR24',
  INVALID_REVERSAL_ID = 'TR26',
  INVALID_TRACK_ID = 'TR27',
  INVALID_AUTHORIZATION_RECORD = 'TR28',
  INVALID_SECURE_HASH = 'TR29',
  DUPLICATE_MERCHANT_TRACK_ID = 'TR31',
  NO_RESPONSE_FROM_PROVIDER = 'TR3998',
  TRANSACTION_AMOUNT_ABOVE_DAILY_LIMIT = 'TR400',
  TRANSACTION_COUNT_ABOVE_DAILY_LIMIT = 'TR401',
  INVALID_ACCOUNT_PARAMETER = 'TR4017',
  INVALID_ZIP_CODE_PARAMETER = 'TR4019',
  TRANSACTION_PROHIBITED_GENERIC = 'TR402',
  INVALID_FIRST_NAME_PARAMETER = 'TR4023',
  INVALID_LAST_NAME_PARAMETER = 'TR4024',
  INVALID_ADDRESS_PARAMETER = 'TR4025',
  INVALID_CITY_PARAMETER = 'TR4026',
  INVALID_STATE_PARAMETER = 'TR4027',
  TRANSACTION_AMOUNT_EXCEEDS_LIMIT = 'TR403',
  TRANSACTION_FREQUENCY_EXCEEDS_LIMIT = 'TR404',
  DPT_PENDING_WAITING_FOR_TRANSACTION = 'TR50',
  EXCEED_MERCHANT_LIMIT = 'TR556',
  CARD_ACCOUNT_NOT_ALLOWED = 'TR585',
  INVALID_COUNTRY_CODE = 'TR600',
  UNSUPPORTED_STATE_CODE = 'TR601',
  TRANSACTION_STILL_IN_PROCESS = 'TR700',
  TRANSACTION_CANCELLED = 'TR701',
  TRANSACTION_DENIED_SECURITY_REASONS = 'TR9000',
  USER_USES_ANONYMOUS_PROXY = 'TR9001',
  ISSUING_BANK_BIN_COUNTRY_MISMATCH = 'TR9002',
  HIGH_RISK_COUNTRY = 'TR9003',
  IP_ADDRESS_BILLING_ADDRESS_MISMATCH = 'TR9004',
}

export const REVERSED_ERROR_CODE_TRAXX = new Map(
  Object.entries(ERROR_CODE_TRAXX).map(([key, value]) => [value, key])
);

export enum REQUEST_TYPE {
  AUTHORIZE = 'AUTHORIZE',
  TRACKAUTH = 'TRACKAUTH'
}

export enum TRXN_TYPE {
  CAPTURE = 'CAPTURE',
  PREAUTH = 'PREAUTH',
  SETTLE_PREAUTH = 'SETTLE_PREAUTH',
  REFUND = 'REFUND',
  REFUND_MR = 'REFUND_MR',
  VOID = 'VOID',
}

export enum PAYMENT_METHOD {
  VISA = 1,
  MASTERCARD = 2,
  JCB = 3,
  OTHER = 4,
}

console.log('đasadasdasd', typeof REVERSED_ERROR_CODE_TRAXX)

@Schema({
  timestamps: true,
  collection: 'FiatHistoryTransaction',
})
export class FiatHistoryTransaction {
  @Prop({ type: String})
  respCode: ERROR_CODE_TRAXX;

  @Prop({ type: String })
  respDesc: typeof REVERSED_ERROR_CODE_TRAXX;

  @Prop({ type: String })
  respTime: string;

  @Prop({ type: String })
  requestType: REQUEST_TYPE;

  @Prop({ type: String })
  trxnType: TRXN_TYPE;

  @Prop({ type: String })
  merchantId: string;

  @Prop({ type: String })
  trackId: string;

  @Prop({ type: String })
  rrn: string;

  @Prop({ type: String })
  paymentMethod: PAYMENT_METHOD;

  @Prop({ type: String })
  currencyCode: string;

  @Prop({ type: String })
  trxnAmount: string;

  @Prop({ type: String })
  authCode: string;

  @Prop({ type: String })
  authMsg: string;

  @Prop({ type: String })
  avsCode: string;

  @Prop({ type: String })
  fraudScore: string;

  @Prop({ type: String })
  fraudMsg: string;
}

export const FiatHistoryTransactionSchema = SchemaFactory.createForClass(FiatHistoryTransaction);