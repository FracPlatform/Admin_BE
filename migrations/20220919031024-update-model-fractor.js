module.exports = {
  async up(db, client) {
    await db.collection('Fractor').updateMany(
      {
        assignedBD: { $exists: false },
      },
      { $set: { assignedBD: '' } },
    );
    await db.collection('Fractor').updateMany(
      {
        iaoFeeRate: { $exists: false },
      },
      { $set: { iaoFeeRate: 0 } },
    );
    await db.collection('Fractor').updateMany(
      {
        tradingFeeProfit: { $exists: false },
      },
      { $set: { tradingFeeProfit: 0 } },
    );
    await db.collection('Fractor').updateMany(
      {
        lastUpdatedBy: { $exists: false },
      },
      { $set: { lastUpdatedBy: '' } },
    );
    await db.collection('Fractor').updateMany(
      {
        deactivatedBy: { $exists: false },
      },
      { $set: { deactivatedBy: '' } },
    );
    await db.collection('Fractor').updateMany(
      {
        deactivetedOn: { $exists: false },
      },
      { $set: { deactivetedOn: null } },
    );
    await db.collection('Fractor').updateMany(
      {
        deactivationComment: { $exists: false },
      },
      { $set: { deactivationComment: '' } },
    );
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
