import { task } from 'hardhat/config';
import * as config from './config';
import '@nomiclabs/hardhat-waffle';

require('@hashgraph/hardhat-hethers'); // UNCOMMENT WHEN EXECUTING SCRIPTS; COMMENT WHEN RUNNING TESTS

task('deployFactory', 'Deploys an YF factory contract').setAction(async () => {
  const factoryDeployment = require('./scripts/01-deploy-factory');
  await factoryDeployment();
});

task('deployCampaign', 'Deploys an YF contract from factory')
  .addParam('factory', 'Factory contract address')
  .addParam('owner', 'Campaign owner')
  .addParam('token', 'Staking token address')
  .setAction(async taskArgs => {
    const { factory, owner, token } = taskArgs;
    const deployCampaign = require('./scripts/02-deploy-campaign');
    await deployCampaign(factory, owner, token);
  });

task('enableReward', 'Enable rewards to YF contract')
  .addParam('campaign', 'Campaign address')
  .addParam('reward', 'Reward address')
  .addParam('duration', 'Duration in seconds')
  .addParam('hts', "Whether the reward is HTS")
  .setAction(async taskArgs => {
    const { campaign, reward, duration, hts } = taskArgs;
    const enableReward = require('./scripts/03-enable-rewards');
    await enableReward(campaign, reward, duration, hts); // If adding non HTS token as as reward, set this to false
  });

task('sendReward', 'Notify contract for YF rewards')
  .addParam('campaign', 'Campaign address')
  .addParam('reward', 'Reward address')
  .addParam('amount', 'Reward amount')
  .setAction(async taskArgs => {
    const { campaign, reward, amount } = taskArgs;
    const sendReward = require('./scripts/04-send-reward');
    await sendReward(campaign, reward, amount);
  });

task('associateToken', 'Associates an HTS token')
  .addParam('accountid', 'The account that will be associated')
  .addParam('pk', 'The PK of the account that will be associated')
  .addParam('tokenid', 'The token that will is getting associated to')
  .setAction(async taskArgs => {
    console.log(taskArgs);
    const tokenAssociation = require('./scripts/utils/associateTokens');
    await tokenAssociation(taskArgs.accountid, taskArgs.pk, taskArgs.tokenid);
  });

task('approveToken', 'Approves an HTS token for spending by an account')
  .addParam('account', 'The account that will give permission')
  .addParam('pk', 'The PK of the account that will permit')
  .addParam('spender', 'The account that will be permitted to spend tokens')
  .addParam('token', 'The token will be spent')
  .addParam('amount', 'How many tokens will be spent')
  .setAction(async taskArgs => {
    console.log(taskArgs);
    const tokenApproval = require('./scripts/utils/approveToken');
    await tokenApproval(taskArgs.account, taskArgs.pk, taskArgs.spender, taskArgs.token, taskArgs.amount);
  });

task('setupHbarCampaign', 'Deploys HBAR campaign')
  .addParam('factory', 'Factory contract address')
  .addParam('token', 'The staking token to user for the campaign')
  .addParam('hbaramount', 'Amount of HBARs to distribute as rewards')
  .addParam('duration', 'Duration of the campaign')
  .setAction(async taskArgs => {
    const setupHbarCampaign = require('./scripts/setup-hbar-campaign');
    await setupHbarCampaign(taskArgs.factory, taskArgs.token, taskArgs.hbaramount, taskArgs.duration);
  });

task('setupHTSCampaign', 'Deploys HTS campaign')
  .addParam('factory', 'Factory contract address')
  .addParam('token', 'The staking token to user for the campaign')
  .addParam('reward', 'The staking reward')
  .addParam('amount', 'Amount of HBARs to distribute as rewards')
  .addParam('duration', 'Duration of the campaign')
  .setAction(async taskArgs => {
    const setupHTSCampaign = require('./scripts/setup-hts-campaign');
    await setupHTSCampaign(taskArgs.factory, taskArgs.token, taskArgs.reward, taskArgs.amount, taskArgs.duration);
  });

task('setupMultiRewardsCampaign', 'Deploys Multi Rewards campaign')
  .addParam('factory', 'Factory contract address')
  .addParam('token', 'The staking token to user for the campaign')
  .addParam('duration', 'Duration of the campaign')
  .setAction(async taskArgs => {
    const setupMultiRewardsCampaign = require('./scripts/setup-multi-rewards-campaign');
    await setupMultiRewardsCampaign(taskArgs.factory, taskArgs.token, taskArgs.duration);
  });

task('campaignInfo', 'Interact with multirewards contract')
  .addParam('campaign', 'Contract address')
  .addParam('walletAddress', 'Wallet address')
  .addParam('index', 'Reward index')
  .addParam('decimals', 'Reward token decimals')
  .setAction(async taskArgs => {
    const { campaign, walletAddress, index, decimals } = taskArgs;

    const campaignInfo = require('./scripts/05-campaign-info');

    await campaignInfo(campaign, walletAddress, index, decimals);
  });

task('setDuration', 'Adjust the duration of a particular campaign')
  .addParam('campaign', 'Campaign address')
  .addParam('token', 'Reward address')
  .addParam('duration', 'Duration by which the campaign will be extended')
  .setAction(async taskArgs => {
    const { campaign, token, duration } = taskArgs;

    const setDuration = require('./scripts/set-rewards-duration');

    await setDuration(campaign, token, duration);
  });

task('extendCampaign')
  .addParam('campaign')
  .addParam('token')
  .addParam('duration')
  .addParam('reward')
  .setAction(async taskArgs => {
    const extendCampaign = require('./scripts/06-extend-campaign');
    await extendCampaign(taskArgs.campaign, taskArgs.token, taskArgs.duration, taskArgs.reward)
  })

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.4.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    local: {
      url: 'http://localhost:7546',
      chainId: 298,
      accounts: [
        '0x105d050185ccb907fba04dd92d8de9e32c18305e097ab41dadda21489a211524',
        '0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7',
        '0x45a5a7108a18dd5013cf2d5857a28144beadc9c70b3bdbd914e38df4e804b8d8',
        '0x6e9d61a325be3f6675cf8b7676c70e4a004d2308e3e182370a41f5653d52c6bd',
      ],
    }
  },
  defaultNetwork: 'local',
  hedera: {
    networks: config.networks,
    gasLimit: 2_000_000,
  },
};
