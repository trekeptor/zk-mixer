const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

async function main() {
  const proofData = JSON.parse(fs.readFileSync("proof-data.json"));

  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const mixerABI = [
    "function withdraw(bytes, uint256[2], address) external",
    "function nullifierHashes(bytes32) view returns (bool)"
  ];

  const mixer = new ethers.Contract(process.env.MIXER_CONTRACT, mixerABI, wallet);

  const proof = proofData.proof.flatMap(x => ethers.utils.hexZeroPad(ethers.BigNumber.from(x).toHexString(), 32));
  const calldata = "0x" + proof.map(x => x.slice(2)).join("");
  const inputs = proofData.inputs.map(x => ethers.BigNumber.from(x));

  const nullifierUsed = await mixer.nullifierHashes(ethers.utils.hexZeroPad(ethers.BigNumber.from(proofData.nullifierHash).toHexString(), 32));
  if (nullifierUsed) {
    console.log("❌ Nullifier already used.");
    return;
  }

  const tx = await mixer.withdraw(calldata, inputs, wallet.address, { gasLimit: 500000 });
  await tx.wait();

  console.log("✅ Withdrawal successful:", tx.hash);
}

main().catch(console.error);
