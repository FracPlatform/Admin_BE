import { AffiliateWithdrawalRequestRevenue, AFFILIATE_WITHDRAWAL_REQUEST_STATUS } from "../datalayer/model";

export class UserWithdrawal {
  createdBy: string;
  recipientAddress: string;
  emailReveiceNotification: string;
  revenue: AffiliateWithdrawalRequestRevenue[];
  requestId: string;
  status: AFFILIATE_WITHDRAWAL_REQUEST_STATUS;
  transactionCompletedOn?: Date;
  txHash?: string;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedOn?: Date;
  traderCanceledOn?: Date;
}