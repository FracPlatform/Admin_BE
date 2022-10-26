import { Injectable } from '@nestjs/common';
import { REDEMPTION_REQUEST_TYPE } from 'src/common/constants';
import { REDEMPTION_REQUEST_STATUS } from 'src/datalayer/model';
import { RedemptionRequestDetailEntity } from 'src/entity';
import { ChangeStatusDto } from './dto/redemption-request.dto';

@Injectable()
export class RedemptionRequestBuilderService {

  convertDetail(data) {
    const crBy = data.Fractor.length ? true : false;
    const redemption: RedemptionRequestDetailEntity = {
      requestId: data.requestId,
      status: data.status,
      items: data.items,
      recipientName: crBy ? data.Fractor[0].fullname : data.recipientName,
      contactEmail: crBy ? data.Fractor[0].email : data.contactEmail,
      receiptAddress: data.receiptAddress,
      contactPhone: data.contactPhone,
      note: data.note,
      createdBy: crBy
        ? {
            fractorId: data.Fractor[0].fractorId,
            fullname: data.Fractor[0].fullname,
          }
        : {
            userId: data.User[0].userId,
            walletAddress: data.User[0].walletAddress,
          },
      reviewedBy: data.Admin.length
        ? {
            adminId: data.Admin[0].adminId,
            fullname: data.Admin[0].fullname,
          }
        : null,
      reviewComment: data.reviewComment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return redemption;
  }

  updateRedemptionRequest(data: ChangeStatusDto, currentAdminId) {
    const dataUpdate = {
      status:
        data.type === REDEMPTION_REQUEST_TYPE.APPROVE
          ? REDEMPTION_REQUEST_STATUS.PROCESSING
          : data.type === REDEMPTION_REQUEST_TYPE.REJECT
          ? REDEMPTION_REQUEST_STATUS.REJECTED
          : REDEMPTION_REQUEST_STATUS.REDEEMED,
      reviewedBy:
        data.type !== REDEMPTION_REQUEST_TYPE.REDEEM
          ? currentAdminId
          : undefined,
      reviewComment:
        data.type !== REDEMPTION_REQUEST_TYPE.REDEEM
          ? data.reviewComment
          : undefined,
    };
    return dataUpdate;
  }
}
