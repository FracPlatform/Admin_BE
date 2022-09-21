import { Injectable, Logger } from '@nestjs/common';
import { WorkerDataDto } from './dto/worker-data.dto';
const jwt = require('jsonwebtoken');

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  async generateToken() {
    const payload = { address: 'Worker', role: '' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return { token };
  }

  async receivedData(requestData: WorkerDataDto) {
    console.log(requestData);
  }
}
