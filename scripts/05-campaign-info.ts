// @ts-nocheck
import hardhat from 'hardhat';
async function getCampaignData(
  campaignAddress: string,
  walletAddress: string,
  rewardIndex: number = 0,
  rewardDecimals: number = 18,
) {
  const MultiRewardsContract = await hardhat.hethers.getContractAt('MultiRewards', campaignAddress);

  console.log('⚙️ Calling MultiRewards contract ...');

  const multiRewardsContractReward = await MultiRewardsContract.rewardTokens(rewardIndex);
  const multiRewardsContractUserBalance = await MultiRewardsContract.balanceOf(walletAddress);
  const multiRewardsContractTotalSupply = await MultiRewardsContract.totalSupply();
  const multiRewardsContractRewardEarned = await MultiRewardsContract.earned(walletAddress, multiRewardsContractReward);
  const multiRewardsContractRewardDuration = await MultiRewardsContract.getRewardForDuration(
    multiRewardsContractReward,
  );

  const multiRewardsContractRewardData = await MultiRewardsContract.rewardData(multiRewardsContractReward);

  const totalReward = hardhat.hethers.utils.formatUnits(multiRewardsContractRewardDuration, rewardDecimals);
  const userStaked = hardhat.hethers.utils.formatUnits(multiRewardsContractUserBalance, 18);
  const totalStaked = hardhat.hethers.utils.formatUnits(multiRewardsContractTotalSupply, 18);
  const rewardsRate = hardhat.hethers.utils.formatUnits(multiRewardsContractRewardData[1], rewardDecimals);
  const rewardEarned = hardhat.hethers.utils.formatUnits(multiRewardsContractRewardEarned, rewardDecimals);
  const rewardPerTokenStored = hardhat.hethers.utils.formatUnits(multiRewardsContractRewardData[4], rewardDecimals);

  console.log('💡Campaign data:');
  console.log('  ▶️ Campaign address:', campaignAddress);
  console.log('  ▶️ Total staked:', totalStaked.toString());
  console.log('  ▶️ Total staked Wei:', multiRewardsContractTotalSupply.toString());
  console.log('💰Rewards data:');
  console.log('  ▶️ Reward index:', rewardIndex);
  console.log('  ▶️ Total amount:', totalReward.toString());
  console.log('  ▶️ Total amount Wei:', multiRewardsContractRewardDuration.toString());
  console.log('  ▶️ Reward decimals:', rewardDecimals);
  console.log('  ▶️ Reward address:', multiRewardsContractReward);
  console.log('  ▶️ Reward rate:', rewardsRate.toString());
  console.log('  ▶️ Reward rate Wei:', multiRewardsContractRewardData[1].toString());
  console.log(
    '  ▶️ Reward end date:',
    new Date(Number(multiRewardsContractRewardData[0].toString()) * 1000).toString(),
  );
  console.log('  ▶️ Reward end timestamp:', multiRewardsContractRewardData[0].toString());
  console.log('  ▶️ Reward rewardsDuration:', multiRewardsContractRewardData[2].toString());
  console.log(
    '  ▶️ Reward lastUpdateTime:',
    new Date(Number(multiRewardsContractRewardData[3].toString()) * 1000).toString(),
  );
  console.log('  ▶️ Reward rewardPerTokenStored:', rewardPerTokenStored.toString());
  console.log('🧔User data:');
  console.log('  ▶️ User balance:', userStaked.toString());
  console.log('  ▶️ User balance Wei:', multiRewardsContractUserBalance.toString());
  console.log('  ▶️ Reward earned:', rewardEarned.toString());
  console.log('  ▶️ Reward earned Wei:', multiRewardsContractRewardEarned.toString());
}

module.exports = getCampaignData;
