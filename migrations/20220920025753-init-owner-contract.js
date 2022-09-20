module.exports = {
  async up(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const owner = await db.collection('Admin').findOne({
          walletAddress: '0xF6cB6af484Be07c63708c0e69dc14162BE177D0C',
        });
        if (!owner) {
          const prefix = await db
            .collection('CounterId')
            .findOneAndUpdate(
              { _id: 'A' },
              { $inc: { sequenceValue: 1 } },
              { new: true },
            );
          const prefixId = `A-${prefix.value.sequenceValue}`;
          await db.collection('Admin').insertOne({
            email: '',
            fullname: 'Owner',
            description: '',
            walletAddress: '0xF6cB6af484Be07c63708c0e69dc14162BE177D0C',
            role: 100,
            status: 1,
            referral: '',
            createBy: '',
            lastUpdateBy: '',
            adminId: prefixId,
            deleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
