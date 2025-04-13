pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/merkleTree.circom";

template Mixer(depth) {
    signal input secret;
    signal input nullifier;
    signal input pathElements[depth];
    signal input pathIndices[depth];

    signal input root;
    signal input nullifierHash;

    component hasher1 = Poseidon(2);
    hasher1.inputs[0] <== secret;
    hasher1.inputs[1] <== nullifier;
    signal commitment = hasher1.out;

    component tree = MerkleProof(depth);
    for (var i = 0; i < depth; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    tree.leaf <== commitment;

    root === tree.root;

    component hasher2 = Poseidon(1);
    hasher2.inputs[0] <== nullifier;
    nullifierHash === hasher2.out;
}

component main = Mixer(20);
