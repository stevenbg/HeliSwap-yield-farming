pragma solidity 0.5.17;

import './MultiRewards.sol';

contract MultiRewardsFactory {
   MultiRewards[] public MultiRewardsArray;

    function deploy(address _owner, address _stakingToken) external  {
     MultiRewards newMultiRewards = new MultiRewards(_owner, _stakingToken);
     MultiRewardsArray.push(newMultiRewards);
  }
}
