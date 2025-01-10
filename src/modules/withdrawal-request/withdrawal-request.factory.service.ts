import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_SUBTYPE,
  NOTIFICATION_TYPE,
} from '../../datalayer/model/notification.model';
import { NotificationEntity, NotificationForDexEntity } from '../../entity/notification.entity';

@Injectable()
export class WithdrawalRequestBuilderService {
  createCancelWithdrawalRequest(requestId: string, receiver: string) {
    const notification: NotificationEntity = {
      type: NOTIFICATION_TYPE.SYSTEM_MESSAGES,
      receiver: receiver,
      read: false,
      subtype: NOTIFICATION_SUBTYPE.CANCEL_WITHDRAWAL,
      extraData: {
        withdrawalId: requestId,
      },
      deleted: false,
      hided: false,
      dexId: '',
    };
    return notification;
  }

  _createSystemNotificationForDex(
    walletAddress: string,
    uuid: string,
    type: NOTIFICATION_SUBTYPE,
    data: any,
  ) {
    const notificationForDex: NotificationForDexEntity = {
      walletAddress,
      uuid,
      type,
      data,
    };
    return notificationForDex;
  }

}
