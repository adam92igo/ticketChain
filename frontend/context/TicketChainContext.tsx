"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID, SEPOLIA_HEX_CHAIN_ID } from "@/config/app";
import { ticketChainAbi } from "@/config/ticketchainAbi";
import { getFriendlyError } from "@/lib/errors";
import { parseEth } from "@/lib/format";
import { normalizeTokenId } from "@/lib/ticketState";
import type {
  Concert,
  Contract,
  CreateConcertInput,
  InjectedEthereumProvider,
  OwnedTicket,
  TransactionState,
  Verification
} from "@/lib/ticketchainTypes";

type TicketChainContextValue = {
  address: string;
  chainId: number | null;
  owner: string;
  concerts: Concert[];
  myTickets: OwnedTicket[];
  getConcertTickets: (concertId: string) => Promise<Verification[]>;
  loading: boolean;
  contractReady: boolean;
  isSepolia: boolean;
  isOwner: boolean;
  networkLabel: string;
  transaction: TransactionState;
  transactionBusy: boolean;
  error: string;
  clearError: () => void;
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  refreshData: () => Promise<void>;
  createConcert: (input: CreateConcertInput) => Promise<boolean>;
  cancelConcert: (concertId: string) => Promise<boolean>;
  mintTicket: (concertId: string, to: string) => Promise<boolean>;
  buyTicket: (concert: Concert) => Promise<boolean>;
  listTicket: (tokenId: string, price: string) => Promise<boolean>;
  buyResaleTicket: (tokenId: string, price: bigint) => Promise<boolean>;
  transferTicket: (tokenId: string, to: string, declaredPrice: string) => Promise<boolean>;
  verifyTicket: (tokenId: string) => Promise<Verification>;
  markAsUsed: (tokenId: string) => Promise<boolean>;
};

const initialTransaction: TransactionState = {
  phase: "idle",
  label: "",
  message: "",
  hash: ""
};

const TicketChainContext = createContext<TicketChainContextValue | null>(null);

function getEthereum() {
  return (window as unknown as { ethereum?: InjectedEthereumProvider }).ethereum;
}

function mapVerification(data: Awaited<ReturnType<Contract["verifyTicket"]>>): Verification {
  return {
    exists: Boolean(data.exists),
    valid: Boolean(data.valid),
    tokenId: data.tokenId,
    concertId: data.concertId,
    concertName: data.concertName,
    location: data.location,
    date: data.date,
    owner: data.owner,
    concertActive: Boolean(data.concertActive),
    used: Boolean(data.used),
    maxResalePrice: data.maxResalePrice,
    listed: Boolean(data.listed),
    resalePrice: data.resalePrice
  };
}

export function TicketChainProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [owner, setOwner] = useState("");
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [myTickets, setMyTickets] = useState<OwnedTicket[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<TransactionState>(initialTransaction);

  const contractReady = Boolean(CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS));
  const isSepolia = chainId === EXPECTED_CHAIN_ID;
  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const transactionBusy = transaction.phase === "wallet" || transaction.phase === "pending";
  const networkLabel = useMemo(() => {
    if (chainId === null) return "Not connected";
    if (isSepolia) return "Sepolia";
    return `Chain ${chainId}`;
  }, [chainId, isSepolia]);

  const loadData = useCallback(async (activeContract: Contract, activeAddress: string) => {
    const contractOwner = (await activeContract.owner()) as string;
    const totalConcerts = (await activeContract.totalConcerts()) as bigint;
    const loadedConcerts: Concert[] = [];

    for (let id = 1; id <= Number(totalConcerts); id += 1) {
      const concert = await activeContract.getConcert(id);
      loadedConcerts.push({
        id: BigInt(id),
        name: concert.name,
        location: concert.location,
        date: concert.date,
        originalPrice: concert.originalPrice,
        maxResalePrice: concert.maxResalePrice,
        totalSupply: concert.totalSupply,
        minted: concert.minted,
        active: concert.active
      });
    }

    let loadedTickets: OwnedTicket[] = [];
    if (activeAddress) {
      const tokenIds = (await activeContract.tokensOfOwner(activeAddress)) as bigint[];
      loadedTickets = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const data = await activeContract.getTicket(tokenId);
          const concert = await activeContract.getConcert(data.concertId);
          const currentOwner = (await activeContract.ownerOf(tokenId)) as string;
          return {
            tokenId,
            concertId: data.concertId,
            concertName: concert.name,
            location: concert.location,
            date: concert.date,
            owner: currentOwner,
            concertActive: Boolean(concert.active),
            used: Boolean(data.used),
            maxResalePrice: data.maxResalePrice,
            listed: Boolean(data.listed),
            resalePrice: data.resalePrice
          };
        })
      );
    }

    setOwner(contractOwner);
    setConcerts(loadedConcerts);
    setMyTickets(loadedTickets);
  }, []);

  const synchronizeWallet = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum || !contractReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const nextChainId = Number(network.chainId);
      const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
      const nextAddress = accounts[0] || "";

      setChainId(nextChainId);
      setAddress(nextAddress);

      if (nextChainId !== EXPECTED_CHAIN_ID) {
        setContract(null);
        setOwner("");
        setConcerts([]);
        setMyTickets([]);
        return;
      }

      const activeContract = nextAddress
        ? new ethers.Contract(CONTRACT_ADDRESS, ticketChainAbi, await provider.getSigner())
        : new ethers.Contract(CONTRACT_ADDRESS, ticketChainAbi, provider);
      setContract(activeContract);
      await loadData(activeContract, nextAddress);
      setError("");
    } catch (err) {
      setError(getFriendlyError(err, "Could not load TicketChain from Sepolia."));
    } finally {
      setLoading(false);
    }
  }, [contractReady, loadData]);

  const connectWallet = useCallback(async () => {
    setError("");
    setTransaction(initialTransaction);
    try {
      const ethereum = getEthereum();
      if (!ethereum) throw new Error("MetaMask is not available in this browser.");
      await ethereum.request({ method: "eth_requestAccounts" });
      await synchronizeWallet();
    } catch (err) {
      setError(getFriendlyError(err, "Wallet connection failed."));
    }
  }, [synchronizeWallet]);

  const switchToSepolia = useCallback(async () => {
    setError("");
    try {
      const ethereum = getEthereum();
      if (!ethereum) throw new Error("MetaMask is not available in this browser.");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }]
      });
      await synchronizeWallet();
    } catch (err) {
      setError(getFriendlyError(err, "Could not switch network."));
    }
  }, [synchronizeWallet]);

  const refreshData = useCallback(async () => {
    if (!contract || !isSepolia) return;
    setLoading(true);
    setError("");
    try {
      await loadData(contract, address);
    } catch (err) {
      setError(getFriendlyError(err, "Could not refresh TicketChain data."));
    } finally {
      setLoading(false);
    }
  }, [address, contract, isSepolia, loadData]);

  const runTransaction = useCallback(
    async (label: string, action: (activeContract: Contract) => Promise<ethers.ContractTransactionResponse>) => {
      if (!address || !contract) {
        setError("Connect your wallet first.");
        return false;
      }
      if (!isSepolia) {
        setError("Switch MetaMask to Sepolia before sending transactions.");
        return false;
      }

      setError("");
      setTransaction({
        phase: "wallet",
        label,
        message: `${label}: confirm the transaction in MetaMask.`,
        hash: ""
      });

      let txHash = "";
      try {
        const tx = await action(contract);
        txHash = tx.hash;
        setTransaction({
          phase: "pending",
          label,
          message: `${label}: transaction pending on Sepolia.`,
          hash: tx.hash
        });
        const receipt = await tx.wait();
        if (receipt?.status === 0) throw new Error("Transaction reverted on-chain.");
        await loadData(contract, address);
        setTransaction({
          phase: "confirmed",
          label,
          message: `${label}: transaction confirmed on Sepolia.`,
          hash: tx.hash
        });
        return true;
      } catch (err) {
        setTransaction({
          phase: "failed",
          label,
          message: `${label}: ${getFriendlyError(err, "Transaction failed.")}`,
          hash: txHash
        });
        return false;
      }
    },
    [address, contract, isSepolia, loadData]
  );

  const createConcert = useCallback(
    (input: CreateConcertInput) =>
      runTransaction("Creating concert", (activeContract) =>
        activeContract.createConcert(
          input.name,
          input.location,
          input.date,
          parseEth(input.originalPrice),
          parseEth(input.maxResalePrice),
          BigInt(input.totalSupply)
        )
      ),
    [runTransaction]
  );

  const cancelConcert = useCallback(
    (concertId: string) =>
      runTransaction("Cancelling concert", (activeContract) =>
        activeContract.cancelConcert(BigInt(normalizeTokenId(concertId)))
      ),
    [runTransaction]
  );

  const mintTicket = useCallback(
    (concertId: string, to: string) =>
      runTransaction("Minting ticket", (activeContract) => activeContract.mintTicket(BigInt(concertId), to)),
    [runTransaction]
  );

  const buyTicket = useCallback(
    (concert: Concert) =>
      runTransaction("Buying ticket", (activeContract) =>
        activeContract.buyTicket(concert.id, { value: concert.originalPrice })
      ),
    [runTransaction]
  );

  const listTicket = useCallback(
    (tokenId: string, price: string) =>
      runTransaction("Listing ticket", (activeContract) =>
        activeContract.listTicket(BigInt(normalizeTokenId(tokenId)), parseEth(price))
      ),
    [runTransaction]
  );

  const buyResaleTicket = useCallback(
    (tokenId: string, price: bigint) =>
      runTransaction("Buying resale ticket", (activeContract) =>
        activeContract.buyResaleTicket(BigInt(normalizeTokenId(tokenId)), { value: price })
      ),
    [runTransaction]
  );

  const transferTicket = useCallback(
    (tokenId: string, to: string, declaredPrice: string) =>
      runTransaction("Transferring ticket", (activeContract) =>
        activeContract.transferTicket(to, BigInt(normalizeTokenId(tokenId)), parseEth(declaredPrice))
      ),
    [runTransaction]
  );

  const getReadContract = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error("MetaMask is required to verify this ticket in the demo.");
    if (!contractReady) throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local.");
    const provider = new ethers.BrowserProvider(ethereum);
    const network = await provider.getNetwork();
    const nextChainId = Number(network.chainId);
    setChainId(nextChainId);
    if (nextChainId !== EXPECTED_CHAIN_ID) {
      throw new Error("Switch MetaMask to Sepolia before verifying the ticket.");
    }
    return new ethers.Contract(CONTRACT_ADDRESS, ticketChainAbi, provider);
  }, [contractReady]);

  const verifyTicket = useCallback(
    async (tokenId: string) => {
      const normalized = normalizeTokenId(tokenId);
      const readContract = await getReadContract();
      const data = await readContract.verifyTicket(BigInt(normalized));
      return mapVerification(data);
    },
    [getReadContract]
  );

  const getConcertTickets = useCallback(
    async (concertId: string) => {
      const normalizedConcertId = normalizeTokenId(concertId);
      const readContract = await getReadContract();
      const tokenIds = (await readContract.getConcertTicketIds(BigInt(normalizedConcertId))) as bigint[];
      return Promise.all(
        tokenIds.map(async (tokenId) => mapVerification(await readContract.verifyTicket(tokenId)))
      );
    },
    [getReadContract]
  );

  const markAsUsed = useCallback(
    (tokenId: string) =>
      runTransaction("Marking ticket as used", (activeContract) =>
        activeContract.markAsUsed(BigInt(normalizeTokenId(tokenId)))
      ),
    [runTransaction]
  );

  useEffect(() => {
    void synchronizeWallet();
    const ethereum = getEthereum();
    if (!ethereum) return;
    const handleWalletChange = () => void synchronizeWallet();
    ethereum.on?.("accountsChanged", handleWalletChange);
    ethereum.on?.("chainChanged", handleWalletChange);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleWalletChange);
      ethereum.removeListener?.("chainChanged", handleWalletChange);
    };
  }, [synchronizeWallet]);

  const value = useMemo<TicketChainContextValue>(
    () => ({
      address,
      chainId,
      owner,
      concerts,
      myTickets,
      getConcertTickets,
      loading,
      contractReady,
      isSepolia,
      isOwner,
      networkLabel,
      transaction,
      transactionBusy,
      error,
      clearError: () => setError(""),
      connectWallet,
      switchToSepolia,
      refreshData,
      createConcert,
      cancelConcert,
      mintTicket,
      buyTicket,
      listTicket,
      buyResaleTicket,
      transferTicket,
      verifyTicket,
      markAsUsed
    }),
    [
      address,
      chainId,
      owner,
      concerts,
      myTickets,
      getConcertTickets,
      loading,
      contractReady,
      isSepolia,
      isOwner,
      networkLabel,
      transaction,
      transactionBusy,
      error,
      connectWallet,
      switchToSepolia,
      refreshData,
      createConcert,
      cancelConcert,
      mintTicket,
      buyTicket,
      listTicket,
      buyResaleTicket,
      transferTicket,
      verifyTicket,
      markAsUsed
    ]
  );

  return <TicketChainContext.Provider value={value}>{children}</TicketChainContext.Provider>;
}

export function useTicketChain() {
  const context = useContext(TicketChainContext);
  if (!context) throw new Error("useTicketChain must be used inside TicketChainProvider.");
  return context;
}
