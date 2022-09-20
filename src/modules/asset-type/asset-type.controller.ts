import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { AssetTypeService } from './asset-type.service';
import { AddSpecificationDto } from './dto/add-specifications.dto';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { DeleteSpecificationDto } from './dto/delete-specification.dto';
import { EditAssetTypeDto } from './dto/edit-asset-type.dto';
import { EditSpecificationDto } from './dto/edit-specification.dto';
import { GetAssetTypeByIdDto } from './dto/get-asset-type-by-id.dto';
import { GetListAssetTypeDto } from './dto/get-list-asset-type.dto';

@Controller('asset-type')
@ApiTags('Asset Type')
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list Asset type',
  })
  async getListAssetTypes(@Query() queries: GetListAssetTypeDto) {
    try {
      const responseData = await this.assetTypeService.getListAssetType(
        queries,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Asset type by assetTypeId' })
  async getAssetTypeById(@Param() params: GetAssetTypeByIdDto) {
    try {
      const responseData = await this.assetTypeService.getAssetTypeById(params);
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create asset type' })
  async createAssetType(@Body() createAssetTypeBody: CreateAssetTypeDto) {
    try {
      const responseData = await this.assetTypeService.createAssetType(
        createAssetTypeBody,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Put('edit/:id')
  @ApiOperation({ summary: 'Edit asset type' })
  async updateAssetType(
    @Param() params: GetAssetTypeByIdDto,
    @Body() newAssetTypeData: EditAssetTypeDto,
  ) {
    try {
      const responseData = await this.assetTypeService.updateAssetType(
        params,
        newAssetTypeData,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Put('add-specifications/:id')
  @ApiOperation({ summary: 'Add specification field' })
  async addSpecifications(
    @Param() params: GetAssetTypeByIdDto,
    @Body() newSpecifications: AddSpecificationDto,
  ) {
    try {
      const responseData = await this.assetTypeService.addSpecifications(
        params,
        newSpecifications,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Put('edit-specification/:id')
  @ApiOperation({ summary: 'Edit one specification' })
  async editSpecification(
    @Param() params: GetAssetTypeByIdDto,
    @Body() editedSpecification: EditSpecificationDto,
  ) {
    try {
      const responseData = await this.assetTypeService.editSpecification(
        params,
        editedSpecification,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Delete('delete-specification/:id')
  @ApiOperation({ summary: 'Delete a specification' })
  async deleteSpecification(
    @Param() params: GetAssetTypeByIdDto,
    @Body() deletedSpecificationId: DeleteSpecificationDto,
  ) {
    try {
      const responseData = await this.assetTypeService.deleteSpecification(
        params,
        deletedSpecificationId,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }
}
