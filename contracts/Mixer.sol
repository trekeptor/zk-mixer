// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Verifier.sol";

contract Mixer {
    Verifier public verifier;
    uint256 public constant DEPOSIT_AMOUNT = 0.1 ether;

    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifierHashes;

    address public owner;

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
        owner = msg.sender;
    }

    // Event logs
    event Deposit(bytes32 indexed commitment);
    event Withdrawal(address indexed to, bytes32 nullifierHash);

    // Users deposit a fixed amount with a commitment (Poseidon hash)
    function deposit(bytes32 commitment) external payable {
        require(msg.value == DEPOSIT_AMOUNT, "Invalid deposit amount");
        require(!commitments[commitment], "Commitment already used");

        commitments[commitment] = true;
        emit Deposit(commitment);
    }

    // Withdraw funds using a zkSNARK proof and nullifier hash
    function withdraw(
        bytes calldata proof,
        uint256[2] calldata input, // [root, nullifierHash]
        address payable recipient
    ) external {
        bytes32 nullifierHash = bytes32(input[1]);
        require(!nullifierHashes[nullifierHash], "Note already spent");

        bool isValid = verifier.verifyProof(
            [uint256(bytes32(proof[0:32])), uint256(bytes32(proof[32:64]))],
            [
                [uint256(bytes32(proof[64:96])), uint256(bytes32(proof[96:128]))],
                [uint256(bytes32(proof[128:160])), uint256(bytes32(proof[160:192]))]
            ],
            [uint256(bytes32(proof[192:224])), uint256(bytes32(proof[224:256]))],
            input
        );

        require(isValid, "Invalid ZK proof");

        nullifierHashes[nullifierHash] = true;
        recipient.transfer(DEPOSIT_AMOUNT);

        emit Withdrawal(recipient, nullifierHash);
    }

    // Optional: withdraw stuck ETH
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
