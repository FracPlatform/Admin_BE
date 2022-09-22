import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterIAORequestDto } from './dto/filter-iao-request.dto';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { ApiError } from 'src/common/api';
import { ApproveIaoRequestDTO } from './dto/approve-iao-request.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Request } from 'express';

@Controller('iao-request')
@ApiTags('IAO Request')
export class IaoRequestController {
  constructor(private readonly iaoRequestService: IaoRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List IAO request' })
  async findAll(@Query() filter: FilterIAORequestDto) {
    const data = await this.iaoRequestService.findAll(filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'IAO request detail' })
  async findOne(@Param('requestId') requestId: string) {
    try {
      const data = await this.iaoRequestService.findOne(requestId);
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw ApiError('', 'Get iao request detail error');
    }
  }

  @Post('first-approve')
  @ApiOperation({ summary: 'First approve IAO request' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async firstApproveIaoRequest(
    @Body() approveIaoRequestDTO: ApproveIaoRequestDTO,
    @Req() req: Request,
  ) {
    try {
      const requestId = await this.iaoRequestService.firstApproveIaoRequest(
        approveIaoRequestDTO,
        req.user,
      );
      return new ApiSuccessResponse().success(requestId, '');
    } catch (error) {
      throw ApiError('', error);
    }
  }

  @Post('second-approve')
  @ApiOperation({ summary: 'Second approve IAO request' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async secondApproveIaoRequest(
    @Body() approveIaoRequestDTO: ApproveIaoRequestDTO,
    @Req() req: Request,
  ) {
    try {
      const requestId = await this.iaoRequestService.secondApproveIaoRequest(
        approveIaoRequestDTO,
        req.user,
      );
      return new ApiSuccessResponse().success(requestId, '');
    } catch (error) {
      throw ApiError('', error);
    }
  }

  @Post('first-reject')
  @ApiOperation({ summary: 'First reject IAO request' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async firstRejectIaoRequest(
    @Body() approveIaoRequestDTO: ApproveIaoRequestDTO,
    @Req() req: Request,
  ) {
    try {
      const requestId = await this.iaoRequestService.firstRejectIaoRequest(
        approveIaoRequestDTO,
        req.user,
      );
      return new ApiSuccessResponse().success(requestId, '');
    } catch (error) {
      throw ApiError('', error);
    }
  }

  @Post('second-reject')
  @ApiOperation({ summary: 'Second reject IAO request' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async secondRejectIaoRequest(
    @Body() approveIaoRequestDTO: ApproveIaoRequestDTO,
    @Req() req: Request,
  ) {
    try {
      const requestId = await this.iaoRequestService.secondRejectIaoRequest(
        approveIaoRequestDTO,
        req.user,
      );
      return new ApiSuccessResponse().success(requestId, '');
    } catch (error) {
      throw ApiError('', error);
    }
  }

  @Post('change-to-draft')
  @ApiOperation({ summary: 'Change to draft IAO request' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async changeToDraftIaoRequest(
    @Body() approveIaoRequestDTO: ApproveIaoRequestDTO,
    @Req() req: Request,
  ) {
    try {
      const requestId = await this.iaoRequestService.changeToDraftIaoRequest(
        approveIaoRequestDTO,
        req.user,
      );
      return new ApiSuccessResponse().success(requestId, '');
    } catch (error) {
      throw ApiError('', error);
    }
  }
}
