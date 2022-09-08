import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { WorkerDataDto } from './dto/worker-data.dto';
import { Contract } from 'src/common/constants';
import { CommonService } from 'src/common-service/common.service';
import { TransferSingleDto } from './dto/transfer-single.dto';
import { TransferBatchDto } from './dto/transfer-batch.dto';
import { TransferDto } from './dto/transfer.dto';
import mongoose from 'mongoose';
const jwt = require('jsonwebtoken');

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    @InjectConnection() private readonly connection: mongoose.Connection,
    private commonService: CommonService,
  ) {}

  async generateToken() {
    const payload = { address: 'Worker', role: '' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return { token };
  }

  async receivedData(requestData: WorkerDataDto) {
    if (requestData.eventType === Contract.EVENT.TRANSFER_SINGLE) {
      // TRANSFER SINGLE 1155
      const data = requestData.data as TransferSingleDto;
      data.hash = requestData.hash;
      return 'todo';
    } else if (requestData.eventType === Contract.EVENT.TRANSFER_BATCH) {
      // TRANSFER BATCH 1155
      const data = requestData.data as TransferBatchDto;
      data.hash = requestData.hash;
      return 'todo';
    } else if (requestData.eventType === Contract.EVENT.TRANSFER) {
      // TRANSFER 721
      const data = requestData.data as TransferDto;
      data.hash = requestData.hash;
      return 'todo';
    } else {
      this.logger.error(`Event ${requestData.eventType} not handle`);
      return 'todo';
    }
  }
}
