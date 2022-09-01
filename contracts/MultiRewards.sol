// SPDX-License-Identifier: MIT

pragma solidity 0.5.17;

import './Pausable.sol';
import './ReentrancyGuard.sol';
import './interfaces/IERC20.sol';
import './libraries/Math.sol';
import './libraries/SafeMath.sol';
import './interfaces/IWHBAR.sol';

contract MultiRewards is ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    IWHBAR public WHBAR;

    /* ========== STATE VARIABLES ========== */

    struct Reward {
        uint256 periodFinish;
        uint256 rewardRate;
        uint256 rewardsDuration;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
    }

    address public stakingToken;
    mapping(address => Reward) public rewardData;
    address[] public rewardTokens;

    // user -> reward token -> amount
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(address => mapping(address => uint256)) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _owner,
        address _stakingToken,
        address _whbar
    ) public Owned(_owner) {
        stakingToken = _stakingToken;
        WHBAR = IWHBAR(_whbar);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable(address _rewardsToken) public view returns (uint256) {
        return Math.min(block.timestamp, rewardData[_rewardsToken].periodFinish);
    }

    function rewardPerToken(address _rewardsToken) public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardData[_rewardsToken].rewardPerTokenStored;
        }
        return
            rewardData[_rewardsToken].rewardPerTokenStored.add(
                lastTimeRewardApplicable(_rewardsToken)
                    .sub(rewardData[_rewardsToken].lastUpdateTime)
                    .mul(rewardData[_rewardsToken].rewardRate)
                    .mul(1e18)
                    .div(_totalSupply)
            );
    }

    function earned(address account, address _rewardsToken) public view returns (uint256) {
        return
            _balances[account]
                .mul(rewardPerToken(_rewardsToken).sub(userRewardPerTokenPaid[account][_rewardsToken]))
                .div(1e18)
                .add(rewards[account][_rewardsToken]);
    }

    function getRewardForDuration(address _rewardsToken) external view returns (uint256) {
        return rewardData[_rewardsToken].rewardRate.mul(rewardData[_rewardsToken].rewardsDuration);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount) external nonReentrant notPaused updateReward(msg.sender) {
        require(amount > 0, 'Cannot stake 0');
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        _safeTransferFrom(stakingToken, msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, _balances[msg.sender], _totalSupply);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, 'Cannot withdraw 0');
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _safeTransfer(stakingToken, msg.sender, amount);

        emit Withdrawn(msg.sender, amount, _balances[msg.sender], _totalSupply);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        for (uint256 i; i < rewardTokens.length; i++) {
            address _rewardsToken = rewardTokens[i];
            uint256 reward = rewards[msg.sender][_rewardsToken];
            if (reward > 0) {
                rewards[msg.sender][_rewardsToken] = 0;
                if (_rewardsToken == address(WHBAR)) {
                    WHBAR.withdraw(reward);
                    msg.sender.transfer(reward);
                } else {
                    _safeTransfer(_rewardsToken, msg.sender, reward);
                }
                emit RewardPaid(msg.sender, _rewardsToken, reward);
            }
        }
    }

    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function enableReward(address _token, uint256 _duration) external onlyOwner {
        require(rewardData[_token].rewardsDuration == 0);
        rewardTokens.push(_token);
        rewardData[_token].rewardsDuration = _duration;

//        optimisticAssociation(_token); // TODO
        emit RewardEnabled(_token, _duration);
    }

    function notifyRewardAmount(address _token, uint256 _reward) external onlyOwner updateReward(address(0)) {
        // handle the transfer of reward tokens via `transferFrom` to reduce the number
        // of transactions required and ensure correctness of the reward amount
        _safeTransferFrom(_token, msg.sender, address(this), _reward);

        if (block.timestamp >= rewardData[_token].periodFinish) {
            rewardData[_token].rewardRate = _reward.div(rewardData[_token].rewardsDuration);
        } else {
            uint256 remaining = rewardData[_token].periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardData[_token].rewardRate);
            rewardData[_token].rewardRate = _reward.add(leftover).div(rewardData[_token].rewardsDuration);
        }

        rewardData[_token].lastUpdateTime = block.timestamp;
        rewardData[_token].periodFinish = block.timestamp.add(rewardData[_token].rewardsDuration);

        emit RewardAdded(_token, _reward, rewardData[_token].rewardsDuration);
    }

    function setRewardsDuration(address _token, uint256 _duration) external onlyOwner {
        require(block.timestamp > rewardData[_token].periodFinish, 'Reward period still active');
        require(_duration > 0, 'Reward duration must be non-zero');

        rewardData[_token].rewardsDuration = _duration;
        emit RewardsDurationUpdated(_token, _duration);
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        for (uint256 i; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            rewardData[token].rewardPerTokenStored = rewardPerToken(token);
            rewardData[token].lastUpdateTime = lastTimeRewardApplicable(token);
            if (account != address(0)) {
                rewards[account][token] = earned(account, token);
                userRewardPerTokenPaid[account][token] = rewardData[token].rewardPerTokenStored;
            }
        }
        _;
    }

    /* ========== HELPER FUNCTIONS ========== */

    function optimisticAssociation(address token) internal {
        (bool success, bytes memory result) = address(0x167).call(
            abi.encodeWithSignature('associateToken(address,address)', address(this), token)
        );
        require(success, 'HTS Precompile: CALL_EXCEPTION');
        int32 responseCode = abi.decode(result, (int32));
        // Success = 22; Non-HTS token (erc20) = 167
        require(responseCode == 22 || responseCode == 167, 'HTS Precompile: CALL_ERROR');
    }

    function _safeTransfer(
        address _token,
        address _to,
        uint256 _value
    ) private {
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature('transfer(address,uint256)', _to, _value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'MULTI_REWARDS: TRANSFER_FAILED');
    }

    function _safeTransferFrom(
        address _token,
        address _from,
        address _to,
        uint256 _value
    ) internal {
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature('transferFrom(address,address,uint256)', _from, _to, _value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'MULTI_REWARDS: TRANSFER_FROM_FAILED');
    }

    /* ========== EVENTS ========== */

    event RewardEnabled(address indexed token, uint256 duration);
    event RewardAdded(address indexed token, uint256 reward, uint256 duration);
    event Staked(address indexed user, uint256 amount, uint256 totalStakedByUser, uint256 totalStaked);
    event Withdrawn(address indexed user, uint256 amount, uint256 totalStakedByUser, uint256 totalSupply);
    event RewardPaid(address indexed user, address indexed rewardsToken, uint256 reward);
    event RewardsDurationUpdated(address indexed token, uint256 newDuration);

    /// @dev Fallback function in case of WHBAR rewards. See {@getRewards}
    function() external payable { }
}
