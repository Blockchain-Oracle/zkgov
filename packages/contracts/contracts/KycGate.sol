// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "./interfaces/IKycSBT.sol";
import "./AgentRegistry.sol";

contract KycGate {
    ISemaphore public semaphore;
    IKycSBT public kycSBT;
    AgentRegistry public agentRegistry;

    uint256 public humanGroupId;
    uint256 public agentGroupId;

    mapping(address => bool) public humanRegistered;
    mapping(address => bool) public agentRegistered;
    mapping(uint256 => bool) public commitmentUsed;

    event HumanRegistered(address indexed wallet, uint256 identityCommitment);
    event AgentRegistered(address indexed agent, uint256 identityCommitment);

    constructor(
        address _semaphore,
        address _kycSBT,
        address _agentRegistry
    ) {
        semaphore = ISemaphore(_semaphore);
        kycSBT = IKycSBT(_kycSBT);
        agentRegistry = AgentRegistry(_agentRegistry);

        humanGroupId = semaphore.createGroup();
        agentGroupId = semaphore.createGroup();
    }

    function registerHuman(uint256 identityCommitment) external {
        (bool isKyc,) = kycSBT.isHuman(msg.sender);
        require(isKyc, "Not KYC verified");
        require(!humanRegistered[msg.sender], "Already registered");
        require(!commitmentUsed[identityCommitment], "Commitment already used");

        humanRegistered[msg.sender] = true;
        commitmentUsed[identityCommitment] = true;
        semaphore.addMember(humanGroupId, identityCommitment);

        emit HumanRegistered(msg.sender, identityCommitment);
    }

    function registerAgent(address agentAddr, uint256 identityCommitment) external {
        require(agentRegistry.isVerifiedAgent(agentAddr), "Agent not verified");
        require(agentRegistry.getAgentOwner(agentAddr) == msg.sender, "Not agent owner");
        require(!agentRegistered[agentAddr], "Already registered");
        require(!commitmentUsed[identityCommitment], "Commitment already used");

        agentRegistered[agentAddr] = true;
        commitmentUsed[identityCommitment] = true;
        semaphore.addMember(agentGroupId, identityCommitment);

        emit AgentRegistered(agentAddr, identityCommitment);
    }

    function getHumanGroupId() external view returns (uint256) {
        return humanGroupId;
    }

    function getAgentGroupId() external view returns (uint256) {
        return agentGroupId;
    }
}
