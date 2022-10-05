import { Injectable } from '@nestjs/common';
import {
  ApprovedBy,
  IAORequest,
  IAO_REQUEST_STATUS,
} from 'src/datalayer/model';
import { DocumentItemEntity } from 'src/entity';
import { CreateDocumentItemDto } from '../asset/dto/documentItem.dto';
import { ApproveIaoRequestDTO } from './dto/approve-iao-request.dto';

@Injectable()
export class IaoRequestBuilderService {
  createIaoRequestDetail(iaos, isGetNft): IAORequest {
    if (!isGetNft) {
      // format documents
      const documentsArray = [];
      for (const item of iaos[0].items) {
        item.documents = item.documents.map((doc) => {
          return { ...doc, itemId: item._id };
        });
        documentsArray.push(...item.documents);
      }
      iaos[0]['documents'] = documentsArray;
    }
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

  createSecondReview(dto: ApproveIaoRequestDTO, user: any): ApprovedBy {
    return {
      adminId: user.adminId,
      status: IAO_REQUEST_STATUS.APPROVED_B,
      comment: dto.comment,
      createdAt: new Date(),
    };
  }

  createReject(dto: ApproveIaoRequestDTO, user: any) {
    return {
      adminId: user.adminId,
      status: IAO_REQUEST_STATUS.REJECTED,
      comment: dto.comment,
      createdAt: new Date(),
    };
  }

  async createDocumentItem(data: CreateDocumentItemDto, size, uploadBy) {
    const documentItem: DocumentItemEntity = {
      name: data.name,
      description: data.description || '',
      fileUrl: data.fileUrl,
      size,
      uploadBy,
    };
    return documentItem;
  }

  async convertDocumentItem(data: any, user: any) {
    const documentItem: DocumentItemEntity = {
      name: data.name,
      description: data.description,
      fileUrl: data.fileUrl,
      size: data.size,
      uploadBy: data.uploadBy,
      display: data.display,
      _id: data._id,
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      uploaderAdmin: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
      },
    };
    return documentItem;
  }
}
