const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  // mongodb+srv:// needs a DNS SRV lookup. Some local resolvers refuse SRV
  // queries ("querySrv ECONNREFUSED"); DNS_SERVERS=8.8.8.8,1.1.1.1 makes Node
  // use those servers instead. Leave it empty to use the system resolver.
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean));
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
