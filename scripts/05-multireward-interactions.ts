// @ts-nocheck
import hardhat from 'hardhat';
async function deployMultiRewardsFromFactory(campaignAddress: string, walletAddress: string) {
  const MultiRewardsContract = await hardhat.hethers.getContractAt('MultiRewards', campaignAddress);

  console.log('⚙️ Calling Multirewards contract ...');

  const multiRewardsContractReward = await MultiRewardsContract.rewardTokens(0);
  const multiRewardsContractUserBalance = await MultiRewardsContract.balanceOf(walletAddress);
  const multiRewardsContractTotalSupply = await MultiRewardsContract.totalSupply();
  const multiRewardsContractRewardEarned = await MultiRewardsContract.earned(
    walletAddress,
    multiRewardsContractReward,
  );
  const multiRewardsContractRewardDuration = await MultiRewardsContract.getRewardForDuration(
    multiRewardsContractReward,
  );

  console.log('✅ Reward address:', multiRewardsContractReward);
  console.log('✅ User balance:', multiRewardsContractUserBalance.toString());
  console.log('✅ Total supply:', multiRewardsContractTotalSupply.toString());
  console.log('✅ Reward earned:', multiRewardsContractRewardEarned.toString());
  console.log('✅ Reward duration:', multiRewardsContractRewardDuration.toString());
}

module.exports = deployMultiRewardsFromFactory;
