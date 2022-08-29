// @ts-nocheck
import hardhat from 'hardhat';
async function deployMultiRewardsFromFactory(campaignAddress: string, walletAddress: string) {
  const MultiRewardsContract = await hardhat.hethers.getContractAt('MultiRewards', campaignAddress);

  console.log('⚙️ Calling Multirewards contract ...');

  const multiRewardsContractReward = await MultiRewardsContract.rewardTokens(0);
  const multiRewardsContractUserBalance = await MultiRewardsContract.balanceOf(walletAddress);
  const multiRewardsContractTotalSupply = await MultiRewardsContract.totalSupply();
  const multiRewardsContractRewardEarned = await MultiRewardsContract.earned(walletAddress, multiRewardsContractReward);
  const multiRewardsContractRewardDuration = await MultiRewardsContract.getRewardForDuration(
    multiRewardsContractReward,
  );

  const multiRewardsContractRewardData = await MultiRewardsContract.rewardData(multiRewardsContractReward);

  console.log('✅ Reward address:', multiRewardsContractReward);
  console.log('✅ User balance:', multiRewardsContractUserBalance.toString());
  console.log('✅ Total supply:', multiRewardsContractTotalSupply.toString());
  console.log('✅ Reward earned:', multiRewardsContractRewardEarned.toString());
  console.log('✅ Reward duration:', multiRewardsContractRewardDuration.toString());
  console.log('✅ Reward periodFinish:', multiRewardsContractRewardData[0].toString());
  console.log('✅ Reward rewardRate:', multiRewardsContractRewardData[1].toString());
  console.log('✅ Reward rewardsDuration:', multiRewardsContractRewardData[2].toString());
  console.log('✅ Reward lastUpdateTime:', multiRewardsContractRewardData[3].toString());
  console.log('✅ Reward rewardPerTokenStored:', multiRewardsContractRewardData[4].toString());
}

module.exports = deployMultiRewardsFromFactory;
