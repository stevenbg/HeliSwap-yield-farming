// SPDX-License-Identifier: MIT
pragma solidity 0.5.17;

import './MultiRewards.sol';

/// @notice Factory contract for deploying Yield Farming campaigns
contract Factory is Owned {

    address public WHBAR;
    MultiRewards[] public campaigns;

    constructor(address _whbar) public Owned(msg.sender) {
        WHBAR = _whbar;
    }

    event CampaignDeployed(address campaign, address stakingToken);

    /// @notice Deploys new instance of the {MultiRewards} contract effectively creating new campaign
    /// @param _owner The owner to be set for the campaign
    /// @param _stakingToken The token that will be staked by users
    function deploy(address _owner, address _stakingToken) external onlyOwner {
        MultiRewards newCampaign = new MultiRewards(_owner, _stakingToken, WHBAR);
        campaigns.push(newCampaign);

        emit CampaignDeployed(address(newCampaign), _stakingToken);
    }

    function getCampaignsLength() public view returns (uint256 count) {
        return campaigns.length;
    }
}
