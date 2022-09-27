import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../../common/api';
import { CONTRACT_EVENTS } from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import { ADMIN_STATUS } from '../../datalayer/model';
import { Role } from '../../modules/auth/role.enum';
import { SOCKET_EVENT } from '../socket/socket.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { WorkerDataDto } from './dto/worker-data.dto';
const jwt = require('jsonwebtoken');

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly socketGateway: SocketGateway,
  ) {}

  async generateToken() {
    const payload = { address: 'Worker', role: '' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return { token };
  }

  async receivedData(requestData: WorkerDataDto) {
    try {
      switch (requestData.eventName) {
        case CONTRACT_EVENTS.SET_ADMIN:
          await this._handleSetAdminEvent(requestData);
          break;
      }
    } catch (err) {
      this.logger.debug(err.message, err.stack);
      throw ApiError('Webhook err', err.message);
    }
  }

  private async _handleSetAdminEvent(requestData: WorkerDataDto) {
    // if role receive contract 0 -> deactive, #0 -> active
    if (+requestData.metadata.role === Role.Deactive) {
      // deactive
      await this.dataServices.admin.findOneAndUpdate(
        { walletAddress: requestData.metadata.addr },
        {
          status: ADMIN_STATUS.INACTIVE,
          lastUpdateBy: requestData.metadata.setBy,
        },
      );
      this.socketGateway.sendMessage(SOCKET_EVENT.DEACTIVE_ADMIN_EVENT, requestData);
    } else {
      // active
      await this.dataServices.admin.findOneAndUpdate(
        { walletAddress: requestData.metadata.addr },
        {
          status: ADMIN_STATUS.ACTIVE,
          lastUpdateBy: requestData.metadata.setBy,
        },
      );
      this.socketGateway.sendMessage(SOCKET_EVENT.ACTIVE_ADMIN_EVENT, requestData);
    }
  }
}
