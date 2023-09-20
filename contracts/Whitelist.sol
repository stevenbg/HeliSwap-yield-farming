// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../node_modules/@openzeppelin/contracts/access/Ownable.sol';

contract Whitelist is Ownable {
    address private _owner;
    mapping(address => bool) private _whitelistedTokens;

    // Event to log when a token is added to the whitelist
    event TokenWhitelisted(address tokenAddress);

    // Event to log when a token is removed from the whitelist
    event TokenRemoved(address tokenAddress);

    constructor(address[] memory initialTokens) {
        _owner = msg.sender;
        for (uint256 i = 0; i < initialTokens.length; i++) {
            _whitelistedTokens[initialTokens[i]] = true;
            emit TokenWhitelisted(initialTokens[i]);
        }
    }

    // Function to add a token to the whitelist
    function addToWhitelist(address tokenAddress) external onlyOwner {
        _whitelistedTokens[tokenAddress] = true;
        emit TokenWhitelisted(tokenAddress);
    }

    // Function to remove a token from the whitelist
    function removeFromWhitelist(address tokenAddress) external onlyOwner {
        _whitelistedTokens[tokenAddress] = false;
        emit TokenRemoved(tokenAddress);
    }

    // Function for other contracts or accounts to check if a token is whitelisted
    function isWhitelisted(address tokenAddress) external view returns (bool) {
        return _whitelistedTokens[tokenAddress];
    }
}
