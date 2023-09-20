// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWhitelist {
    event TokensWhitelisted(address[] tokens, bool toWhitelist);

    function whbar() external view returns (address);

    function poolsFactory() external view returns (address);

    function whitelistedTokens(address) external view returns (bool);

    function setWhitelist(address[] calldata _tokens, bool _toWhitelist) external;
}
