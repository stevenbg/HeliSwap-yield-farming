// @ts-nocheck
import hardhat from 'hardhat';

const enableRewards = require('./03-enable-rewards');
const sendRewards = require('./04-send-reward');
const setDuration = require('./set-rewards-duration');

const WHBAR_ADDRESS = '0x00000000000000000000000000000000002cc823';

async function setupHbarCampaign(campaign: string, hbarAmount: string, duration: string) {
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
  //   await enableRewards(campaign, WHBAR_ADDRESS, duration);
  await setDuration(campaign, WHBAR_ADDRESS, duration);

  // 5. Send Rewards
  await sendRewards(campaign, WHBAR_ADDRESS, hbarAmountWei);
}

module.exports = setupHbarCampaign;
