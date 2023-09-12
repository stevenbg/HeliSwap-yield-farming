// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface ICampaignFactory {
    event SetFee(uint256 fee, address feeAsset);
    event WithdrawFee(uint256 feeAmount, address receiver);
    event SetRewardTokens(address[] whitelistedTokens, bool toWhitelist);
    event CampaignDeployed(address campaign, address stakingToken);

    function WHBAR() external view returns (address);

    function fee() external view returns (uint256);

    function feeAsset() external view returns (address);

    function poolsFactory() external view returns (address);

    function campaigns(uint256) external view returns (address);

    function rewardTokens(address) external view returns (bool);

    function farmCampaigns(address) external view returns (address);

    function setFee(uint256 _fee, address _feeAsset) external;

    function setRewardTokens(address[] calldata whitelistedTokens, bool toWhitelist) external;

    function deploy(address _tokenA, address _tokenB) external;

    function withdrawFee(address receiver) external;

    function getFeeDetails() external view returns (uint256, address);

    function getCampaignsLength() external view returns (uint256 count);
}
