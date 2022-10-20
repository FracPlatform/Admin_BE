import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, map } from 'rxjs';
import { DownloadOrdersDto } from './dto/dex.dto';

@Injectable()
export class DexAdminService {
  constructor(private http: HttpService) {}

  async downloadIntervalSettings() {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/download-interval-settings`,
        {
          headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
        },
      )
      .pipe(
        map((res) => {
          return res;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async downloadOrders(filter: DownloadOrdersDto) {
    console.log(filter);
  }
}
