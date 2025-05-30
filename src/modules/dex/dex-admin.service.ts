import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, map } from 'rxjs';
import {
  AddTradingLevelDto,
  EditTradingLevelDto,
  LoginDexDto,
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
  GetCollectedFeeDto,
  DownloadCollectedFeeDto,
  GetIntervalSettingsDto,
  GetTradeDto,
  DownloadTradeDto,
  GetTiersDto,
  CreateTiersDto,
  DeletePairDto,
} from './dto/dex.dto';
const FormData = require('form-data');

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
          return res.data;
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
          return res.data;
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
          return res.data;
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
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trading-level?page=${
          filter.page || 1
        }&limit=${filter.limit || 20}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      )
      .pipe(
        map((res) => {
          return res.data;
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
          return res.data;
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
          return res.data;
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
          return res.data;
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
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async uploadInterval(file) {
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
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async loginWalletAddress(data: LoginDexDto) {
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
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async addCoin(file: Express.Multer.File, body: AddCoinDto) {
    const formData = new FormData();
    Object.keys(body).forEach((key) => {
      formData.append(key, body[key]);
    });
    formData.append('file', file.buffer, file.originalname);
    console.log("process.env.SPOT_DEX_DOMAIN", process.env.SPOT_DEX_DOMAIN);
    
    return this.http
      .post(`${process.env.SPOT_DEX_DOMAIN}/api/v1/coins/add-coin`, formData, {
        headers: {
          'API-Key': `${process.env.SPOT_DEX_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
      })
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
      })
      .pipe(
        map((res) => {
          return res.data;
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
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      )
      .pipe(
        map((res) => {
          return res.data;
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
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
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
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
          params: filter,
        },
      )
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async deletePair(id: string, data: DeletePairDto) {
    return this.http
      .put(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/pair/${id}`, data, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async getCollectedFee(filter: GetCollectedFeeDto) {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/collected-fees`, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async downloadCollectedFee(filter: DownloadCollectedFeeDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/collected-fees/download-csv`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
          params: filter,
        },
      )
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async getIntervalSettings(filter: GetIntervalSettingsDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/users/get-interval-settings`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
          params: filter,
        },
      )
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async getTrades(filter: GetTradeDto) {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/trades`, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async downloadTrades(filter: DownloadTradeDto) {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/download-trades`, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        params: filter,
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async getTiers(filter: GetTiersDto) {
    return this.http
      .get(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/tiers?page=${
          filter.page || 1
        }&limit=${filter.limit || 20}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      )
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async createTier(file, data: CreateTiersDto) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    formData.append('file', file.buffer, file.originalname);
    return this.http
      .post(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/tiers`, formData, {
        headers: {
          'API-Key': `${process.env.SPOT_DEX_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async getTierDetail(id: string) {
    return this.http
      .get(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/tiers/${id}`, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async updateTier(id: string, file, data: CreateTiersDto) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    if (file) {
      formData.append('file', file.buffer, file.originalname);
    }

    return this.http
      .put(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/tiers/${id}`,
        formData,
        {
          headers: {
            'API-Key': `${process.env.SPOT_DEX_API_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }

  async deleteTier(id: string) {
    return this.http
      .delete(`${process.env.SPOT_DEX_DOMAIN}/api/v1/admin/tiers/${id}`, {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError((e) => {
          throw e;
        }),
      );
  }
}
