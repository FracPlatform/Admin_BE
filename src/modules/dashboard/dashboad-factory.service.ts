import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboadFactoryService {
  async convertDataExportAffiliateDashboard(data: Array<any>) {
    const exportData = data.map((e, index) => {
      return {
        no: index + 1,
        master: e.id,
        sum: `${parseFloat(e.sum) || '-'}`,
        jan: `${parseFloat(e.jan) || '-'}`,
        feb: `${parseFloat(e.feb) || '-'}`,
        mar: `${parseFloat(e.mar) || '-'}`,
        apr: `${parseFloat(e.apr) || '-'}`,
        may: `${parseFloat(e.may) || '-'}`,
        jun: `${parseFloat(e.jun) || '-'}`,
        jul: `${parseFloat(e.jul) || '-'}`,
        aug: `${parseFloat(e.aug) || '-'}`,
        sep: `${parseFloat(e.sep) || '-'}`,
        oct: `${parseFloat(e.oct) || '-'}`,
        nov: `${parseFloat(e.nov) || '-'}`,
        dec: `${parseFloat(e.dec) || '-'}`,
      };
    });
    return exportData;
  }

  async mapTotalDataAffiliateDashboard(data: Array<any>) {
    const initObj = {};
    data.forEach((item) => {
      Object.keys(item).forEach((e) => {
        if (!['walletAddress', 'id'].includes(e)) {
          if (initObj[e])
            initObj[e] = parseFloat(initObj[e]) + parseFloat(item[e]);
          else initObj[e] = parseFloat(item[e]);
        }
      });
    });
    const row = ['Subtotal'];

    Object.keys(initObj).forEach((e) => {
      row.push(`${parseFloat(initObj[e]) || '-'}`);
    });

    return row;
  }

  async mapTotalDataAffiliateEarning(data: Array<any>) {
    const initObj = {};
    data.forEach((item) => {
      Object.keys(item).forEach((e) => {
        if (!['bdAddress', 'id', 'name'].includes(e)) {
          if (initObj[e])
            initObj[e] = parseFloat(initObj[e]) + parseFloat(item[e]);
          else initObj[e] = parseFloat(item[e]);
        }
      });
    });
    const row = ['Subtotal', ''];
    Object.keys(initObj).forEach((e) => {
      row.push(`${parseFloat(initObj[e]) || '-'}`);
    });

    return row;
  }

  async convertDataExportAffiliateEarning(data: Array<any>) {
    const exportData = data.map((e, index) => {
      return {
        no: index + 1,
        master: e.id,
        name: e.name,
        sum: `${parseFloat(e.sum) || '-'}`,
        jan: `${parseFloat(e.jan) || '-'}`,
        feb: `${parseFloat(e.feb) || '-'}`,
        mar: `${parseFloat(e.mar) || '-'}`,
        apr: `${parseFloat(e.apr) || '-'}`,
        may: `${parseFloat(e.may) || '-'}`,
        jun: `${parseFloat(e.jun) || '-'}`,
        jul: `${parseFloat(e.jul) || '-'}`,
        aug: `${parseFloat(e.aug) || '-'}`,
        sep: `${parseFloat(e.sep) || '-'}`,
        oct: `${parseFloat(e.oct) || '-'}`,
        nov: `${parseFloat(e.nov) || '-'}`,
        dec: `${parseFloat(e.dec) || '-'}`,
      };
    });
    return exportData;
  }
}
