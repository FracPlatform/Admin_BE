import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiSuccessResponse } from '../../common/response/api-success';
import { WorkerDataDto } from './dto/worker-data.dto';
import { WorkerGuard } from './worker.guard';
import { WorkerService } from './worker.service';
import { EventKYC } from './dto/kyc.dto';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post('/token')
  @HttpCode(200)
  async generateToken() {
    const token = await this.workerService.generateToken();
    return new ApiSuccessResponse().success(token, '');
  }

  @Post('/submitKyc')
  @HttpCode(200)
  async submitKyc(@Req() req: Request, @Body() dataKyc: EventKYC) {
    const response = await this.workerService.submitKyc(req, dataKyc);
    return new ApiSuccessResponse().success(response, '');
  }

  @Post()
  @HttpCode(200)
  @UseGuards(WorkerGuard)
  async receivedData(@Body() requestData: WorkerDataDto) {
    await this.workerService.receivedData(requestData);
    return new ApiSuccessResponse().success('', '');
  }
}
