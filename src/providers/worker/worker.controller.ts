import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiSuccessResponse } from '../../common/response/api-success';
import { WorkerDataDto } from './dto/worker-data.dto';
import { WorkerGuard } from './worker.guard';
import { WorkerService } from './worker.service';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post('/token')
  @HttpCode(200)
  generateToken() {
    const token = this.workerService.generateToken();
    return new ApiSuccessResponse().success(token, '');
  }

  @Post()
  @HttpCode(200)
  @UseGuards(WorkerGuard)
  async receivedData(@Body() requestData: WorkerDataDto) {
    await this.workerService.receivedData(requestData);
    return new ApiSuccessResponse().success('', '');
  }
}
