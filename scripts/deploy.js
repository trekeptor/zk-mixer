const hre = require("hardhat");

async function main() {
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  const Mixer = await hre.ethers.getContractFactory("Mixer");
  const mixer = await Mixer.deploy(verifier.address);
  await mixer.deployed();
  console.log("Mixer deployed to:", mixer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

