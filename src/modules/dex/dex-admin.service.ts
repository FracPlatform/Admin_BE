import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, map } from 'rxjs';
import {
  AddTradingLevelDto,
  EditTradingLevelDto,
  LoginDto,
  OrdersDto,
  TradingLevelDto,
  AddCoinDto,
  CreatePairDto,
  DownloadOrdersDto,
  FilterPairDto,
  GetIntervalSettingDto,
  GetListCoinsDto,
  RemoveFavoriteDto,
  UpdateFavoriteDto,
  UpdatePairDto,
} from './dto/dex.dto';

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
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/download-orders?startDate=${filter.startDate}&endDate=${filter.endDate}&pairId=${filter.pairId}&timezone=${filter.timezone}`,
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

  async orders(filter: OrdersDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/orders?page=${filter.page}&limit=${filter.limit}&startDate=${filter.startDate}&endDate=${filter.endDate}&pairId=${filter.pairId}`,
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

  async getTradingLevel(filter: TradingLevelDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level?page=${filter.page}&limit=${filter.limit}`,
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

  async addTradingLevel(data: AddTradingLevelDto) {
    return this.http
      .post(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level`, data, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
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

  async putTradingLevel(id: string, data: EditTradingLevelDto) {
    return this.http
      .put(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level/${id}`,
        data,
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

  async getTradingLevelIdle() {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level/tier-idle
        `,
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

  async uploadInterval(file) {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('csv', file.buffer, file.originalname);
    return this.http
      .put(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/upload-interval-settings`,
        formData,
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

  async loginWalletAddress(data: LoginDto) {
    return this.http
      .post(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/auth/admin/login-wallet-address
        `,
        data,
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

  async addCoin(file: Express.Multer.File, body: AddCoinDto) {
    return this.http
      .post(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/coins/add-coin`,
        { ...body, file },
        {
          headers: {
            Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
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

  async getListCoins(filter: GetListCoinsDto) {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/coins/list`, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
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

  async getFavorite() {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/favorite`, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
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

  async updateFavorite(body: UpdateFavoriteDto) {
    return this.http
      .put(`${process.env.SPOT_DEX_DOMAIN}/api/v1/favorite`, body, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
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

  async removeFavorite(body: RemoveFavoriteDto) {
    return this.http
      .put(`${process.env.SPOT_DEX_DOMAIN}/api/v1/favorite/remove`, body, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
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

  async createPair(body: CreatePairDto) {
    return this.http
      .post(`${process.env.SPOT_DEX_DOMAIN}/api/v1/pair/create-pair`, body, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
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
  async filterPair(filter: FilterPairDto) {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/pair/filter`, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
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

  async updatePair(pairId: string, updatePair: UpdatePairDto) {
    return this.http
      .put(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/pair/update-pair/${pairId}`,
        updatePair,
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

  async getTradingFee() {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/trading-fee`, {
        headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
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

  async getIntervalSetting(filter: GetIntervalSettingDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/users/get-interval-settings`,
        {
          headers: { Authorization: `Bearer ${process.env.SPOT_DEX_API_KEY}` },
          params: filter,
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
