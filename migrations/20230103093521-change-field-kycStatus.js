module.exports = {
  async up(db, client) {
    await db.collection('Fractor').updateMany(
      {
        kycStatus: { $exists: true },
      },
      { $set: { kycStatus: 0 } },
    );
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
