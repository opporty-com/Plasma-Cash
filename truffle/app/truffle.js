require('babel-register');
require('babel-polyfill');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8546,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "127.0.0.1",
      port: 8545,
      gas:   4700000,
      network_id: 3 // Match any network id
    }
  }
};
