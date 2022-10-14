module.exports = {
  async up(db, client) {
    const counterId = await db.collection('CounterId').find().count();
    if (counterId === 0) {
      await db.collection('CounterId').insertMany([
        {
          _id: 'FRT',
          sequenceValue: 0,
        },
        {
          _id: 'ADM',
          sequenceValue: 0,
        },
        {
          _id: 'AI',
          sequenceValue: 0,
        },
        {
          _id: 'IR',
          sequenceValue: 0,
        },
        {
          _id: 'AT',
          sequenceValue: 0,
        },
        {
          _id: 'NFT',
          sequenceValue: 0,
        },
        {
          _id: 'FNFT',
          sequenceValue: 0,
        },
        {
          _id: 'IE',
          sequenceValue: 0,
        },
        {
          _id: 'AR',
          sequenceValue: 0,
        },
        {
          _id: 'U',
          sequenceValue: 0,
        },
        {
          _id: 'AFF',
          sequenceValue: 0,
        },
        {
          _id: 'TKN',
          sequenceValue: 0,
        },
        {
          _id: 'TP',
          sequenceValue: 0,
        },
      ]);
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
