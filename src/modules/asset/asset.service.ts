import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { get, isEqual } from 'lodash';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { ListDocument } from 'src/common/common-type';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { CategoryType, MAX_PHOTOS, MIN_PHOTOS } from 'src/datalayer/model';
import {
  CUSTODIANSHIP_STATUS,
  MEDIA_TYPE,
} from 'src/datalayer/model/asset.model';
import { MAX_FILE_SIZE } from 'src/datalayer/model/document-item.model';
import { AssetBuilderService } from './asset.factory.service';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from './dto/documentItem.dto';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { DISPLAY_STATUS, FilterDocumentDto } from './dto/filter-document.dto';
import { Role } from 'src/modules/auth/role.enum';
import { Utils } from 'src/common/utils';
import { EditDepositedNftDto } from './dto/edit-deposited-nft.dto';
import { UpdateCustodianshipFile } from './dto/edit-file.dto';
import { UpdateCustodianshipStatusDto } from './dto/update-custodianship-status.dto';
import {
  CreateShipmentInfoDto,
  UpdateShipmentInfoDto,
} from './dto/shipment-infor.dto';
const ufs = require('url-file-size');

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly assetBuilderService: AssetBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  _validatePhoto(dto: any) {
    const photo = dto.media.filter((obj) => obj.type === MEDIA_TYPE.PHOTO);
    if (photo.length < MIN_PHOTOS)
      throw ApiError(ErrorCode.MIN_PHOTOS, `upload least ${MIN_PHOTOS} photo`);
    if (photo.length > MAX_PHOTOS)
      throw ApiError('', `you can upload ${MAX_PHOTOS} photos`);
  }

  _validateSpecifications(dto: any, specifications: any): boolean {
    if (dto.specifications.length !== specifications.length) return false;

    for (let i = 0; i < dto.specifications.length; i++) {
      if (
        !isEqual(
          dto.specifications[i]._id.toString(),
          specifications[i]._id.toString(),
        ) ||
        !isEqual(
          JSON.stringify(dto.specifications[i].label),
          JSON.stringify(specifications[i].label),
        ) ||
        !isEqual(
          JSON.stringify(dto.specifications[i].description),
          JSON.stringify(specifications[i].description),
        ) ||
        !isEqual(
          JSON.stringify(dto.specifications[i].placeholder),
          JSON.stringify(specifications[i].placeholder),
        ) ||
        !isEqual(dto.specifications[i].required, specifications[i].required)
      ) {
        return false;
      }
    }

    return true;
  }

  async getListAsset(filter: FilterAssetDto, user: any) {
    const query: any = {
      deleted: false,
    };
    if (filter.status) {
      query['status'] = filter.status;
    }
    if (filter.custodianshipStatus)
      query['custodianship.status'] = filter.custodianshipStatus;
    if (filter.keyword) {
      query['$or'] = [
        {
          name: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          itemId: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          category: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'assetTypeName.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.owner) {
      query['ownerId'] = filter.owner.trim();
    }
    if (filter.fromDate) {
      query['$and'] = [{ createdAt: { $gte: new Date(filter.fromDate) } }];
    }

    if (filter.toDate) {
      if (query['$and'])
        query['$and'].push({
          createdAt: {
            $lte: new Date(filter.toDate),
          },
        });
      else
        query['$and'] = [
          {
            createdAt: {
              $lte: new Date(filter.toDate),
            },
          },
        ];
    }
    const agg = [];
    agg.push(
      {
        $lookup: {
          from: 'Fractor',
          localField: 'ownerId',
          foreignField: 'fractorId',
          as: 'Fractor',
        },
      },
      {
        $lookup: {
          from: 'AssetType',
          localField: 'typeId',
          foreignField: '_id',
          as: 'AssetType',
        },
      },
      {
        $addFields: {
          assetTypeName: { $arrayElemAt: ['$AssetType.name', 0] },
        },
      },
      {
        $match: query,
      },
      {
        $project: { specifications: 0 },
      },
    );

    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
    } else {
      sort = { $sort: { createdAt: -1 } };
    }

    const dataReturnFilter = [sort, { $skip: filter.offset || 0 }];

    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || 10 });

    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });
    let dataQuery;
    if (user.role === Role.FractorBD) {
      dataQuery = await this.dataServices.fractor.aggregate(
        [
          {
            $match: {
              assignedBD: user.adminId,
            },
          },
          {
            $unwind: { path: '$collections' },
          },

          {
            $lookup: {
              from: 'Asset',
              localField: 'collections._id',
              foreignField: 'collectionId',
              as: 'asset',
            },
          },
          { $unwind: { path: '$asset' } },
          {
            $lookup: {
              from: 'AssetType',
              localField: 'asset.typeId',
              foreignField: '_id',
              as: 'AssetType',
            },
          },

          {
            $project: {
              _id: '$asset._id',
              name: '$asset.name',
              category: '$asset.category',
              isMintNFT: '$asset.isMintNFT',
              ownershipPrivacy: '$asset.ownershipPrivacy',
              description: '$asset.description',
              status: '$asset.status',
              media: '$asset.media',
              ownerId: '$asset.ownerId',
              collectionId: '$asset.collectionId',
              documents: '$asset.documents',
              deleted: '$asset.deleted',
              inDraft: '$asset.inDraft',
              custodianship: '$custodianship',
              AssetType: '$AssetType',
              itemId: '$asset.itemId',
              createdAt: '$asset.createdAt',
              assetTypeName: { $arrayElemAt: ['$AssetType.name', 0] },
              Fractor: [
                {
                  fullname: '$fullname',
                  email: '$email',
                  kycStatus: '$kycStatus',
                  avatar: '$avatar',
                  _id: '$_id',
                },
              ],
            },
          },
          {
            $match: query,
          },
          {
            $facet: {
              count: [{ $count: 'count' }],
              data: dataReturnFilter,
            },
          },
        ],
        {
          collation: { locale: 'en' },
        },
      );
    } else {
      dataQuery = await this.dataServices.asset.aggregate(agg, {
        collation: { locale: 'en' },
      });
    }

    const data = get(dataQuery, [0, 'data']);
    const response = this.assetBuilderService.convertAssets(data);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async getDetail(assetId: string) {
    const currentAssetDocument = await this.searchDocument(assetId, {});

    const [currentAsset] = await this.dataServices.asset.aggregate([
      {
        $match: {
          itemId: assetId,
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { id: '$lastUpdatedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$fractorId', '$$id'] } } },
            {
              $project: {
                fullname: 1,
              },
            },
          ],
          as: 'updatedBy.fractor',
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { id: '$lastUpdatedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$id'] } } },
            {
              $project: {
                fullname: 1,
              },
            },
          ],
          as: 'updatedBy.admin',
        },
      },
      {
        $unwind: {
          path: '$updatedBy.fractor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: { path: '$updatedBy.admin', preserveNullAndEmptyArrays: true },
      },
    ]);
    if (!currentAsset)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'no data exists');

    const currentUser = await this.dataServices.fractor.findOne({
      fractorId: currentAsset.ownerId,
    });

    if (!currentUser) throw ApiError(ErrorCode.DEFAULT_ERROR, 'DEFAULT_ERROR');

    const currentAssetType = await this.dataServices.assetTypes.getById(
      currentAsset.typeId,
    );
    if (!currentAssetType)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'DEFAULT_ERROR');

    const currentIaoRequest = await this.dataServices.iaoRequest.findOne({
      items: currentAsset.itemId,
    });
    const response = this.assetBuilderService.convertAssetDetail(
      currentAsset,
      currentUser,
      currentAssetType,
      currentAssetDocument,
      currentIaoRequest,
    );
    return response;
  }

  async editDisplay(assetId: string, user: any) {
    await this.dataServices.asset.findOneAndUpdate(
      {
        _id: assetId,
      },
      [
        {
          $set: { deleted: { $not: '$deleted' }, lastUpdatedBy: user.adminId },
        },
      ],
    );

    return { success: true };
  }

  async searchDocument(assetId: string, filter: FilterDocumentDto) {
    const query = {};
    if (filter.keyword)
      query['$or'] = [
        {
          'documents.name': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'documents.description': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'documents.uploadBy': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    if (filter.display === DISPLAY_STATUS.DISPLAY)
      query['documents.display'] = true;
    if (filter.display === DISPLAY_STATUS.NOT_DISPLAY)
      query['documents.display'] = false;
    const documents = await this.dataServices.asset.aggregate([
      {
        $match: {
          itemId: assetId,
        },
      },
      {
        $unwind: { path: '$documents' },
      },
      { $match: query },
      {
        $lookup: {
          from: 'Fractor',
          let: { id: '$documents.uploadBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$fractorId', '$$id'] } } },
            {
              $project: {
                email: 1,
                fullname: 1,
              },
            },
          ],
          as: 'documents.uploaderFractor',
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { id: '$documents.uploadBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$id'] } } },
            {
              $project: {
                email: 1,
                fullname: 1,
              },
            },
          ],
          as: 'documents.uploaderAdmin',
        },
      },
      {
        $unwind: {
          path: '$documents.uploaderFractor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$documents.uploaderAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          documents: { $push: '$documents' },
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);
    return documents.length ? documents[0].documents : documents;
  }

  async addDocumentItem(
    user: any,
    data: CreateDocumentItemDto,
    assetId: string,
  ) {
    const filter = {
      _id: assetId,
      deleted: false,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const fileSize = await ufs(data.fileUrl).catch(console.error);
    if (fileSize > MAX_FILE_SIZE)
      throw ApiError(ErrorCode.MAX_FILE_SIZE, `file name: ${data.name}`);

    //create newDocuments
    const newDoc = await this.assetBuilderService.createDocumentItem(
      data,
      fileSize,
      user.adminId,
    );

    const newAsset = await this.dataServices.asset.findOneAndUpdate(
      filter,
      {
        $push: {
          documents: {
            $each: [newDoc],
            $position: 0,
          },
        },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
      { new: true },
    );

    return this.assetBuilderService.convertDocumentItem(
      newAsset.documents[0],
      user,
    );
  }

  async editDocumentItem(
    user: any,
    assetId: string,
    docId: string,
    data: UpdateDocumentItemDto,
  ) {
    const filter = {
      itemId: assetId,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'documents._id': docId,
      },
      {
        $set: {
          'documents.$.description': data.description,
          'documents.$.display': data.display,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit document');
    return { success: true };
  }

  async deleteDocumentItem(user, assetId: string, docId: string) {
    const filter = {
      itemId: assetId,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'documents._id': docId,
      },
      {
        $pull: { documents: { _id: docId } },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete document');
    return { success: true };
  }

  async editDepositedNft(
    assetId: string,
    depositedNftId: string,
    editDepositedNft: EditDepositedNftDto,
    user: any,
  ) {
    const asset = await this.dataServices.asset.findOne({
      itemId: assetId,
    });
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, `Id of Asset is invalid`);
    const totalDepositedNumber = asset.depositedNFTs.find(
      (nft) => nft['_id'] === depositedNftId,
    );
    if (editDepositedNft.withdrawable >= totalDepositedNumber.balance) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Withdrawavble amount can not be larger than total deposited amount',
      );
    }
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'depositedNFTs._id': depositedNftId,
      },
      {
        $set: {
          'depositedNFTs.$.status': editDepositedNft.status,
          'depositedNFTs.$.withdrawable': editDepositedNft.withdrawable,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update asset');
    return { success: true };
  }

  async updateCustodianshipStatus(
    assetId: string,
    updateStatus: UpdateCustodianshipStatusDto,
    user: any,
  ) {
    const asset = await this.dataServices.asset.findOne({
      itemId: assetId,
    });
    if (!asset) throw ApiError('', `Id of Asset is invalid`);
    if (asset.custodianship.status > CUSTODIANSHIP_STATUS.FRAC)
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Cannot update custodianship status',
      );
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
      },
      {
        $set: {
          'custodianship.status': updateStatus.status,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Can not update custodianship status',
      );
    return { success: true };
  }

  async editFile(
    user: any,
    assetId: string,
    fileId: string,
    data: UpdateCustodianshipFile,
  ) {
    const filter = {
      itemId: assetId,
    };
    const asset = await this.dataServices.asset.findOne(filter);
    if (
      data.status &&
      asset.custodianship.status >
        CUSTODIANSHIP_STATUS.FRACTOR_TO_FRAC_OR_IN_REVIEW
    )
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Can not change file status now.',
      );
    if (!asset) throw ApiError('', `Id of Asset is invalid`);
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.files._id': fileId,
      },
      {
        $set: {
          'custodianship.files.$.description': data.description,
          'custodianship.files.$.status': data.status,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit document');
    return { success: true };
  }

  async deleteFile(user, assetId: string, fileId: string) {
    const filter = {
      itemId: assetId,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.files._id': fileId,
      },
      {
        $pull: { 'custodianship.files': { _id: fileId } },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete file');
    return { success: true };
  }

  async addShipmentInfo(
    user: any,
    data: CreateShipmentInfoDto,
    assetId: string,
  ) {
    const filter = {
      itemId: assetId,
      category: CategoryType.PHYSICAL,
      deleted: false,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    //create new shipment-info
    const newShipmentInfo = await this.assetBuilderService.createShipmentInfo(
      data,
    );

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      filter,
      {
        $push: {
          'custodianship.listShipmentInfo': newShipmentInfo,
        },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
      { new: true },
    );

    const last = updatedAsset.custodianship.listShipmentInfo.length - 1;
    return updatedAsset.custodianship.listShipmentInfo[last];
  }

  async editShipmentInfo(
    user: any,
    assetId: string,
    shipmentId: string,
    data: UpdateShipmentInfoDto,
  ) {
    const filter = { itemId: assetId };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id of Asset is invalid');

    //update shipment-info
    const newShipmentInfo = await this.assetBuilderService.updateShipmentInfo(
      user,
      data,
    );

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.listShipmentInfo._id': shipmentId,
      },
      {
        $set: newShipmentInfo,
      },
      { new: true },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit shipment info');

    return { success: true };
  }

  async removeShipmentInfo(user, assetId: string, shipmentId: string) {
    const filter = { itemId: assetId };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, `Id of Asset is invalid`);

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.listShipmentInfo._id': shipmentId,
      },
      {
        $pull: { 'custodianship.listShipmentInfo': { _id: shipmentId } },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
      { new: true },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete shipment info');

    return { success: true };
  }

  async changeIndexShipmentInfo(
    user: any,
    assetId: string,
    shipmentId: string,
    index: number,
  ) {
    const asset = await this.dataServices.asset.findOne({ itemId: assetId });
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id of Asset is invalid');

    const currentShipment = asset.custodianship.listShipmentInfo.filter(
      (s) => s['_id'] == shipmentId,
    );
    if (!currentShipment.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id of shipment is invalid');

    if (asset.custodianship.listShipmentInfo.length < index + 1)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'index is invalid');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updatedAsset1 = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
          updatedAt: asset['updatedAt'],
          'custodianship.listShipmentInfo._id': shipmentId,
        },
        {
          $pull: { 'custodianship.listShipmentInfo': { _id: shipmentId } },
        },
        { session },
      );
      if (!updatedAsset1)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Cannot change index shipment info 1',
        );

      const updatedAsset2 = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
        },
        {
          $push: {
            'custodianship.listShipmentInfo': {
              $each: currentShipment,
              $position: index,
            },
          },
          $set: {
            lastUpdatedBy: user.adminId,
          },
        },
        { session },
      );
      if (!updatedAsset2)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Cannot change index shipment info 2',
        );

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      this.logger.debug(error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }
}
