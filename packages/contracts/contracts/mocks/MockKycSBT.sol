// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract MockKycSBT {
    mapping(address => bool) private _isHuman;
    mapping(address => uint8) private _level;

    function setHuman(address user, bool status, uint8 level) external {
        _isHuman[user] = status;
        _level[user] = level;
    }

    function isHuman(address account) external view returns (bool, uint8) {
        return (_isHuman[account], _level[account]);
    }

    function getKycInfo(address) external pure returns (
        string memory, uint8, uint8, uint256
    ) {
        return ("", 0, 0, 0);
    }
}
