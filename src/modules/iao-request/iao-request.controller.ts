import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DetailIAORequestDto,
  FilterIAORequestDto,
} from './dto/filter-iao-request.dto';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { ApiError } from 'src/common/api';
import { ApproveIaoRequestDTO } from './dto/approve-iao-request.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { EditReviewComment } from './dto/edit-review-comment.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { FilterDocumentDto } from '../asset/dto/filter-document.dto';
import { ErrorCode } from 'src/common/constants';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from '../asset/dto/documentItem.dto';
import { GetUser } from '../auth/get-user.decorator';
import { ParseObjectIdPipe } from 'src/common/validation/parse-objectid.pipe';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('iao-request')
@ApiTags('IAO Request')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IaoRequestController {
  constructor(private readonly iaoRequestService: IaoRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List IAO request' })
  @HttpCode(HttpStatus.OK)
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async findAll(@Query() filter: FilterIAORequestDto, @Req() req: Request) {
    const data = await this.iaoRequestService.findAll(filter, req.user);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'IAO request detail' })
  @HttpCode(HttpStatus.OK)
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async findOne(
    @Param('requestId') requestId: string,
    @Query() filter: DetailIAORequestDto,
    @Req() req: Request,
  ) {
    try {
      const data = await this.iaoRequestService.findOne(
        requestId,
        req.user,
        filter,
      );
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }

  @Post('first-approve')
  @ApiOperation({ summary: 'First approve IAO request' })
  @HttpCode(HttpStatus.OK)
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
      throw error;
    }
  }

  @Post('second-approve')
  @ApiOperation({ summary: 'Second approve IAO request' })
  @HttpCode(HttpStatus.OK)
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
      throw error;
    }
  }

  @Post('first-reject')
  @ApiOperation({ summary: 'First reject IAO request' })
  @HttpCode(HttpStatus.OK)
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
      throw error;
    }
  }

  @Post('second-reject')
  @ApiOperation({ summary: 'Second reject IAO request' })
  @HttpCode(HttpStatus.OK)
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
      throw error;
    }
  }

  @Post('change-to-draft')
  @ApiOperation({ summary: 'Change to draft IAO request' })
  @HttpCode(HttpStatus.OK)
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
      throw error;
    }
  }

  @Post('edit-review-comment')
  @ApiOperation({ summary: 'Edit review comment IAO request' })
  @HttpCode(HttpStatus.OK)
  async EditReviewComment(
    @Body() editReviewComment: EditReviewComment,
    @Req() req: Request,
  ) {
    try {
      const requestId = await this.iaoRequestService.EditReviewComment(
        editReviewComment,
        req.user,
      );
      return new ApiSuccessResponse().success(requestId, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('search-document-items/:id')
  @ApiOperation({ summary: 'Search documents in IAO request' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async searchDocument(
    @Param('id') id: string,
    @Query() filterDocument: FilterDocumentDto,
  ) {
    try {
      const responseData = await this.iaoRequestService.searchDocument(
        id,
        filterDocument,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Post('add-document-items/:id')
  @ApiOperation({ summary: 'Create documentItem for IAO request' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async addDocumentItem(
    @Body() createDocumentItemDto: CreateDocumentItemDto,
    @GetUser() user,
    @Param('id') id: string,
  ) {
    const data = await this.iaoRequestService.addDocumentItem(
      user,
      createDocumentItemDto,
      id,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('edit-document-items/:iaoRequestId/:docId')
  @ApiOperation({ summary: 'Edit documentItem for IAO request' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async editDocumentItem(
    @Param('iaoRequestId') id: string,
    @Param('docId', ParseObjectIdPipe) docId: string,
    @Body() updateDocumentItemDto: UpdateDocumentItemDto,
    @GetUser() user,
  ) {
    const data = await this.iaoRequestService.editDocumentItem(
      user,
      id,
      docId,
      updateDocumentItemDto,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Delete('delete-document-items/:iaoRequestId/:docId')
  @ApiOperation({ summary: 'Delete documentItem for IAO request' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async deleteDocumentItem(
    @Param('iaoRequestId') id: string,
    @Param('docId', ParseObjectIdPipe) docId: string,
    @GetUser() user,
  ) {
    const data = await this.iaoRequestService.deleteDocumentItem(
      user,
      id,
      docId,
    );
    return new ApiSuccessResponse().success(data, '');
  }
}
