import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ASSET_STATUS } from 'src/datalayer/model';
import { CreateNftDto } from './dto/create-nft.dto';
import { NftBuilderService } from './nft.factory.service';

@Injectable()
export class NftService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly nftBuilderService: NftBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createNft(body: CreateNftDto, user: any) {
    if (body.assetId) {
      const assetItem = await this.dataService.asset.findOne({
        itemId: body.assetId,
      });
      if (!assetItem) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid asset');
      if (
        assetItem.status !== ASSET_STATUS.IAO_APPROVED ||
        assetItem.isMintNFT ||
        assetItem.inDraft
      )
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid asset');
    }
    if (body.assetType) {
      const assetType = await this.dataService.assetTypes.findOne({
        assetTypeId: body.assetType,
      });
      if (!assetType)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid asset type');
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const newNft = await this.nftBuilderService.createNft(
        body,
        user,
        session,
      );
      await this.dataService.nft.create(newNft, { session });
      if (body.assetId)
        await this.dataService.asset.updateOne(
          {
            itemId: body.assetId,
          },
          {
            $set: {
              isMintNFT: true,
            },
          },
          { session },
        );
      await session.commitTransaction();
      return newNft;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
