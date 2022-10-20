import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, map } from 'rxjs';
import {
  AddTradingLevelDto,
  DownloadOrdersDto,
  EditTradingLevelDto,
  LoginDto,
  OrdersDto,
  TradingLevelDto,
} from './dto/dex.dto';

@Injectable()
export class DexAdminService {
  constructor(private http: HttpService) {}

  async downloadIntervalSettings() {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/download-interval-settings`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/download-orders?startDate=${filter.startDate}&endDate=${filter.endDate}&pairId=${filter.pairId}&timezone=${filter.timezone}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async orders(filter: OrdersDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/orders?page=${filter.page}&limit=${filter.limit}&startDate=${filter.startDate}&endDate=${filter.endDate}&pairId=${filter.pairId}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async getTradingLevel(filter: TradingLevelDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level?page=${filter.page}&limit=${filter.limit}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async addTradingLevel(data: AddTradingLevelDto) {
    return this.http
      .post(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level`, data, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
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

  async deleteTradingLevel(id: string) {
    return this.http
      .delete(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level/${id}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async putTradingLevel(id: string, data: EditTradingLevelDto) {
    return this.http
      .put(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level/${id}`,
        data,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async getTradingLevelIdle() {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level/tier-idle
        `,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async uploadInterval(file) {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('csv', file.buffer, file.originalname);
    return this.http
      .put(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/upload-interval-settings`,
        formData,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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

  async loginWalletAddress(data: LoginDto) {
    return this.http
      .post(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/auth/admin/login-wallet-address
        `,
        data,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
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
}
