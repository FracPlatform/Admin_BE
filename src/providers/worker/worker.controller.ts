import {
  Controller,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import { WorkerDataDto } from './dto/worker-data.dto';
import { WorkerService } from './worker.service';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post('/token')
  @HttpCode(200)
  generateToken() {
    return this.workerService.generateToken();
  }

  @Post()
  @HttpCode(200)
  receivedData(@Body() requestData: WorkerDataDto) {
    return this.workerService.receivedData(requestData);
  }
}
