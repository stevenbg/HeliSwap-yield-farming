import '@nomicfoundation/hardhat-toolbox';
require('@hashgraph/hardhat-hethers');
import { task } from 'hardhat/config';
import * as config from './config';

task('deploy', 'Deploys an YF contract')
  .addParam('owner', 'Campaign owner')
  .addParam('stakingtoken', 'Staking token address')
  .setAction(async taskArgs => {
    const { owner, stakingtoken } = taskArgs;

    const campaignDeployment = require('./scripts/deploy');

    await campaignDeployment(owner, stakingtoken);
  });

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
