// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IWhitelist.sol';
import './interfaces/IPoolsFactory.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title Whitelist
 * @dev Contract responsible for keeping the tokens approved in HeliSwap DEX
 * @author HeliSwap
 **/

contract Whitelist is Ownable, IWhitelist {
    address public immutable override whbar;

    // Used to validate if a token for whitelisting has a direct pool with WHBAR
    address public immutable override poolsFactory;

    // Keeps all the whitelisted tokens
    mapping(address => bool) public override whitelistedTokens;

    constructor(address _whbar, address _poolsFactory) {
        whbar = _whbar;
        poolsFactory = _poolsFactory;
    }

    /// @notice Add/Remove tokens to/from the whitelist
    /// @param _tokens Tokens to be set
    /// @param _toWhitelist Add/Remove flag
    function setWhitelist(address[] memory _tokens, bool _toWhitelist) public override onlyOwner {
        uint256 numberOfTokens = _tokens.length;
        for (uint256 i = 0; i < numberOfTokens; ) {
            address token = _tokens[i];
            address pool = IPoolsFactory(poolsFactory).getPair(token, whbar);

            require(pool != address(0), 'There is no a pool with Token:WHBAR');

            whitelistedTokens[token] = _toWhitelist;

            unchecked {
                ++i;
            }
        }

        emit TokensWhitelisted(_tokens, _toWhitelist);
    }
}
