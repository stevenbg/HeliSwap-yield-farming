pragma solidity 0.5.17;

// import "@openzeppelin/contracts/access/Ownable.sol";

import './MultiRewards.sol';

contract MultiRewardsFactory {
  address[] public multiRewardsArray;
  MultiRewards[] public MultiRewardsArray;


  event MultirewardsContractDeployed(address multiRewardsCont);

  function deploy(address _owner, address _stakingToken) external {

    MultiRewards newMultiRewardsContract = new MultiRewards(_owner, _stakingToken);
    multiRewardsArray.push(address(newMultiRewardsContract));

  emit MultirewardsContractDeployed(address(newMultiRewardsContract));
  // MultiRewardsArray.push(newMultiRewardsContract);
  }

  function getMultirewardsContractsCount() public view returns(uint count) {
  return multiRewardsArray.length;
  }
}
