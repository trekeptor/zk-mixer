const snarkjs = require("snarkjs");
const circomlib = require("circomlibjs");
const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");
const path = require("path");
const { babyJub, F1Field } = require("ffjavascript");

async function run() {
  const poseidon = await buildPoseidon();

  // Step 1: Random inputs
  const secret = BigInt("0x" + crypto.randomUUID().replace(/-/g, ""));
  const nullifier = BigInt("0x" + crypto.randomUUID().replace(/-/g, ""));

  const commitment = poseidon.F.toObject(poseidon([secret, nullifier]));
  const nullifierHash = poseidon.F.toObject(poseidon([nullifier]));

  // Step 2: Simulate Merkle tree (single-leaf)
  const treeDepth = 20;
  const zero = BigInt(0);
  let root = commitment;

  for (let i = 0; i < treeDepth; i++) {
    root = poseidon([root, zero]);
  }

  // Step 3: Create input.json for witness generation
  const input = {
    secret: secret.toString(),
    nullifier: nullifier.toString(),
    pathElements: Array(treeDepth).fill("0"),
    pathIndices: Array(treeDepth).fill("0"),
    root: root.toString(),
    nullifierHash: nullifierHash.toString()
  };

  fs.writeFileSync("input.json", JSON.stringify(input, null, 2));

  // Step 4: Generate witness and proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "circuits/Mixer_js/Mixer.wasm",
    "circuits/mixer_final.zkey"
  );

  console.log("✅ Proof generated");
  console.log("Public signals:", publicSignals);

  // Step 5: Format proof for Solidity
  const solidityProof = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const flatArgs = JSON.parse("[" + solidityProof + "]");

  fs.writeFileSync("proof-data.json", JSON.stringify({
    proof: flatArgs.slice(0, 8), // a, b, c
    inputs: flatArgs.slice(8),   // root, nullifierHash
    commitment,
    nullifierHash
  }, null, 2));
}

run();

