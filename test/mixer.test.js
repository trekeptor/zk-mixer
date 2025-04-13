const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZK Mixer", function () {
  let mixer, verifier, owner;
  const DEPOSIT = ethers.utils.parseEther("0.1");

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy();
    await verifier.deployed();

    const Mixer = await ethers.getContractFactory("Mixer");
    mixer = await Mixer.deploy(verifier.address);
    await mixer.deployed();
  });

  it("should accept a deposit", async () => {
    const fakeCommitment = ethers.utils.formatBytes32String("test1");
    await expect(mixer.deposit(fakeCommitment, { value: DEPOSIT }))
      .to.emit(mixer, "Deposit")
      .withArgs(fakeCommitment);

    expect(await mixer.commitments(fakeCommitment)).to.equal(true);
  });
});

