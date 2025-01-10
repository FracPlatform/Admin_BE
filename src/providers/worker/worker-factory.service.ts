import { Injectable } from '@nestjs/common';
import { NOTIFICATION_TYPE } from '../../datalayer/model';

@Injectable()
export class WorkerFactoryService {
  createNotificationForWithdrawalSuccessfully(
    receiver,
    withdrawRequestId,
    recipientAddress,
    subtype,
  ) {
    return {
      type: NOTIFICATION_TYPE.SYSTEM_MESSAGES,
      receiver,
      read: false,
      subtype: subtype,
      extraData: { withdrawRequestId, recipientAddress },
      deleted: false,
      hided: false,
      dexId: null,
    };
  }
}
