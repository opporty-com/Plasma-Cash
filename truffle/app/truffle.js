require('babel-register');
require('babel-polyfill');


const Web3 = require('web3');
const provider = new Web3.providers.WebsocketProvider(process.env.ETH_NODE);

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    compilers: {
        solc: {
            version: "0.4.24",
            optimizer: {enabled: true, runs: 200}
        }
    },
    networks: {
        development: {
            host: process.env.HOST || "127.0.0.1",
            port: 8545,
            from: "2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70",
            network_id: '*' // Match any network id
        },
        test: {
            host: "localhost",
            port: 8546,
            network_id: "*"
        },
        ropsten: {
            provider,
            from: process.env.ETH_FROM,
            // gas: 8000029,
            // gas: 8000029,
            // // gas: 4500000,
            // gasPrice: 10000000000,
            network_id: 3, // Match any network id
            websockets: true,
            confirmations: 2, // # of confs to wait between deployments. (default: 0)
            skipDryRun: true
        },
        rinkeby: {
            provider,
            from: process.env.ETH_FROM,
            // gas: 8000029,
            // gas: 8000029,
            // // gas: 4500000,
            // gasPrice: 10000000000,
            network_id: 4, // Match any network id
            websockets: true,
            confirmations: 2, // # of confs to wait between deployments. (default: 0)
            skipDryRun: true
        }
    }
};
