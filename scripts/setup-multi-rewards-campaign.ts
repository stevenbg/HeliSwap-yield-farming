// @ts-nocheck
import hardhat from 'hardhat';

const deployCampaignFromFactory = require('./02-deploy-campaign');
const enableRewards = require('./03-enable-rewards');
const sendRewards = require('./04-send-reward');
const approveToken = require('./utils/approveToken');

export const idToAddress = (tokenId: string) => {
  return hardhat.hethers.utils.getChecksumAddress(hethers.utils.getAddressFromAccount(tokenId));
};

export const addressToId = (tokenAddress: string) => {
  return hardhat.hethers.utils.asAccountString(tokenAddress);
};

// Canonical WHBAR Address on Testnet
// Reference https://github.com/LimeChain/whbar
const WHBAR_ADDRESS = '0x0000000000000000000000000000000000001c3D';
const DEFAULT_TOKEN_REWARD = '0.0.34741585';
const DEFAULT_TOKEN_REWARD_AMOUNT = '10000000000';
const DEFAULT_HBAR_REWARD_AMOUNT = '1000';

async function setupMultiRewardsCampaign(
  factory: string,
  stakingToken: string,
  duration: string,
  rewardToken = DEFAULT_TOKEN_REWARD,
  rewardTokenAmount = DEFAULT_TOKEN_REWARD_AMOUNT,
  rewardHBARAmount = DEFAULT_HBAR_REWARD_AMOUNT,
) {
  const deployer = (await hardhat.hethers.getSigners())[0];
  const deployerId = hardhat.hethers.utils.asAccountString(deployer.address);
  const deployerPk = deployer.identity.privateKey;

  // 1. Deploy new Campaign
  const campaign = await deployCampaignFromFactory(factory, deployer.address, stakingToken);

  const campaignId = addressToId(campaign);

  // 2. Wrap HBARs
  const WHBAR = await hardhat.hethers.getContractAt('IWHBAR', WHBAR_ADDRESS);
  // THIS VALUE IS IN HBARS not TINYBARS!!!
  const depositTx = await WHBAR.deposit({ value: rewardHBARAmount, gasLimit: 150_000 });
  await depositTx.wait();
  console.log(`Wrapped ${rewardHBARAmount} of HBARs into WHBAR`);

  const decimals = 8;
  const hbarAmountWei = hardhat.hethers.utils.parseUnits(rewardHBARAmount, decimals);

  // 3. Approve WHBARs
  const approveTx = await WHBAR.approve(campaign, hbarAmountWei);
  await approveTx.wait();
  console.log(`Approved Campaign contract ${campaign} for ${rewardHBARAmount} of WHBARs`);

  // 4. Approve HTS Reward
  await approveToken(deployerId, deployerPk, campaignId, rewardToken, rewardTokenAmount);
  console.log(`Approved Campaign contract ${campaign} for ${rewardTokenAmount} of Reward`);

  // 5. Enable WHBAR Rewards
  await enableRewards(campaign, WHBAR_ADDRESS, duration);

  // 6. Send HBAR Rewards
  await sendRewards(campaign, WHBAR_ADDRESS, hbarAmountWei);

  // 7. Enable HTS Rewards
  await enableRewards(campaign, idToAddress(rewardToken), duration, true);

  // 8. Send HTS Rewards
  await sendRewards(campaign, idToAddress(rewardToken), rewardTokenAmount);
}

module.exports = setupMultiRewardsCampaign;
