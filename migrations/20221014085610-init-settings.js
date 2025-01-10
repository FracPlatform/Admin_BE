module.exports = {
  async up(db, client) {
    const counterId = await db.collection('Settings').find().count();
    if (counterId === 0) {
      await db.collection('Settings').insertOne({
        settingsName: 'SETING_DEFAULT',
        affiliate: {
          registrationUrl: 'https://www.example.com',
          resourceUrl: 'https://www.example.com',
          telegramUrl: 'https://www.example.com',
          feedbackUrl: 'https://www.example.com',
        },
        assetItem: {
          maxFile: 4,
          maxSizeOfFile: 10,
        },
        custodianship: {
          maxNFT: 5,
          maxFile: 10,
          maxSizeOfFile: 10,
        },
        iaoRequest: {
          maxItem: 2,
        },
        withdrawalThreshold: {
          fractorMinWithdrawalThreshold: 50,
          affiliateMinWithdrawalThreshold: 50,
        },
        custodianshipLabel: {
          physicalAsset: {
            en: {
              0: 'In custody of Fractor',
              1: 'Frac is reviewing your assets',
              2: 'In custody of Frac',
              3: 'In custody of Frac',
              4: 'Requesting redemption…',
              5: 'Transferring from Frac to the Fractor',
              6: 'In custody of Frac',
              7: 'In custody of Frac',
              8: 'In custody of Frac',
              9: 'In custody of IAO Investor',
            },
            cn: {
              0: '由Fractor保管',
              1: 'Frac正在审查你的资产',
              2: '由Frac保管',
              3: '由Frac保管',
              4: '请求赎回...',
              5: '从Frac到Fractor的转移',
              6: '由Frac保管',
              7: '由Frac保管',
              8: '由Frac保管',
              9: '由IAO投资者保管',
            },
            ja: {
              0: '在资产拥有人的监护下',
              1: 'Fracが資産の審査を行っています',
              2: 'Fracに管理されています',
              3: 'Fracに管理されています',
              4: '交換申請中です',
              5: 'FracからFractorに移行中です',
              6: 'Fracに管理されています',
              7: 'Fracに管理されています',
              8: 'Fracに管理されています',
              9: 'IAO投資者によって管理されています',
            },
            vi: {
              0: 'Tạm giữ bởi Fractor',
              1: 'Frac đang kiểm tra tài sản của bạn',
              2: 'Tạm giữ bởi Frac',
              3: 'Tạm giữ bởi Frac',
              4: 'Đang yêu cầu lấy lại tài sản',
              5: 'Chuyển từ Frac sang Fractor',
              6: 'Tạm giữ bởi Frac',
              7: 'Tạm giữ bởi Frac',
              8: 'Tạm giữ bởi Frac',
              9: 'Tạm giữ bởi Nhà đầu tư IAO',
            },
          },
          digitalAssetForNft: {
            en: {
              0: 'In custody of Fractor',
              1: 'Frac is reviewing your assets',
              2: 'In custody of Frac',
              3: 'Available to redeem',
              6: 'In custody of Frac',
              9: 'In custody of IAO investor',
            },
            cn: {
              0: '由Fractor保管',
              1: 'Frac正在审查你的资产',
              2: '由Frac保管',
              3: '可供赎回',
              6: '由Frac保管',
              9: '由IAO投资者保管',
            },
            ja: {
              0: 'Fractorに管理されています',
              1: 'Fracが資産の審査を行っています',
              2: 'Fracに管理されています',
              3: '交換可能です',
              6: 'Fracに管理されています',
              9: 'IAO投資者によって管理されています',
            },
            vi: {
              0: 'Tạm giữ bởi Fractor',
              1: 'Frac đang kiểm tra tài sản của bạn',
              2: 'Tạm giữ bởi Frac',
              3: 'Có thể lấy lại tài sản',
              6: 'Tạm giữ bởi Frac',
              9: 'Tạm giữ bởi Nhà đầu tư IAO',
            },
          },
          digitalAssetForNonNft: {
            en: {
              0: 'In custody of Fractor',
              1: 'Frac is reviewing your assets',
              2: 'In custody of Frac',
              3: 'In custody of Frac',
              6: 'In custody of Frac',
              9: 'In custody of IAO investor',
            },
            cn: {
              0: '由Fractor保管',
              1: 'Frac正在审查你的资产',
              2: '由Frac保管',
              3: '由Frac保管',
              6: '由Frac保管',
              9: '由IAO投资者保管',
            },
            ja: {
              0: 'Fractorに管理されています',
              1: 'Fracが資産の審査を行っています',
              2: 'Fracに管理されています',
              3: 'Fracに管理されています',
              6: 'Fracに管理されています',
              9: 'IAO投資者によって管理されています',
            },
            vi: {
              0: 'Tạm giữ bởi Fractor',
              1: 'Frac đang kiểm tra tài sản của bạn',
              2: 'Tạm giữ bởi Frac',
              3: 'Tạm giữ bởi Frac',
              6: 'Tạm giữ bởi Frac',
              9: 'Tạm giữ bởi Nhà đầu tư IAO',
            },
          },
        },
        banner: [
          {
            url: '',
            isActive: true,
            hyperlink: '',
          },
          {
            url: '',
            isActive: true,
            hyperlink: '',
          },
          {
            url: '',
            isActive: true,
            hyperlink: '',
          },
          {
            url: '',
            isActive: true,
            hyperlink: '',
          },
          {
            url: '',
            isActive: true,
            hyperlink: '',
          },
        ],
        gasWallet: {
          minThresholdIAO_BSC: 1,
          minThresholdIAO_ETH: 0.5,
          minThresholdDEX: 1,
          mailNotified: [],
        },
      });
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
