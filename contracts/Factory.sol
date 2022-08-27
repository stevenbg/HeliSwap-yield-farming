// SPDX-License-Identifier: MIT
pragma solidity 0.5.17;

import './MultiRewards.sol';

/// @notice Factory contract for deploying Yield Farming campaigns
contract Factory is Owned {

    MultiRewards[] public campaigns;

    constructor() public Owned(msg.sender) {}

    event CampaignDeployed(address campaign, address stakingToken);

    /// @notice Deploys new instance of the {MultiRewards} contract effectively creating new campaign
    /// @param _owner The owner to be set for the campaign
    /// @param _stakingToken The token that will be staked by users
    function deploy(address _owner, address _stakingToken) external onlyOwner {
        MultiRewards newMultiRewardsContract = new MultiRewards(_owner, _stakingToken);
        campaigns.push(newMultiRewardsContract);

        emit CampaignDeployed(address(newMultiRewardsContract), _stakingToken);
    }

    function getCampaignsLength() public view returns (uint256 count) {
        return campaigns.length;
    }
}
