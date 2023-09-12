// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import './MultiRewards.sol';
import './libraries/PoolAddress.sol';
import './libraries/TransferHelper.sol';
import './interfaces/ICampaignFactory.sol';

/// @notice Factory contract for deploying Yield Farming campaigns
contract Factory is ICampaignFactory, Owned {
    address public immutable override WHBAR;

    // Flat fee that is charged on campaign creation/extension
    uint256 public override fee;

    // The asset the fee is paid in
    address public override feeAsset;

    // Obtain pool and its tokens when creating a farm campaign
    address public override poolsFactory;

    // Additional tokens that can be used as rewards except the pool ones
    mapping(address => bool) public override rewardTokens;

    // All the campaign being created
    address[] public override campaigns;

    // Store pool to farm campaign
    mapping(address => address) public override farmCampaigns;

    constructor(address _whbar, uint256 _fee, address _feeAsset, address _poolsFactory) Owned(msg.sender) {
        WHBAR = _whbar;
        fee = _fee;
        feeAsset = _feeAsset;
        poolsFactory = _poolsFactory;
    }

    /// @notice Set a flat fee that is to be charged on campaign creation/extension
    /// @param _fee The amount of fee
    /// @param _feeAsset The asset the fee is to be paid in
    function setFee(uint256 _fee, address _feeAsset) external override onlyOwner {
        fee = _fee;
        feeAsset = _feeAsset;
        emit SetFee(_fee, _feeAsset);
    }

    /// @notice Add/Remove tokens that are allowed to be added as a rewards for every single campaign
    /// @param whitelistedTokens The tokens that are to be allowed/disallowed
    /// @param toWhitelist Flag determining allowing/disallowing
    function setRewardTokens(address[] calldata whitelistedTokens, bool toWhitelist) external override onlyOwner {
        uint256 numberOfTokens = whitelistedTokens.length;
        for (uint256 i = 0; i < numberOfTokens; i++) {
            rewardTokens[whitelistedTokens[i]] = toWhitelist;

            unchecked {
                ++i;
            }
        }

        emit SetRewardTokens(whitelistedTokens, toWhitelist);
    }

    /// @notice Deploys new instance of the {MultiRewards} contract effectively creating new campaign
    /// @param _tokenA The first token of the pool the campaign is created for
    /// @param _tokenB The second token of the pool the campaign is created for
    function deploy(address _tokenA, address _tokenB) external override onlyOwner {
        address stakingToken = PoolAddress.pairFor(poolsFactory, _tokenA, _tokenB);
        require(farmCampaigns[stakingToken] == address(0x0), 'Campaign already exists for the given pool');

        MultiRewards newCampaign = new MultiRewards(stakingToken, _tokenA, _tokenB, WHBAR, owner);
        farmCampaigns[stakingToken] = address(newCampaign);
        campaigns.push(address(newCampaign));

        emit CampaignDeployed(address(newCampaign), stakingToken);
    }

    /// @notice Withdraw fees being collected by creating/extending campaigns
    /// @param receiver The address to receive the fee being accumulated so far
    function withdrawFee(address receiver) external override onlyOwner {
        uint256 feeAmount = IERC20(feeAsset).balanceOf(address(this));
        TransferHelper.safeTransfer(feeAsset, receiver, feeAmount);
        emit WithdrawFee(feeAmount, receiver);
    }

    /// @notice Return all the fee related things at once for gas optimization
    function getFeeDetails() external view override returns (uint256, address) {
        return (fee, feeAsset);
    }

    /// @notice Get the number of campaigns to be able to loop through them
    function getCampaignsLength() external view override returns (uint256 count) {
        return campaigns.length;
    }
}
