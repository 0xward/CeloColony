// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  CeloColony
 * @notice On-chain economy contract for Celo Colony game.
 *         Deploy on Celo Mainnet (chainId 42220).
 *         After deploying, fund the contract with CELO so claimReward() works.
 *
 * Deploy with Hardhat:
 *   npx hardhat run scripts/deploy.ts --network celo
 *
 * Verify:
 *   npx hardhat verify --network celo <ADDRESS>
 */
contract CeloColony {

    // ─── State ────────────────────────────────────────────────────────────────
    address public owner;
    bool    public paused;

    // Per-player accounting
    mapping(address => uint256) public playerLevel;
    mapping(address => uint256) public buildingCount;
    mapping(address => uint256) public totalSpent;       // in wei
    mapping(address => uint256) public pendingRewards;   // in wei

    // Building base costs (wei). Index matches BuildingType enum in TS.
    uint256[] public buildingBaseCosts;
    uint256   public constant REWARD_BPS = 1000;         // 10% back as rewards (basis points)
    uint256   public constant BPS_DENOM  = 10_000;

    // ─── Events ───────────────────────────────────────────────────────────────
    event BuildingPurchased(address indexed player, uint8 buildingType, uint256 celoAmount);
    event BuildingUpgraded (address indexed player, uint8 slot, uint8 newLevel, uint256 celoAmount);
    event RewardClaimed    (address indexed player, uint256 amount);
    event LevelUp          (address indexed player, uint256 newLevel);
    event ContractFunded   (address indexed funder, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner()    { require(msg.sender == owner, "Not owner");  _; }
    modifier notPaused()    { require(!paused,              "Paused");     _; }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        // Costs in CELO (18 decimals). Order matches BuildingType in TS constants.
        buildingBaseCosts.push(0.02  ether);  // 0: power_reactor
        buildingBaseCosts.push(0.03  ether);  // 1: minipay_station
        buildingBaseCosts.push(0.06  ether);  // 2: mento_bank
        buildingBaseCosts.push(0.08  ether);  // 3: ubeswap_market
        buildingBaseCosts.push(0.04  ether);  // 4: gooddollar_hub
        buildingBaseCosts.push(0.025 ether);  // 5: valora_terminal
        buildingBaseCosts.push(0.07  ether);  // 6: opera_hub
        buildingBaseCosts.push(0.12  ether);  // 7: research_lab
    }

    // ─── Purchase a building ──────────────────────────────────────────────────
    function purchaseBuilding(uint8 buildingType) external payable notPaused {
        require(buildingType < buildingBaseCosts.length, "Invalid type");
        require(msg.value >= buildingBaseCosts[buildingType], "Insufficient CELO");

        _recordSpend(msg.sender, msg.value);
        buildingCount[msg.sender]++;
        _checkLevelUp(msg.sender);

        emit BuildingPurchased(msg.sender, buildingType, msg.value);
    }

    // ─── Upgrade a building ───────────────────────────────────────────────────
    // slotIndex: index in BUILDING_SLOTS array (0-11)
    // newLevel:  the level being upgraded TO (2-10)
    function upgradeBuilding(uint8 slotIndex, uint8 newLevel) external payable notPaused {
        require(slotIndex < 12,    "Invalid slot");
        require(newLevel  >= 2 && newLevel <= 10, "Invalid level");

        // Minimum cost = base cost of any building * newLevel / 2
        uint256 minCost = buildingBaseCosts[0] * newLevel / 2;
        require(msg.value >= minCost, "Insufficient CELO");

        _recordSpend(msg.sender, msg.value);
        _checkLevelUp(msg.sender);

        emit BuildingUpgraded(msg.sender, slotIndex, newLevel, msg.value);
    }

    // ─── Claim accumulated rewards ────────────────────────────────────────────
    function claimReward() external notPaused {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards");
        require(address(this).balance >= reward, "Contract underfunded");

        pendingRewards[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: reward}("");
        require(ok, "Transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    // ─── View: get all player stats ───────────────────────────────────────────
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 level,
            uint256 buildings,
            uint256 spent,
            uint256 rewards
        )
    {
        return (
            playerLevel[player],
            buildingCount[player],
            totalSpent[player],
            pendingRewards[player]
        );
    }

    // ─── Admin: fund the reward pool ──────────────────────────────────────────
    function fundRewardPool() external payable onlyOwner {
        emit ContractFunded(msg.sender, msg.value);
    }

    // ─── Admin: update building cost ─────────────────────────────────────────
    function updateBuildingCost(uint8 index, uint256 newCost) external onlyOwner {
        require(index < buildingBaseCosts.length, "Out of range");
        buildingBaseCosts[index] = newCost;
    }

    // ─── Admin: emergency withdraw ────────────────────────────────────────────
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool ok,) = payable(owner).call{value: amount}("");
        require(ok, "Transfer failed");
    }

    // ─── Admin: pause / unpause ───────────────────────────────────────────────
    function setPaused(bool _paused) external onlyOwner { paused = _paused; }

    // ─── Admin: transfer ownership ────────────────────────────────────────────
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────
    function _recordSpend(address player, uint256 amount) internal {
        totalSpent[player] += amount;
        uint256 reward      = amount * REWARD_BPS / BPS_DENOM;
        pendingRewards[player] += reward;
    }

    // Level up every 3 buildings — mirrors frontend logic
    function _checkLevelUp(address player) internal {
        uint256 newLevel = 1 + buildingCount[player] / 3;
        if (newLevel > playerLevel[player]) {
            playerLevel[player] = newLevel;
            emit LevelUp(player, newLevel);
        }
    }

    // Accept direct CELO transfers (funding the pool)
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
}
