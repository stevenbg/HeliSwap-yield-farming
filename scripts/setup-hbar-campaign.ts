// @ts-nocheck
import hardhat from 'hardhat';

const deployCampaignFromFactory = require('./02-deploy-campaign');
const enableRewards = require('./03-enable-rewards');
const sendRewards = require('./04-send-reward');

// Canonical WHBAR Address on Testnet
// Reference https://github.com/LimeChain/whbar
const WHBAR_ADDRESS = '0x0000000000000000000000000000000002be8c90';

async function setupHbarCampaign(factory: string, token: string, hbarAmount: string, duration: string) {
  const deployer = (await hardhat.hethers.getSigners())[0];

  // 1. Deploy new Campaign
  const campaign = await deployCampaignFromFactory(factory, deployer.address, token);

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

  // 4. Enable WHBAR Rewards
  await enableRewards(campaign, WHBAR_ADDRESS, duration);

  // 5. Send Rewards
  await sendRewards(campaign, WHBAR_ADDRESS, hbarAmount);
}

module.exports = setupHbarCampaign;
