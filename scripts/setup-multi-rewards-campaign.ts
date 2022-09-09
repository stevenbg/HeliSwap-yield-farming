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
const WHBAR_ADDRESS = '0x0000000000000000000000000000000002be8c90';

async function setupMultiRewardsCampaign(factory: string, token: string, duration: string) {
  const deployer = (await hardhat.hethers.getSigners())[0];
  const deployerId = hardhat.hethers.utils.asAccountString(deployer.address);
  const deployerPk = deployer.identity.privateKey;

  /* Token addresses on testent
  0.0.34741585 - USDT (6 decimals)
  0.0.34741650 - WETH
  0.0.34741685 - BTC
  */

  /* Durations in seconds
  3600      - 1 hour
  86400     - 1 day
  604800    - 1 week
  2592000   - 1 month
  31536000  - 1 year
  */

  const rewardId = '0.0.34741585';
  const rewardAmount = (8640_000_000).toString();
  const hbarAmount = '864';

  // 1. Deploy new Campaign
  const campaign = await deployCampaignFromFactory(factory, deployer.address, token);

  const campaignId = addressToId(campaign);

  // 2. Wrap HBARs
  const WHBAR = await hardhat.hethers.getContractAt('IWHBAR', WHBAR_ADDRESS);
  // THIS VALUE IS IN HBARS not TINYBARS!!!
  const depositTx = await WHBAR.deposit({ value: hbarAmount, gasLimit: 150_000 });
  await depositTx.wait();
  console.log(`Wrapped ${hbarAmount} of HBARs into WHBAR`);

  const decimals = 8;
  const hbarAmountWei = hardhat.hethers.utils.parseUnits(hbarAmount, decimals);

  // 3. Approve WHBARs
  const approveTx = await WHBAR.approve(campaign, hbarAmountWei);
  await approveTx.wait();
  console.log(`Approved Campaign contract ${campaign} for ${hbarAmount} of WHBARs`);

  // 4. Approve HTS Reward
  await approveToken(deployerId, deployerPk, campaignId, rewardId, rewardAmount);
  console.log(`Approved Campaign contract ${campaign} for ${rewardAmount} of Reward`);

  // 5. Enable WHBAR Rewards
  await enableRewards(campaign, WHBAR_ADDRESS, duration);

  // 6. Enable HTS Rewards
  await enableRewards(campaign, idToAddress(rewardId), duration, true);

  // 7. Send HBAR Rewards
  await sendRewards(campaign, WHBAR_ADDRESS, hbarAmountWei);

  // 8. Send HTS Rewards
  await sendRewards(campaign, idToAddress(rewardId), rewardAmount);
}

module.exports = setupMultiRewardsCampaign;
