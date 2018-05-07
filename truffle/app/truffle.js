require('babel-register');
require('babel-polyfill');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: process.env.HOST || "localhost",
      port: 8545,
      network_id: 58546,
      gas: 4712388, // Gas limit used for deploys
      from: "0x4DC884abB17d11DE6102fC1ef2ceE0EbD31DF248",
      //gasPrice: 21000000000000000000
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
};