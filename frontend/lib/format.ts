import { ethers } from "ethers";

export function shortAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value: bigint) {
  return `${ethers.formatEther(value)} ETH`;
}

export function parseEth(value: string) {
  return ethers.parseEther(value || "0");
}

export function sepoliaTxUrl(hash: string) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function sepoliaAddressUrl(address: string) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

export function sepoliaNftUrl(contractAddress: string, tokenId: bigint) {
  return `https://sepolia.etherscan.io/nft/${contractAddress}/${tokenId.toString()}`;
}
