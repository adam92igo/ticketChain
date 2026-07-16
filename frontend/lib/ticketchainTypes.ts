export type Contract = import("ethers").Contract;

export type Concert = {
  id: bigint;
  name: string;
  location: string;
  date: string;
  originalPrice: bigint;
  maxResalePrice: bigint;
  totalSupply: bigint;
  minted: bigint;
  active: boolean;
};

export type OwnedTicket = {
  tokenId: bigint;
  concertId: bigint;
  concertName: string;
  location: string;
  date: string;
  owner: string;
  concertActive: boolean;
  used: boolean;
  maxResalePrice: bigint;
  listed: boolean;
  resalePrice: bigint;
};

export type Verification = OwnedTicket & {
  exists: boolean;
  valid: boolean;
};

export type TransactionState = {
  phase: "idle" | "wallet" | "pending" | "confirmed" | "failed";
  label: string;
  message: string;
  hash: string;
};

export type CreateConcertInput = {
  name: string;
  location: string;
  date: string;
  originalPrice: string;
  maxResalePrice: string;
  totalSupply: string;
};

export type InjectedEthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};
