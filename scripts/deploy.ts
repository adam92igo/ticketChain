import { network } from "hardhat";

const { ethers } = await network.create();

const ticketChain = await ethers.deployContract("TicketChain");
await ticketChain.waitForDeployment();

const address = await ticketChain.getAddress();

console.log(`TicketChain deployed to: ${address}`);
console.log(`Sepolia Etherscan: https://sepolia.etherscan.io/address/${address}`);
