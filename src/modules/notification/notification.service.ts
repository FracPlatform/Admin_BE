import { Injectable } from '@nestjs/common';
import { get } from 'lodash';
import { ListDocument } from 'src/common/common-type';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { FilterNotificationDto } from './dto/notification.dto';
import { DEFAULT_LIMIT, DEFAULT_OFFET } from 'src/common/constants';

@Injectable()
export class NotificationService {
  constructor(private readonly dataService: IDataServices) {}

  async getAll(admin: any, filter: FilterNotificationDto) {    
    const query = { receiver: admin.adminId };
    let total = 0;
    let totalAnnouncement = 0;
    let totalUnread = 0;
    [total, totalAnnouncement, totalUnread] = await Promise.all([
      this.dataService.notification.count(query),
      this.dataService.notification.count({ ...query, type: 1 }),
      this.dataService.notification.count({ ...query, read: false }),
    ]);

    if (filter.hasOwnProperty('read')) {
      query['read'] = filter.read;
      [total, totalAnnouncement] = await Promise.all([
        this.dataService.notification.count(query),
        this.dataService.notification.count({ ...query, type: 1 }),
      ]);
    }

    if (filter.type) {
      query['type'] = filter.type;
    }

    if (filter.hasOwnProperty('deleted')) {
      query['deleted'] = filter.deleted;
    }

    if (filter.hasOwnProperty('hided')) {
      query['hided'] = filter.hided;
    }

    const agg = [];

    agg.push({
      $match: query,
    });

    const dataReturnFilter: any = [
      { $sort: { createdAt: -1 } },
      { $skip: filter.offset || DEFAULT_OFFET },
    ];

    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || DEFAULT_LIMIT });

    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataService.notification.aggregate(agg, {
      collation: { locale: 'en', strength: 1 },
    });

    const response = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      all: total,
      announcement: totalAnnouncement,
      systemMessages: total - totalAnnouncement,
      totalUnread: totalUnread,
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async getDetail(admin: any, notiId: string) {
    return await this.dataService.notification.findOne({
      _id: notiId,
      receiver: admin.adminId,
    });
  }

  async markAsRead(notiId: string, admin: any) {
    await this.dataService.notification.updateOne(
      {
        receiver: admin.adminId,
        _id: notiId,
      },
      { read: true },
    );
    return { success: true };
  }

  async markAllAsRead(admin: any) {
    await this.dataService.notification.updateMany(
      {
        receiver: admin.adminId,
      },
      { read: true },
    );

    return { success: true };
  }
}
