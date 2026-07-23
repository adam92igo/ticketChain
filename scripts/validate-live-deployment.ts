import { randomBytes } from "node:crypto";
import { network } from "hardhat";

const DEPLOYED_ADDRESS = "0x89Fb40bD170C0FB93e7B3575f19b09b6A49F70DE";
const CHAIN_ID = 11155111;

const { ethers } = await network.create();

type StepResult = {
  step: string;
  outcome: "pass" | "fail";
  detail: string;
  txHash?: string;
};

const results: StepResult[] = [];

function record(step: string, outcome: "pass" | "fail", detail: string, txHash?: string) {
  results.push({ step, outcome, detail, txHash });
  const marker = outcome === "pass" ? "PASS" : "FAIL";
  console.log(`[${marker}] ${step} — ${detail}${txHash ? ` (tx ${txHash})` : ""}`);
}

async function expectRevert(step: string, fn: () => Promise<unknown>, expectedSubstring: string) {
  try {
    await fn();
    record(step, "fail", "expected a revert but the call succeeded");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes(expectedSubstring)) {
      record(step, "pass", `reverted as expected ("${expectedSubstring}")`);
    } else {
      record(step, "fail", `reverted, but not with the expected reason: ${message.slice(0, 200)}`);
    }
  }
}

function createGateHolderProofMessage(params: {
  contractAddress: string;
  chainId: number;
  tokenId: string;
  nonce: string;
  expiresAt: number;
}): string {
  return [
    "TicketChain Gate Holder Proof",
    `Contract: ${params.contractAddress}`,
    `Chain ID: ${params.chainId}`,
    `Token ID: ${params.tokenId}`,
    `Nonce: ${params.nonce}`,
    `Expires At: ${params.expiresAt}`
  ].join("\n");
}

async function main() {
  const [owner] = await ethers.getSigners();
  const contract = await ethers.getContractAt("TicketChain", DEPLOYED_ADDRESS, owner);

  console.log(`Owner/deployer: ${owner.address}`);
  console.log(`Contract: ${DEPLOYED_ADDRESS}`);

  const holderWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const buyerWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`Ephemeral holder wallet: ${holderWallet.address}`);
  console.log(`Ephemeral buyer wallet:  ${buyerWallet.address}`);

  const fundHolderTx = await owner.sendTransaction({ to: holderWallet.address, value: ethers.parseEther("0.004") });
  await fundHolderTx.wait();
  const fundBuyerTx = await owner.sendTransaction({ to: buyerWallet.address, value: ethers.parseEther("0.003") });
  await fundBuyerTx.wait();
  record("Fund ephemeral wallets", "pass", "holder +0.004 ETH, buyer +0.003 ETH", fundHolderTx.hash);

  const contractAsHolder = contract.connect(holderWallet);
  const contractAsBuyer = contract.connect(buyerWallet);

  const originalPrice = ethers.parseEther("0.001");
  const maxResalePrice = ethers.parseEther("0.0015");
  const resalePrice = ethers.parseEther("0.0012");

  // --- Concert 1: primary purchase, resale, gate holder-proof, mark-as-used, double-use ---
  const createTx = await contract.createConcert(
    "Wavecode Validation Run",
    "Automated Validation",
    "2026-08-01",
    originalPrice,
    maxResalePrice,
    5n
  );
  await createTx.wait();
  const concertId1 = await contract.totalConcerts();
  record("Create concert #1", "pass", `concertId ${concertId1}`, createTx.hash);

  const buyTx = await contractAsHolder.buyTicket(concertId1, { value: originalPrice });
  await buyTx.wait();
  const ticketIds1 = await contract.getConcertTicketIds(concertId1);
  const tokenId1 = ticketIds1[ticketIds1.length - 1];
  record("Primary purchase (buyTicket)", "pass", `tokenId ${tokenId1} owned by holder`, buyTx.hash);

  const verify1 = await contract.verifyTicket(tokenId1);
  if (verify1.valid && verify1.owner.toLowerCase() === holderWallet.address.toLowerCase()) {
    record("Verify ticket after primary purchase", "pass", "valid=true, owner=holder wallet");
  } else {
    record("Verify ticket after primary purchase", "fail", `valid=${verify1.valid}, owner=${verify1.owner}`);
  }

  const listTx = await contractAsHolder.listTicket(tokenId1, resalePrice);
  await listTx.wait();
  record("List ticket for resale", "pass", `listed at ${ethers.formatEther(resalePrice)} ETH`, listTx.hash);

  const resaleTx = await contractAsBuyer.buyResaleTicket(tokenId1, { value: resalePrice });
  await resaleTx.wait();
  const verifyAfterResale = await contract.verifyTicket(tokenId1);
  if (verifyAfterResale.owner.toLowerCase() === buyerWallet.address.toLowerCase() && !verifyAfterResale.listed) {
    record("Concert-scoped resale purchase", "pass", "ownership transferred to buyer wallet, listing cleared", resaleTx.hash);
  } else {
    record("Concert-scoped resale purchase", "fail", `owner=${verifyAfterResale.owner}, listed=${verifyAfterResale.listed}`);
  }

  // --- Gate holder-proof protocol mechanics (off-chain signature, checked against the fresh on-chain owner) ---
  const nonce = randomBytes(32).toString("hex");
  const challenge = {
    contractAddress: ethers.getAddress(DEPLOYED_ADDRESS),
    chainId: CHAIN_ID,
    tokenId: tokenId1.toString(),
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000
  };
  const message = createGateHolderProofMessage(challenge);
  const signature = await buyerWallet.signMessage(message);
  const recoveredSigner = ethers.verifyMessage(message, signature);
  const currentOwner = (await contract.verifyTicket(tokenId1)).owner;
  if (
    recoveredSigner.toLowerCase() === buyerWallet.address.toLowerCase() &&
    recoveredSigner.toLowerCase() === currentOwner.toLowerCase()
  ) {
    record("Gate holder-proof signature", "pass", "recovered signer matches the current on-chain owner");
  } else {
    record("Gate holder-proof signature", "fail", `recovered ${recoveredSigner}, on-chain owner ${currentOwner}`);
  }

  const markUsedTx = await contract.markAsUsed(tokenId1);
  await markUsedTx.wait();
  const verifyUsed = await contract.verifyTicket(tokenId1);
  if (verifyUsed.used && !verifyUsed.valid) {
    record("Mark as used (gate entry)", "pass", "used=true, valid=false", markUsedTx.hash);
  } else {
    record("Mark as used (gate entry)", "fail", `used=${verifyUsed.used}, valid=${verifyUsed.valid}`);
  }

  await expectRevert("Reject double mark-as-used", () => contract.markAsUsed(tokenId1), "Ticket already used");
  await expectRevert(
    "Reject ERC-721 transfer of a used ticket",
    () => contractAsBuyer.transferTicket(holderWallet.address, tokenId1, 0n),
    "Ticket already used"
  );

  // --- Concert 2: partner-sale issuance + cancellation expiry ---
  const createTx2 = await contract.createConcert(
    "Wavecode Validation Run (Cancellation)",
    "Automated Validation",
    "2026-08-02",
    originalPrice,
    maxResalePrice,
    5n
  );
  await createTx2.wait();
  const concertId2 = await contract.totalConcerts();
  record("Create concert #2", "pass", `concertId ${concertId2}`, createTx2.hash);

  const mintTx = await contract.mintTicket(concertId2, holderWallet.address);
  await mintTx.wait();
  const ticketIds2 = await contract.getConcertTicketIds(concertId2);
  const tokenId2 = ticketIds2[ticketIds2.length - 1];
  record("Partner-sale issuance (mintTicket)", "pass", `tokenId ${tokenId2} owned by holder`, mintTx.hash);

  const cancelTx = await contract.cancelConcert(concertId2);
  await cancelTx.wait();
  record("Cancel concert #2", "pass", "concert.active set to false", cancelTx.hash);

  const verifyCancelled = await contract.verifyTicket(tokenId2);
  if (!verifyCancelled.valid && !verifyCancelled.concertActive) {
    record("Verify ticket is Expired after cancellation", "pass", "valid=false, concertActive=false");
  } else {
    record("Verify ticket is Expired after cancellation", "fail", `valid=${verifyCancelled.valid}, concertActive=${verifyCancelled.concertActive}`);
  }

  await expectRevert(
    "Reject listing a cancelled-concert ticket",
    () => contractAsHolder.listTicket(tokenId2, resalePrice),
    "Concert inactive"
  );
  await expectRevert(
    "Reject ERC-721 transfer of a cancelled-concert ticket",
    () => contractAsHolder.transferTicket(buyerWallet.address, tokenId2, 0n),
    "Concert inactive"
  );

  const withdrawTx = await contract.withdraw();
  await withdrawTx.wait();
  record("Owner withdraw", "pass", "primary-sale funds swept back to the owner", withdrawTx.hash);

  const passCount = results.filter((r) => r.outcome === "pass").length;
  console.log(`\n${passCount}/${results.length} steps passed.`);
  console.log("\n--- JSON summary ---");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
