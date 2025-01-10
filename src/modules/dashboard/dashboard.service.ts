import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import moment = require('moment');
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  Admin,
  ASSET_STATUS,
  CategoryType,
  CUSTODIANSHIP_STATUS,
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  IAO_EVENT_STAGE,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  IAOEvent,
  NFT_STATUS,
  ON_CHAIN_STATUS,
  REDEMPTION_REQUEST_STATUS,
  REVENUE_STATUS,
  USER_ROLE,
  WITHDRAWAL_REQUEST_STATUS,
  AFFILIATE_WITHDRAWAL_REQUEST_STATUS,
} from 'src/datalayer/model';
import { ApiError } from '../../common/api';
import {
  CVS_NAME,
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  SPOT_DEX_URL,
} from '../../common/constants';
import { Role } from '../auth/role.enum';
import { IaoEventService } from '../iao-event/iao-event.service';
import { DashboadFactoryService } from './dashboad-factory.service';
import { DashboardDTO } from './dashboard.dto';
import {
  BdOfAffiliateChartDto,
  BdOfAffiliateDashboardDto,
  BdOfAffiliateEarningDto,
  ExportBdOfAffiliateDashboardDto,
  ExportBdOfAffiliateEarningDto,
  SORT_TYPE,
} from './dto/bd-of-affiliate.dto';
import { Utils } from 'src/common/utils';
const XLSX = require('xlsx');

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoEventService: IaoEventService,
    private readonly dashboardBuilder: DashboadFactoryService,
  ) {}

  async getPendingTasks() {
    const iaoRequestPreliminary = await this.dataService.iaoRequest.count({
      status: IAO_REQUEST_STATUS.IN_REVIEW,
    });

    const iaoRequestFinalReview = await this.dataService.iaoRequest.count({
      status: IAO_REQUEST_STATUS.APPROVED_A,
    });

    const assetTransferCustodianship = await this.dataService.asset.count({
      'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR,
      deleted: false,
    });

    const assetReviewCustodianship = await this.dataService.asset.count({
      'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR_TO_FRAC_OR_IN_REVIEW,
      deleted: false,
    });

    const assetDraftNewNFT = await this.dataService.asset.count({
      status: ASSET_STATUS.IAO_APPROVED,
      'custodianship.status': CUSTODIANSHIP_STATUS.FRAC,
    });

    const nftMint = await this.dataService.nft.count({
      status: NFT_STATUS.DRAFT,
      deleted: false,
    });

    const agg = [
      {
        $match: {
          status: F_NFT_STATUS.ACTIVE,
          deleted: false,
          mintedStatus: F_NFT_MINTED_STATUS.MINTED,
        },
      },
      {
        $lookup: {
          from: IAOEvent.name,
          let: { fnftContractAddress: '$contractAddress' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$FNFTcontractAddress', '$$fnftContractAddress'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                isDeleted: 1,
              },
            },
          ],
          as: 'iaoEvents',
        },
      },
      {
        $addFields: {
          iaoEvent: { $arrayElemAt: ['$iaoEvents', 0] },
        },
      },
      {
        $match: {
          $or: [
            { iaoEvent: { $exists: false } },
            { iaoEvent: { $exists: true }, 'iaoEvent.isDeleted': true },
          ],
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ];
    const fnft = await this.dataService.fnft.aggregate(agg);

    const IAOeventCreateOnChain = await this.dataService.iaoEvent.count({
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
      isDeleted: false,
    });

    const RedeemAdminReview = await this.dataService.redemptionRequest.count({
      status: REDEMPTION_REQUEST_STATUS.IN_REVIEW,
    });

    const RedeemAdminConfirm = await this.dataService.redemptionRequest.count({
      status: REDEMPTION_REQUEST_STATUS.PROCESSING,
    });

    const fractorWithdrawalRequestInReview =
      await this.dataService.withdrawalRequest.count({
        status: WITHDRAWAL_REQUEST_STATUS.IN_REVIEW,
      });

    const affiliateWithdrawalRequestInReview =
      await this.dataService.userWithdrawalRequest.count({
        status: AFFILIATE_WITHDRAWAL_REQUEST_STATUS.IN_REVIEW,
      });

    return {
      iaoRequestPreliminary,
      iaoRequestFinalReview,
      assetTransferCustodianship,
      assetReviewCustodianship,
      assetDraftNewNFT,
      nftMint,
      FNFTCreateIAOEvent: fnft?.[0]?.count,
      IAOeventCreateOnChain,
      RedeemAdminReview,
      RedeemAdminConfirm,
      fractorWithdrawalRequestInReview,
      affiliateWithdrawalRequestInReview,
    };
  }

  async getOverview(dashboardDTO: DashboardDTO) {
    let succeeded = 0,
      faild = 0,
      onGoing = 0,
      totalIaoEvent = 0;
    const iaoEventSuccess = [];

    const query = { isDeleted: false };
    if (dashboardDTO.dateFrom && dashboardDTO.dateTo)
      query['createdAt'] = {
        $gte: dashboardDTO.dateFrom,
        $lte: dashboardDTO.dateTo,
      };

    const iaoEventList = await this.dataService.iaoEvent.findMany(query, {
      registrationStartTime: 1,
      registrationEndTime: 1,
      participationStartTime: 1,
      participationEndTime: 1,
      vaultType: 1,
      totalSupply: 1,
      availableSupply: 1,
      vaultUnlockThreshold: 1,
      revenue: 1,
      exchangeRate: 1,
      status: 1,
      acceptedCurrencyAddress: 1,
    });
    iaoEventList.forEach((iaoEvent) => {
      const currentStage = this.iaoEventService.checkCurrentStage(
        iaoEvent.registrationStartTime,
        iaoEvent.registrationEndTime,
        iaoEvent.participationStartTime,
        iaoEvent.participationEndTime,
        iaoEvent.vaultType,
        iaoEvent.totalSupply - iaoEvent.availableSupply >=
          (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
      );
      // succeeded
      if (
        iaoEvent?.revenue?.status === REVENUE_STATUS.APPROVED &&
        currentStage === IAO_EVENT_STAGE.COMPLETED &&
        iaoEvent.status === IAO_EVENT_STATUS.ACTIVE
      ) {
        iaoEventSuccess.push(iaoEvent);
        succeeded += 1;
      }
      //faild
      else if (
        currentStage === IAO_EVENT_STAGE.FAILED ||
        (currentStage === IAO_EVENT_STAGE.COMPLETED &&
          iaoEvent?.revenue?.status === REVENUE_STATUS.REJECTED) ||
        iaoEvent.status === IAO_EVENT_STATUS.INACTIVE
      ) {
        faild += 1;
      }
      // ongoing
      else if (
        currentStage < IAO_EVENT_STAGE.COMPLETED ||
        (currentStage === IAO_EVENT_STAGE.COMPLETED &&
          iaoEvent?.revenue?.status < REVENUE_STATUS.APPROVED &&
          IAO_EVENT_STATUS.ACTIVE)
      ) {
        onGoing += 1;
      }
    });
    totalIaoEvent = succeeded + faild + onGoing;

    let totalGrossRevenueUSD = 0;
    let totalPlatformGrossCommission = 0;
    let totalFractorRevenue = 0;
    const contractList = iaoEventSuccess.map(
      (iao) => iao.acceptedCurrencyAddress,
    );
    const onlyContractList = contractList.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const data = await this.getExchangeRateInUsd(onlyContractList);

    iaoEventSuccess.forEach((iao) => {
      const soldAmount = iao.totalSupply - iao.availableSupply;
      const grossRevenue = soldAmount * iao.exchangeRate;
      const exchangeRateUSD =
        data[iao.acceptedCurrencyAddress.toLowerCase()]?.exchangeRate || 0;
      const grossRevenueUSD = exchangeRateUSD * grossRevenue;
      totalGrossRevenueUSD += grossRevenueUSD;
      totalPlatformGrossCommission +=
        (grossRevenueUSD * iao?.revenue.platformCommissionRate) / 100 || 0;
    });
    totalFractorRevenue = totalGrossRevenueUSD - totalPlatformGrossCommission;

    return {
      grossRevenue: totalGrossRevenueUSD,
      platformGrossCommission: totalPlatformGrossCommission,
      fractorRevenue: totalFractorRevenue,
      iaoEvent: { totalIaoEvent, succeeded, faild, onGoing },
    };
  }

  async getExchangeRateInUsd(listAddress: string[]) {
    listAddress = [...new Set(listAddress)];

    const results = await this.dataService.exchangeRate.findMany(
      { contractAddress: { $in: listAddress.map((a) => a.toLowerCase()) } },
      { _id: 0, contractAddress: 1, exchangeRate: 1 },
    );

    return results.reduce(function (dictionary, next) {
      dictionary[next['contractAddress']] = {
        exchangeRate: next['exchangeRate'],
      };
      return dictionary;
    }, {});
  }

  async getStatistics(dashboardDTO: DashboardDTO) {
    const query = {};
    const queryAsset = {
      status: {
        $in: [
          ASSET_STATUS.FRACTIONALIZED,
          ASSET_STATUS.IAO_EVENT,
          ASSET_STATUS.EXCHANGE,
          ASSET_STATUS.REDEEMED,
        ],
      },
      deleted: false,
    };
    if (dashboardDTO.dateFrom && dashboardDTO.dateTo) {
      queryAsset['createdAt'] = {
        $gte: dashboardDTO.dateFrom,
        $lte: dashboardDTO.dateTo,
      };
      query['createdAt'] = {
        $gte: dashboardDTO.dateFrom,
        $lte: dashboardDTO.dateTo,
      };
    }

    const asset = await this.dataService.asset.findMany(
      {
        ...queryAsset,
      },
      { category: 1 },
    );

    const totalAsset = asset.length;
    const totalPhysicalAsset = asset.filter(
      (item) => item.category === CategoryType.PHYSICAL,
    ).length;
    const totalDigitalAsset = totalAsset - totalPhysicalAsset;
    const totalFractor = await this.dataService.fractor.count(query);
    const totalAffiliate = await this.dataService.user.count({
      role: {
        $in: [
          USER_ROLE.MASTER_AFFILIATE,
          USER_ROLE.AFFILIATE_SUB_1,
          USER_ROLE.AFFILIATE_SUB_2,
        ],
      },
      ...query,
    });
    const totalTrader = await this.dataService.user.count({
      role: USER_ROLE.NORMAL,
      ...query,
    });
    const totalIAORequest = await this.dataService.iaoRequest.count(query);
    const totalItem = await this.dataService.asset.count({
      ...query,
      deleted: false,
    });
    const totalNFT = await this.dataService.nft.count({
      ...query,
      deleted: false,
    });
    const totalFNFT = await this.dataService.fnft.count({
      ...query,
      deleted: false,
      mintedStatus: 1,
    });
    let listPair = [];
    try {
      const {
        data: { data: _listPair },
      } = await axios.get(
        `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.LIST_PAIR}`,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      );
      if (_listPair) listPair = _listPair;
    } catch (error) {
      this.logger.error('Cannot get trading pairs from DEX');
    }

    return {
      totalAsset,
      totalPhysicalAsset,
      totalDigitalAsset,
      general: {
        totalFractor,
        totalAffiliate,
        totalTrader,
        totalIAORequest,
        totalItem,
        totalNFT,
        totalFNFT,
        tradingPairs: listPair?.length || 0,
      },
    };
  }

  async getDashboadOfBDAffiliate(
    admin: Admin,
    filter: BdOfAffiliateDashboardDto,
  ) {
    let bdAddress;

    if (
      [
        Role.OWNER,
        Role.SuperAdmin,
        Role.OperationAdmin,
        Role.HeadOfBD,
      ].includes(admin.role) &&
      !filter.bdAddress
    ) {
      throw ApiError('', 'bdAddress is require.');
    }

    if (
      [
        Role.OWNER,
        Role.SuperAdmin,
        Role.OperationAdmin,
        Role.HeadOfBD,
      ].includes(admin.role)
    ) {
      bdAddress = filter.bdAddress;
    } else {
      bdAddress = admin.walletAddress;
    }

    const bodyRequest = {
      orderBy: filter.sortType || 'DESC',
      year: filter.year,
    };

    // if (filter.masterId) {
    //   const listWallet = await this._getBDWalletById(
    //     filter.masterId,
    //     bdAddress,
    //   );
    //   if (listWallet.length > 0) {
    //     bodyRequest['address'] = listWallet;
    //   } else {
    //     return {
    //       totalDocs: 0,
    //       docs: [],
    //     };
    //   }
    // }

    const {
      data: { data: dashboard, metadata: metadata },
    } = await axios.post(
      `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.AFFILIATE_FEE}/${bdAddress}`,
      bodyRequest,
      {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      },
    );

    const listIdMapWallet = await this._mapWalletAddressToId(dashboard);
    if (listIdMapWallet.length === 0) {
      return {
        totalDocs: 0,
        docs: [],
      };
    }

    let res = dashboard.map((e) => {
      const record = listIdMapWallet.find(
        (wallet) => wallet.walletAddress === e.walletAddress,
      );
      return {
        ...e,
        id: record.userId,
      };
    });

    if (filter.masterId) {
      res = res.filter(
        (e) => e.id.search(new RegExp(filter.masterId, 'i')) !== -1,
      );
    }

    const sortValue = filter.sortType || 'DESC';

    res = res.sort((n1, n2) => {
      if (parseFloat(n1['sum']) > parseFloat(n2['sum'])) {
        return sortValue === SORT_TYPE.DESC ? -1 : 1;
      }
      if (parseFloat(n1['sum']) < parseFloat(n2['sum'])) {
        return sortValue === SORT_TYPE.DESC ? 1 : -1;
      }
      return 0;
    });

    const offset = filter.offset ? filter.offset : DEFAULT_OFFET;

    const limit = offset + (filter.limit || DEFAULT_LIMIT);

    res = res.slice(offset, limit);

    return {
      totalDocs: metadata.totalItem,
      docs: res,
    };
  }

  async exportDashboadOfBDAffiliate(
    admin: Admin,
    filter: ExportBdOfAffiliateDashboardDto,
    res: any,
  ) {
    let bdAddress;

    if (
      [
        Role.OWNER,
        Role.SuperAdmin,
        Role.OperationAdmin,
        Role.HeadOfBD,
      ].includes(admin.role) &&
      !filter.bdAddress
    ) {
      throw ApiError('', 'bdAddress is require.');
    }

    if (
      [
        Role.OWNER,
        Role.SuperAdmin,
        Role.OperationAdmin,
        Role.HeadOfBD,
      ].includes(admin.role)
    ) {
      bdAddress = filter.bdAddress;
    } else {
      bdAddress = admin.walletAddress;
    }

    const bodyRequest = {
      orderBy: filter.sortType || 'DESC',
      year: filter.year,
    };
    let dataMap = [];
    const flagExportData = true;
    // if (filter.masterId) {
    //   const listWallet = await this._getBDWalletById(
    //     filter.masterId,
    //     bdAddress,
    //   );
    //   if (listWallet.length > 0) {
    //     bodyRequest['address'] = listWallet;
    //   } else {
    //     flagExportData = false;
    //   }
    // }

    if (flagExportData) {
      const {
        data: { data: dashboard },
      } = await axios.post(
        `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.AFFILIATE_FEE}/${bdAddress}`,
        bodyRequest,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      );

      const listIdMapWallet = await this._mapWalletAddressToId(dashboard);

      dataMap = dashboard.map((e) => {
        const record = listIdMapWallet.find(
          (wallet) => wallet.walletAddress === e.walletAddress,
        );
        return {
          ...e,
          id: record?.userId || null,
        };
      });

      if (filter.masterId) {
        dataMap = dataMap.filter(
          (e) => e.id.search(new RegExp(filter.masterId, 'i')) !== -1,
        );
      }

      const sortValue = filter.sortType || 'DESC';

      dataMap = dataMap.sort((n1, n2) => {
        if (parseFloat(n1['sum']) > parseFloat(n2['sum'])) {
          return sortValue === SORT_TYPE.DESC ? -1 : 1;
        }
        if (parseFloat(n1['sum']) < parseFloat(n2['sum'])) {
          return sortValue === SORT_TYPE.DESC ? 1 : -1;
        }
        return 0;
      });
    }

    const headings = [
      [
        'No.',
        'Master',
        `Total ${filter.year}`,
        `Jan ${filter.year}`,
        `Feb ${filter.year}`,
        `Mar ${filter.year}`,
        `Apr ${filter.year}`,
        `May ${filter.year}`,
        `Jun ${filter.year}`,
        `Jul ${filter.year}`,
        `Aug ${filter.year}`,
        `Sep ${filter.year}`,
        `Oct ${filter.year}`,
        `Nov ${filter.year}`,
        `Dec ${filter.year}`,
      ],
    ];

    const dataConvert =
      await this.dashboardBuilder.convertDataExportAffiliateDashboard(dataMap);

    const dataTotalDashboard =
      await this.dashboardBuilder.mapTotalDataAffiliateDashboard(dataMap);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataConvert, {
      origin: 'A4',
      skipHeader: true,
      header: [
        'no',
        'master',
        'sum',
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ],
    });
    XLSX.utils.sheet_add_aoa(ws, [['Trading Fee from the Master']], {
      origin: 'B1',
    });
    XLSX.utils.sheet_add_aoa(ws, [dataTotalDashboard], {
      origin: 'B2',
    });
    XLSX.utils.sheet_add_aoa(ws, headings, { origin: 'A3' });
    XLSX.utils.book_append_sheet(wb, ws);
    const buffer = XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
    res.attachment(
      `${CVS_NAME.AFFILIATE_DASHBOARD}${moment().format('DDMMYY')}.csv`,
    );
    return res.status(200).send(buffer);
  }

  async getChartOfBDAffiliate(admin: Admin, filter: BdOfAffiliateChartDto) {
    let bdAddress;

    if (
      [Role.OWNER, Role.SuperAdmin, Role.OperationAdmin, Role.HeadOfBD] &&
      !filter.bdAddress
    ) {
      throw ApiError('', 'bdAddress is require.');
    }

    if ([Role.OWNER, Role.SuperAdmin, Role.OperationAdmin, Role.HeadOfBD]) {
      bdAddress = filter.bdAddress;
    } else {
      bdAddress = admin.walletAddress;
    }

    const params = {
      year: filter.year,
    };

    const {
      data: { data: dashboard },
    } = await axios.get(
      `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.CHART_AFFILIATE_FEE}/${bdAddress}`,
      {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        params: params,
      },
    );
    const listIdMapWallet = await this._mapWalletAddressToIdInchart(
      dashboard.affiliate,
    );

    const res = dashboard;
    res.affiliate = dashboard.affiliate.map((e) => {
      const record = listIdMapWallet.find(
        (wallet) => wallet.walletAddress === e.userAddress,
      );
      return {
        ...e,
        id: record.userId,
      };
    });
    return res;
  }

  private async _getBDWalletById(id: string, bdAddress: string) {
    const admin = await this.dataService.admin.findOne({
      walletAddress: Utils.queryInsensitive(bdAddress),
      deleted: false,
    });

    const res = await this.dataService.user.findMany(
      {
        userId: { $regex: id, $options: 'i' },
        bd: admin.adminId,
      },
      {
        walletAddress: 1,
      },
    );

    const listWallet = res.map((e) => e.walletAddress);

    return listWallet;
  }

  private async _mapWalletAddressToId(data: Array<any>) {
    const listWallet = data
      .filter((e) => e)
      .map((e) => {
        if (e.walletAddress) return e.walletAddress;
      });
    if (listWallet.length === 0) {
      return [];
    }
    const users = await this.dataService.user.findMany(
      {
        walletAddress: { $in: listWallet },
      },
      {
        _id: 0,
        walletAddress: 1,
        userId: 1,
      },
    );
    return users;
  }

  private async _mapWalletAddressToIdInchart(data: Array<any>) {
    const listWallet = data
      .filter((e) => e)
      .map((e) => {
        if (e.userAddress) return e.userAddress;
      });
    const users = await this.dataService.user.findMany(
      {
        walletAddress: { $in: listWallet },
      },
      {
        _id: 0,
        walletAddress: 1,
        userId: 1,
      },
    );
    return users;
  }

  private async _mapWalletAddressToBdIdInchart(data: Array<any>) {
    const listWallet = data
      .filter((e) => e)
      .map((e) => {
        if (e.bdAddress) return e.bdAddress;
      });
    const admins = await this.dataService.admin.findMany(
      {
        walletAddress: { $in: listWallet },
      },
      {
        _id: 0,
        walletAddress: 1,
        adminId: 1,
        fullname: 1,
      },
    );
    return admins;
  }

  async getEarningOfBDAffiliate(filter: BdOfAffiliateEarningDto) {
    const bodyRequest = {
      orderBy: filter.sortType || 'DESC',
      year: filter.year,
    };
    let countResult = 0;
    if (filter.keyword) {
      const bdIds = await this._getBDWalletByIdOrName(filter.keyword);
      bodyRequest['bdAddress'] = bdIds;
      countResult = bdIds.length;
    } else {
      const admins = await this.dataService.admin.findMany({
        role: Role.MasterBD,
        deleted: false,
      });

      const ids = admins.map((e) => e.walletAddress);
      bodyRequest['bdAddress'] = ids;
      countResult = admins.length;
    }

    const {
      data: { data: dashboard },
    } = await axios.post(
      `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.BD_EARNING}`,
      bodyRequest,
      {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      },
    );
    const listIdMapWallet = await this._mapWalletAddressToBdIdInchart(
      dashboard,
    );
    let res = dashboard
      .filter((e) => e.bdAddress)
      .map((e) => {
        const record = listIdMapWallet.find(
          (wallet) => wallet.walletAddress === e.bdAddress,
        );
        return {
          ...e,
          id: record.adminId,
          name: record.fullname,
        };
      });

    const sortValue = filter.sortType || 'DESC';

    res = res.sort((n1, n2) => {
      if (parseFloat(n1['sum']) > parseFloat(n2['sum'])) {
        return sortValue === SORT_TYPE.DESC ? -1 : 1;
      }
      if (parseFloat(n1['sum']) < parseFloat(n2['sum'])) {
        return sortValue === SORT_TYPE.DESC ? 1 : -1;
      }
      return 0;
    });

    const offset = filter.offset ? filter.offset : DEFAULT_OFFET;

    const limit = offset + (filter.limit || DEFAULT_LIMIT);

    res = res.slice(offset, limit);

    return {
      totalDocs: countResult,
      docs: res,
    };
  }

  async exportEarningOfBDAffiliate(
    filter: ExportBdOfAffiliateEarningDto,
    res: any,
  ) {
    const bodyRequest = {
      orderBy: filter.sortType || 'DESC',
      year: filter.year,
    };
    if (filter.keyword) {
      const bdIds = await this._getBDWalletByIdOrName(filter.keyword);
      bodyRequest['bdAddress'] = bdIds;
    } else {
      const admins = await this.dataService.admin.findMany({
        role: Role.MasterBD,
        deleted: false,
      });
      const ids = admins.map((e) => e.walletAddress);
      bodyRequest['bdAddress'] = ids;
    }
    const {
      data: { data: dashboard },
    } = await axios.post(
      `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.BD_EARNING}`,
      bodyRequest,
      {
        headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
      },
    );
    const listIdMapWallet = await this._mapWalletAddressToBdIdInchart(
      dashboard,
    );
    const dataMap = dashboard
      .filter((e) => e.bdAddress)
      .map((e) => {
        const record = listIdMapWallet.find(
          (wallet) => wallet.walletAddress === e.bdAddress,
        );
        return {
          ...e,
          id: record.adminId,
          name: record.fullname,
        };
      });

    const headings = [
      [
        'No.',
        'ID',
        'BD of Affiliate',
        `Total ${filter.year}`,
        `Jan ${filter.year}`,
        `Feb ${filter.year}`,
        `Mar ${filter.year}`,
        `Apr ${filter.year}`,
        `May ${filter.year}`,
        `Jun ${filter.year}`,
        `Jul ${filter.year}`,
        `Aug ${filter.year}`,
        `Sep ${filter.year}`,
        `Oct ${filter.year}`,
        `Nov ${filter.year}`,
        `Dec ${filter.year}`,
      ],
    ];

    const dataConvert =
      await this.dashboardBuilder.convertDataExportAffiliateEarning(dataMap);

    const dataTotalDashboard =
      await this.dashboardBuilder.mapTotalDataAffiliateEarning(dataMap);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataConvert, {
      origin: 'A4',
      skipHeader: true,
      header: [
        'no',
        'master',
        'name',
        'sum',
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ],
    });
    XLSX.utils.sheet_add_aoa(ws, [['Earnings of Affiliate BD']], {
      origin: 'B1',
    });
    XLSX.utils.sheet_add_aoa(ws, [dataTotalDashboard], {
      origin: 'B2',
    });
    XLSX.utils.sheet_add_aoa(ws, headings, { origin: 'A3' });
    XLSX.utils.book_append_sheet(wb, ws);
    const buffer = XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
    res.attachment(
      `${CVS_NAME.AFFILIATE_EARNING}${moment().format('DDMMYY')}.csv`,
    );
    return res.status(200).send(buffer);
  }

  private async _getBDWalletByIdOrName(keyword: string) {
    const res = await this.dataService.admin.findMany(
      {
        $or: [
          { adminId: { $regex: keyword, $options: 'i' } },
          { fullname: { $regex: keyword, $options: 'i' } },
        ],
        deleted: false,
        role: Role.MasterBD,
      },
      {
        walletAddress: 1,
      },
    );

    const listWallet = res.map((e) => e.walletAddress);

    return listWallet;
  }
}
