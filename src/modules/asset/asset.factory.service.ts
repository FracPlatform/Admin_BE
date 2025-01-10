import { Injectable } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { DOCUMENT_STATUS } from 'src/datalayer/model/document-item.model';
import {
  AssetForOwnerEntity,
  DocumentActivityLogEntity,
  DocumentItemEntity,
  ShipmentInfoEntity,
} from 'src/entity/asset.entity';
import {
  Admin,
  Asset,
  CategoryType,
  RedemptionRequest,
} from '../../datalayer/model';
import { CreateDocumentItemDto } from './dto/documentItem.dto';
import {
  CreateShipmentInfoDto,
  UpdateShipmentInfoDto,
} from './dto/shipment-infor.dto';
import { UpdateCustodianshipDto } from './dto/update-custodianship-status.dto';

@Injectable()
export class AssetBuilderService {
  constructor(private readonly dataServices: IDataServices) {}

  convertAssets(data) {
    return data.map((e) => {
      const asset: AssetForOwnerEntity = {
        _id: e._id,
        ownerId: e.ownerId,
        collectionId: e.collectionId,
        name: e.name,
        category: e.category,
        typeId: e.AssetType[0].assetTypeId,
        isMintNFT: e.isMintNFT,
        network: e.network,
        ownershipPrivacy: e.ownershipPrivacy,
        description: e.description,
        specifications: e.specifications,
        documents: e.documents,
        status: e.status,
        media: e.media,
        previewUrl: e.previewUrl,
        hidden: e.hidden,
        owner:
          e.Fractor && e.Fractor.length
            ? {
                name: e.Fractor[0]['name'],
                email: e.Fractor[0]['email'],
                kycStatus: e.Fractor[0]['kycStatus'],
                fullname: e.Fractor[0]['fullname'],
                avatar: e.Fractor[0]['avatar'],
                id: e.Fractor[0]['fractorId'],
              }
            : null,
        itemId: e.itemId,
        assetTypeName: e.assetTypeName,
        custodianship: e.custodianship,
        deleted: e.deleted,
        lastUpdatedBy: e.lastUpdatedBy,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      };
      return asset;
    });
  }

  convertAssetDetail(
    data: any,
    user: any,
    assetType: any,
    documents: any[],
    currentIaoRequest,
    currentRedemptionRequest: RedemptionRequest,
  ) {
    const asset: AssetForOwnerEntity = {
      _id: data._id,
      ownerId: data.ownerId,
      collectionId: data.collectionId,
      name: data.name,
      category: data.category,
      typeId: assetType.assetTypeId,
      isMintNFT: data.isMintNFT,
      network: data.network,
      ownershipPrivacy: data.ownershipPrivacy,
      description: data.description,
      specifications: data.specifications,
      documents: documents,
      status: data.status,
      media: data.media,
      previewUrl: data.previewUrl,
      hidden: data.hidden,
      owner: user
        ? {
            name: user.name,
            email: user.email,
            kycStatus: user.kycStatus,
            fullname: user.fullname,
            avatar: user.avatar,
            id: user.fractorId,
          }
        : null,
      itemId: data.itemId,
      assetTypeName: assetType.name,
      custodianship: data.custodianship,
      deleted: data.deleted,
      iaoRequest: {
        id: currentIaoRequest?.iaoId,
      },
      lastUpdatedBy: {
        id: data.lastUpdatedBy,
        fullname:
          data.updatedBy?.fractor?.fullname || data.updatedBy?.admin?.fullname,
      },
      documentActivityLog: data.documentActivityLog,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    if (currentRedemptionRequest)
      asset.redemptionRequest = {
        _id: currentRedemptionRequest['_id'],
        requestId: currentRedemptionRequest?.requestId,
        createdBy: currentRedemptionRequest?.createdBy,
      };
    return asset;
  }

  async createDocumentItem(data: CreateDocumentItemDto, size, uploadBy, status = DOCUMENT_STATUS.NONE) {
    const documentItem: DocumentItemEntity = {
      name: data.name,
      description: data.description || '',
      fileUrl: data.fileUrl,
      size,
      uploadBy,
      status
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

  async createShipmentInfo(data: CreateShipmentInfoDto) {
    const shipmentInfo: ShipmentInfoEntity = {
      shipmentStatus: data.shipmentStatus,
      shipmentTime: data.shipmentTime,
    };
    return shipmentInfo;
  }

  async updateShipmentInfo(user: any, data: UpdateShipmentInfoDto) {
    const newShipmentInfo = {
      'custodianship.listShipmentInfo.$.shipmentStatus': data.shipmentStatus,
      'custodianship.listShipmentInfo.$.shipmentTime':
        data.shipmentTime === 'N/A' ? null : data.shipmentTime,
      lastUpdatedBy: user.adminId,
    };
    return newShipmentInfo;
  }

  async updateCustodianship(
    user: any,
    currentasset,
    update: UpdateCustodianshipDto,
  ) {
    const arrayKeyOptional = ['4', '5', '7', '8'];
    let errorData = '';

    for (const key in update.label) {
      if (currentasset.category !== CategoryType.PHYSICAL) {
        for (const key2 in update.label[key]) {
          if (arrayKeyOptional.includes(key2)) delete update.label[key][key2];
        }
      } else {
        if (
          !arrayKeyOptional.every((k) =>
            Object.keys(update.label[key]).includes(k),
          )
        )
          errorData += `Label ${key} missing key, `;
      }
    }

    if (errorData.length) throw ApiError(ErrorCode.DEFAULT_ERROR, errorData);

    const dataLabel = update.label
      ? {
          en: update.label?.en || currentasset.custodianship?.label?.en,
          cn: update.label?.cn || currentasset.custodianship?.label?.cn,
          ja: update.label?.ja || currentasset.custodianship?.label?.ja,
          vi: update.label?.vi || currentasset.custodianship?.label?.vi,
        }
      : undefined;
    const dataUpdate = {
      $set: {
        'custodianship.status': update.status,
        'custodianship.isShow': update.isShow,
        'custodianship.label': dataLabel,
        'custodianship.storedByFrac': update.storedByFrac,
        'custodianship.warehousePublic': update.warehousePublic,
        'custodianship.warehousePrivate': update.warehousePrivate,
        lastUpdatedBy: user.adminId,
      },
    };
    return dataUpdate;
  }

  createDocumentActivityLog(asset: Asset, docId: string, admin: Admin) {
    const document = JSON.parse(JSON.stringify(asset)).documents.find(
      (e) => e['_id'] === docId,
    );
    const documentActivityLog: DocumentActivityLogEntity = {
      adminId: admin.adminId,
      adminName: admin.fullname,
      documentDescription: document.description,
      documentName: document.name,
    };
    return documentActivityLog;
  }
}
