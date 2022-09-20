import { Injectable } from '@nestjs/common';
import {
  ApprovedBy,
  IAORequest,
  IAO_REQUEST_STATUS,
} from 'src/datalayer/model';
import { ApproveIaoRequestDTO } from './dto/approve-iao-request.dto';

@Injectable()
export class IaoRequestBuilderService {
  createIaoRequestDetail(iaos): IAORequest {
    // format documents
    const documentsArray = [];
    for (const item of iaos[0].items) {
      item.documents = item.documents.map((doc) => {
        return { ...doc, itemId: item._id };
      });
      documentsArray.push(...item.documents);
    }
    iaos[0]['documents'] = documentsArray;

    // format reviewer
    iaos[0]['firstReviewer'] = {
      ...iaos[0]['firstReviewer'],
      ...iaos[0]['_firstReviewer'],
    };
    iaos[0]['secondReviewer'] = {
      ...iaos[0]['secondReviewer'],
      ...iaos[0]['_secondReviewer'],
    };
    delete iaos[0]['_firstReviewer'];
    delete iaos[0]['_secondReviewer'];

    return iaos[0];
  }

  createFirstReview(dto: ApproveIaoRequestDTO, user: any): ApprovedBy {
    return {
      adminId: user.adminId,
      status: IAO_REQUEST_STATUS.APPROVED_A,
      comment: dto.comment,
      createdAt: new Date(),
    };
  }
}
