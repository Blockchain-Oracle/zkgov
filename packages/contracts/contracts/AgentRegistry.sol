// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IKycSBT.sol";

contract AgentRegistry {
    IKycSBT public kycSBT;

    mapping(address => address) public agentToOwner;
    mapping(address => address[]) public ownerAgents;
    mapping(address => bool) public isAgent;

    event AgentRegistered(address indexed agent, address indexed owner);
    event AgentDeregistered(address indexed agent, address indexed owner);

    constructor(address _kycSBT) {
        kycSBT = IKycSBT(_kycSBT);
    }

    function registerAgent(address agentAddress) external {
        (bool isKyc,) = kycSBT.isHuman(msg.sender);
        require(isKyc, "Owner not KYC verified");
        require(!isAgent[agentAddress], "Already registered");
        require(agentToOwner[agentAddress] == address(0), "Agent has owner");

        agentToOwner[agentAddress] = msg.sender;
        ownerAgents[msg.sender].push(agentAddress);
        isAgent[agentAddress] = true;

        emit AgentRegistered(agentAddress, msg.sender);
    }

    function deregisterAgent(address agentAddress) external {
        require(agentToOwner[agentAddress] == msg.sender, "Not agent owner");

        agentToOwner[agentAddress] = address(0);
        isAgent[agentAddress] = false;

        emit AgentDeregistered(agentAddress, msg.sender);
    }

    function isVerifiedAgent(address agent) external view returns (bool) {
        if (!isAgent[agent]) return false;
        address owner = agentToOwner[agent];
        (bool isKyc,) = kycSBT.isHuman(owner);
        return isKyc;
    }

    function getAgentOwner(address agent) external view returns (address) {
        return agentToOwner[agent];
    }

    function getOwnerAgents(address owner) external view returns (address[] memory) {
        return ownerAgents[owner];
    }
}
