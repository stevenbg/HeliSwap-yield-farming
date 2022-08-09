import '@nomicfoundation/hardhat-toolbox';
require('@hashgraph/hardhat-hethers');
import * as config from './config';

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.5.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: 'testnet',
  hedera: {
    networks: config.networks,
    gasLimit: 2_000_000,
  },
};

export default config;
