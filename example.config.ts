import { NetworksUserConfig } from 'hardhat/types';

export const networks: NetworksUserConfig = {
  testnet: {
    consensusNodes: [
      {
        url: '0.testnet.hedera.com:50211',
        nodeId: '0.0.5',
      },
    ],
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    chainId: 293,
    accounts: [
      // @ts-ignore
      {
        account: '',
        privateKey: '',
      },
    ],
  },
};
