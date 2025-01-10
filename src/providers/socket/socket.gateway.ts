import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server, Namespace } from 'socket.io';
import { SOCKET_NAMESPACE } from './socket.enum';

@WebSocketGateway({
  cors: true,
  path: '/admin-socket.io',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);
  private workerNamespace: Namespace;
  private announcementNamespace: Namespace;
  private adminAnnouncementNamespace: Namespace;
  private iaoRequestReviewResultNamespace: Namespace;
  private iaoEventResultNamespace: Namespace;
  private revenueWithdrawalNamespace: Namespace;
  private traderAssetRedemptionRequestReviewResultNamespace: Namespace;
  private whitelistAnnouncementNamespace: Namespace;
  private iaoEventScheduleNamespace: Namespace;
  private fractorAssetRedemptionRequestReviewResultNamespace: Namespace;
  private affiliateOffersNamespace: Namespace;

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('Initialize WebSocket');
    this.initNamespace(server);
  }

  initNamespace(server: Server) {
    this.workerNamespace = server.of(SOCKET_NAMESPACE.WORKER);
    this.announcementNamespace = server.of(SOCKET_NAMESPACE.ANNOUNCEMENT);
    this.iaoRequestReviewResultNamespace = server.of(
      SOCKET_NAMESPACE.IAO_REQUEST_REVIEW_RESULT,
    );
    this.iaoEventResultNamespace = server.of(SOCKET_NAMESPACE.IAO_EVENT_RESULT);
    this.adminAnnouncementNamespace = server.of(SOCKET_NAMESPACE.ADMIN_ANNOUNCEMENT);
    this.revenueWithdrawalNamespace = server.of(
      SOCKET_NAMESPACE.REVENUE_WITHDRAWAL,
    );
    this.traderAssetRedemptionRequestReviewResultNamespace = server.of(
      SOCKET_NAMESPACE.TRADER_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT,
    );
    this.whitelistAnnouncementNamespace = server.of(
      SOCKET_NAMESPACE.WHITELIST_ANNOUNCEMENT,
    );
    this.iaoEventScheduleNamespace = server.of(
      SOCKET_NAMESPACE.IAO_EVENT_SCHEDULE,
    );
    this.fractorAssetRedemptionRequestReviewResultNamespace = server.of(
      SOCKET_NAMESPACE.FRACTOR_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT,
    );
    this.affiliateOffersNamespace = server.of(
      SOCKET_NAMESPACE.AFFILIATE_OFFERS,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  sendMessage(event: any, data: any, caller?: string) {
    const room = caller ? `${event}_${caller}` : event;
    this.workerNamespace.emit(room, data);
    this.logger.log(`Send event=${room}, data=${JSON.stringify(data)}`);
  }

  sendNotification(namespace: SOCKET_NAMESPACE, event: any, ...args: any[]) {
    switch (namespace) {
      case SOCKET_NAMESPACE.ANNOUNCEMENT:
        this.announcementNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.ADMIN_ANNOUNCEMENT:
        this.adminAnnouncementNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.IAO_REQUEST_REVIEW_RESULT:
        this.iaoRequestReviewResultNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.IAO_EVENT_RESULT:
        this.iaoEventResultNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.REVENUE_WITHDRAWAL:
        this.revenueWithdrawalNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.TRADER_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT:
        this.traderAssetRedemptionRequestReviewResultNamespace.emit(
          event,
          ...args,
        );
        break;
      case SOCKET_NAMESPACE.WHITELIST_ANNOUNCEMENT:
        this.whitelistAnnouncementNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.IAO_EVENT_SCHEDULE:
        this.iaoEventScheduleNamespace.emit(event, ...args);
        break;
      case SOCKET_NAMESPACE.FRACTOR_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT:
        this.fractorAssetRedemptionRequestReviewResultNamespace.emit(
          event,
          ...args,
        );
        break;
      case SOCKET_NAMESPACE.AFFILIATE_OFFERS:
        this.affiliateOffersNamespace.emit(event, ...args);
        break;
      default:
        break;
    }
    this.logger.log(`Send event=${event}, data=${JSON.stringify(args)}`);
  }
}
