import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  AssetForOwnerEntity,
  DocumentItemEntity,
  ShipmentInfoEntity,
} from 'src/entity/asset.entity';
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
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return asset;
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
    const dataLabel = update.label
      ? {
          en: update.label?.en || currentasset.custodianship?.label?.en,
          cn: update.label?.cn || currentasset.custodianship?.label?.cn,
          ja: update.label?.ja || currentasset.custodianship?.label?.ja,
        }
      : undefined;
    const dataUpdate = {
      $set: {
        'custodianship.status': update.status,
        'custodianship.label': dataLabel,
        'custodianship.storedByFrac': update.storedByFrac,
        'custodianship.warehousePublic': update.warehousePublic,
        'custodianship.warehousePrivate': update.warehousePrivate,
        lastUpdatedBy: user.adminId,
      },
    };
    return dataUpdate;
  }
}
