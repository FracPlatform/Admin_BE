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
          minWithdrawalThreshold: 50,
        },
        custodianshipLabel: {
          physicalAsset: {
            en: {
              0: 'In custody of the Fractor',
              1: 'Frac is reviewing your assets',
              2: 'In custody of Frac',
              3: 'In custody of Frac',
              4: 'Requesting redemption…',
              5: 'Transferring from Frac to the Fractor',
              6: 'In custody of Frac',
              7: 'In custody of Frac',
              8: 'In custody of Frac',
              9: 'In custody of IAO investor',
            },
            cn: {
              0: 'Step 0',
              1: 'Step 1',
              2: 'Step 2',
              3: 'Step 3',
              4: 'Step 4',
              5: 'Step 5',
              6: 'Step 6',
              7: 'Step 7',
              8: 'Step 8',
              9: 'Step 9',
            },
            ja: {
              0: 'Step 0',
              1: 'Step 1',
              2: 'Step 2',
              3: 'Step 3',
              4: 'Step 4',
              5: 'Step 5',
              6: 'Step 6',
              7: 'Step 7',
              8: 'Step 8',
              9: 'Step 9',
            },
          },
          digitalAssetForNft: {
            en: {
              0: 'In custody of the Fractor',
              1: 'Frac is reviewing your assets',
              2: 'In custody of Frac',
              3: 'Available to redeem',
              6: 'In custody of Frac',
              9: 'In custody of IAO investor',
            },
            cn: {
              0: 'Step 0',
              1: 'Step 1',
              2: 'Step 2',
              3: 'Step 3',
              6: 'Step 4',
              9: 'Step 5',
            },
            ja: {
              0: 'Step 0',
              1: 'Step 1',
              2: 'Step 2',
              3: 'Step 3',
              6: 'Step 4',
              9: 'Step 5',
            },
          },
          digitalAssetForNonNft: {
            en: {
              0: 'In custody of the Fractor',
              1: 'Frac is reviewing your assets',
              2: 'In custody of Frac',
              3: 'In custody of Frac',
              6: 'In custody of Frac',
              9: 'In custody of IAO investor',
            },
            cn: {
              0: 'Step 0',
              1: 'Step 1',
              2: 'Step 2',
              3: 'Step 3',
              6: 'Step 4',
              9: 'Step 5',
            },
            ja: {
              0: 'Step 0',
              1: 'Step 1',
              2: 'Step 2',
              3: 'Step 3',
              6: 'Step 4',
              9: 'Step 5',
            },
          },
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
