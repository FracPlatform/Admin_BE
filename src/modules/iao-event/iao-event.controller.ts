import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IaoEventService } from './iao-event.service';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Request } from 'express';

@Controller('iao-event')
@ApiTags('IAO Event')
export class IaoEventController {
  constructor(private readonly iaoEventService: IaoEventService) {}

  @Post('/draft')
  @ApiOperation({ summary: 'Create IAO event as draft' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createDraft(
    @Body() createIaoEventDto: CreateIaoEventDto,
    @Req() req: Request,
  ) {
    return await this.iaoEventService.createDraft(createIaoEventDto, req.user);
  }

  @Get()
  findAll() {
    return this.iaoEventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.iaoEventService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIaoEventDto: UpdateIaoEventDto,
  ) {
    return this.iaoEventService.update(+id, updateIaoEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.iaoEventService.remove(+id);
  }
}
