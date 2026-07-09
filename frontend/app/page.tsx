"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  BadgeDollarSign,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Ticket,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { ticketChainAbi } from "@/config/ticketchainAbi";
import { formatEth, parseEth, sepoliaAddressUrl, sepoliaNftUrl, sepoliaTxUrl, shortAddress } from "@/lib/format";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

type Contract = ethers.Contract;

type Concert = {
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

type OwnedTicket = {
  tokenId: bigint;
  concertId: bigint;
  concertName: string;
  location: string;
  date: string;
  owner: string;
  used: boolean;
  maxResalePrice: bigint;
  listed: boolean;
  resalePrice: bigint;
};

type Verification = OwnedTicket & {
  exists: boolean;
  valid: boolean;
};

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

const emptyCreateForm = {
  name: "FinTech Summer Beats",
  location: "Madrid Arena",
  date: "2026-08-15",
  originalPrice: "0.02",
  maxResalePrice: "0.05",
  totalSupply: "50"
};

export default function Home() {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [owner, setOwner] = useState("");
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [myTickets, setMyTickets] = useState<OwnedTicket[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [mintForm, setMintForm] = useState({ concertId: "1", to: "" });
  const [resaleForm, setResaleForm] = useState({ tokenId: "", price: "0.03" });
  const [buyResaleForm, setBuyResaleForm] = useState({ tokenId: "", price: "0.03" });
  const [transferForm, setTransferForm] = useState({ tokenId: "", to: "", declaredPrice: "0" });
  const [verifyTokenId, setVerifyTokenId] = useState("");
  const [gateTokenId, setGateTokenId] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [successHash, setSuccessHash] = useState("");

  const isSepolia = chainId === EXPECTED_CHAIN_ID;
  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const contractReady = Boolean(CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS));

  const networkLabel = useMemo(() => {
    if (chainId === null) return "Not connected";
    if (chainId === EXPECTED_CHAIN_ID) return "Sepolia";
    return `Chain ${chainId}`;
  }, [chainId]);

  const getSignerContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not available in this browser.");
    }
    if (!contractReady) {
      throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const network = await provider.getNetwork();
    const appContract = new ethers.Contract(CONTRACT_ADDRESS, ticketChainAbi, signer);

    setAddress(signerAddress);
    setChainId(Number(network.chainId));
    setContract(appContract);
    return { appContract, signerAddress };
  }, [contractReady]);

  const refreshData = useCallback(
    async (activeContract = contract, activeAddress = address) => {
      if (!activeContract || !activeAddress) return;

      const contractOwner = (await activeContract.owner()) as string;
      const totalConcerts = (await activeContract.totalConcerts()) as bigint;
      const loadedConcerts: Concert[] = [];

      for (let id = 1; id <= Number(totalConcerts); id++) {
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

      const tokenIds = (await activeContract.tokensOfOwner(activeAddress)) as bigint[];
      const loadedTickets = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const data = await activeContract.getTicket(tokenId);
          const ticketConcert = await activeContract.getConcert(data.concertId);
          const currentOwner = (await activeContract.ownerOf(tokenId)) as string;

          return {
            tokenId,
            concertId: data.concertId,
            concertName: ticketConcert.name,
            location: ticketConcert.location,
            date: ticketConcert.date,
            owner: currentOwner,
            used: data.used,
            maxResalePrice: data.maxResalePrice,
            listed: data.listed,
            resalePrice: data.resalePrice
          };
        })
      );

      setOwner(contractOwner);
      setConcerts(loadedConcerts);
      setMyTickets(loadedTickets);
    },
    [address, contract]
  );

  const connectWallet = async () => {
    setError("");
    setSuccessHash("");
    try {
      await window.ethereum?.request({ method: "eth_requestAccounts" });
      const { appContract, signerAddress } = await getSignerContract();
      await refreshData(appContract, signerAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    }
  };

  const switchToSepolia = async () => {
    setError("");
    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
      const { appContract, signerAddress } = await getSignerContract();
      await refreshData(appContract, signerAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch network.");
    }
  };

  const runTransaction = async (label: string, action: () => Promise<ethers.ContractTransactionResponse>) => {
    if (!contract) {
      setError("Connect your wallet first.");
      return;
    }
    if (!isSepolia) {
      setError("Switch MetaMask to Sepolia before sending transactions.");
      return;
    }

    setPending(label);
    setError("");
    setSuccessHash("");

    try {
      const tx = await action();
      setSuccessHash(tx.hash);
      await tx.wait();
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed.");
    } finally {
      setPending("");
    }
  };

  const createConcert = async () => {
    await runTransaction("Creating concert", () =>
      contract!.createConcert(
        createForm.name,
        createForm.location,
        createForm.date,
        parseEth(createForm.originalPrice),
        parseEth(createForm.maxResalePrice),
        BigInt(createForm.totalSupply)
      )
    );
  };

  const mintTicket = async () => {
    await runTransaction("Minting ticket", () => contract!.mintTicket(BigInt(mintForm.concertId), mintForm.to));
  };

  const buyTicket = async (concert: Concert) => {
    await runTransaction("Buying ticket", () => contract!.buyTicket(concert.id, { value: concert.originalPrice }));
  };

  const listTicket = async () => {
    await runTransaction("Listing ticket", () => contract!.listTicket(BigInt(resaleForm.tokenId), parseEth(resaleForm.price)));
  };

  const buyResaleTicket = async () => {
    await runTransaction("Buying resale ticket", () =>
      contract!.buyResaleTicket(BigInt(buyResaleForm.tokenId), { value: parseEth(buyResaleForm.price) })
    );
  };

  const transferTicket = async () => {
    await runTransaction("Transferring ticket", () =>
      contract!.transferTicket(transferForm.to, BigInt(transferForm.tokenId), parseEth(transferForm.declaredPrice))
    );
  };

  const markAsUsed = async () => {
    await runTransaction("Marking ticket as used", () => contract!.markAsUsed(BigInt(gateTokenId)));
  };

  const verifyTicket = async () => {
    if (!contract) {
      setError("Connect your wallet first.");
      return;
    }

    setError("");
    setVerification(null);

    try {
      const data = await contract.verifyTicket(BigInt(verifyTokenId));
      setVerification({
        exists: data.exists,
        valid: data.valid,
        tokenId: data.tokenId,
        concertId: data.concertId,
        concertName: data.concertName,
        location: data.location,
        date: data.date,
        owner: data.owner,
        used: data.used,
        maxResalePrice: data.maxResalePrice,
        listed: data.listed,
        resalePrice: data.resalePrice
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    }
  };

  useEffect(() => {
    const handleAccountsChanged = () => {
      void connectWallet();
    };
    const handleChainChanged = () => {
      void connectWallet();
    };

    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum?.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">TicketChain</p>
          <h1>Authentic concert tickets, verified on-chain.</h1>
        </div>
        <div className="wallet-strip">
          <Badge tone={isSepolia ? "green" : "red"}>{networkLabel}</Badge>
          {address ? <span className="address-pill">{shortAddress(address)}</span> : null}
          <button className="icon-button" onClick={() => void refreshData()} disabled={!contract || Boolean(pending)} title="Refresh">
            <RefreshCw size={18} />
          </button>
          {address ? (
            <a className="icon-link" href={sepoliaAddressUrl(address)} target="_blank" rel="noreferrer" title="Open wallet on Etherscan">
              <ExternalLink size={18} />
            </a>
          ) : (
            <button className="primary-button" onClick={() => void connectWallet()}>
              <Wallet size={18} />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {!contractReady ? <div className="notice error">Set NEXT_PUBLIC_CONTRACT_ADDRESS before using the dApp.</div> : null}
      {address && !isSepolia ? (
        <div className="notice error">
          MetaMask is connected to {networkLabel}. <button onClick={() => void switchToSepolia()}>Switch to Sepolia</button>
        </div>
      ) : null}
      {pending ? <div className="notice pending">{pending}. Waiting for confirmation...</div> : null}
      {successHash ? (
        <div className="notice success">
          Transaction submitted:{" "}
          <a href={sepoliaTxUrl(successHash)} target="_blank" rel="noreferrer">
            {shortAddress(successHash)}
          </a>
        </div>
      ) : null}
      {error ? <div className="notice error">{error}</div> : null}

      <section className="dashboard-grid">
        <section className="workspace span-2">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Live inventory</p>
              <h2>Concerts</h2>
            </div>
            <Badge tone="blue">{concerts.length} on-chain</Badge>
          </div>
          <div className="concert-grid">
            {concerts.length === 0 ? <p className="empty">No concerts yet. Create one with the owner wallet.</p> : null}
            {concerts.map((concert) => (
              <article className="concert-card" key={concert.id.toString()}>
                <div className="ticket-stub">
                  <Ticket size={20} />
                  #{concert.id.toString()}
                </div>
                <h3>{concert.name}</h3>
                <p>{concert.location}</p>
                <p>{concert.date}</p>
                <div className="metrics">
                  <span>{formatEth(concert.originalPrice)}</span>
                  <span>
                    {concert.minted.toString()} / {concert.totalSupply.toString()} minted
                  </span>
                </div>
                <div className="card-actions">
                  <button onClick={() => void buyTicket(concert)} disabled={!address || Boolean(pending) || concert.minted >= concert.totalSupply}>
                    <BadgeDollarSign size={17} />
                    Buy Ticket
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Owner desk</p>
              <h2>Create Concert</h2>
            </div>
            <Badge tone={isOwner ? "green" : "amber"}>{isOwner ? "Owner" : "Owner only"}</Badge>
          </div>
          <FormInput label="Name" value={createForm.name} onChange={(value) => setCreateForm({ ...createForm, name: value })} />
          <FormInput label="Location" value={createForm.location} onChange={(value) => setCreateForm({ ...createForm, location: value })} />
          <FormInput label="Date" value={createForm.date} onChange={(value) => setCreateForm({ ...createForm, date: value })} />
          <div className="two-col">
            <FormInput label="Initial ETH" value={createForm.originalPrice} onChange={(value) => setCreateForm({ ...createForm, originalPrice: value })} />
            <FormInput label="Max resale ETH" value={createForm.maxResalePrice} onChange={(value) => setCreateForm({ ...createForm, maxResalePrice: value })} />
          </div>
          <FormInput label="Total tickets" value={createForm.totalSupply} onChange={(value) => setCreateForm({ ...createForm, totalSupply: value })} />
          <button className="primary-button full" onClick={() => void createConcert()} disabled={!isOwner || Boolean(pending)}>
            <Plus size={18} />
            Create Concert
          </button>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Primary issue</p>
              <h2>Mint Ticket</h2>
            </div>
            <Badge tone="amber">Owner only</Badge>
          </div>
          <FormInput label="Concert ID" value={mintForm.concertId} onChange={(value) => setMintForm({ ...mintForm, concertId: value })} />
          <FormInput label="Recipient wallet" value={mintForm.to} onChange={(value) => setMintForm({ ...mintForm, to: value })} />
          <button className="primary-button full" onClick={() => void mintTicket()} disabled={!isOwner || Boolean(pending)}>
            <Ticket size={18} />
            Mint Ticket
          </button>
        </section>

        <section className="workspace span-2">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Wallet vault</p>
              <h2>My Tickets</h2>
            </div>
            <Badge tone="blue">{myTickets.length} owned</Badge>
          </div>
          <div className="ticket-grid">
            {myTickets.length === 0 ? <p className="empty">No tickets in this wallet yet.</p> : null}
            {myTickets.map((ticket) => (
              <article className="owned-ticket" key={ticket.tokenId.toString()}>
                <div className="ticket-row">
                  <strong>Token #{ticket.tokenId.toString()}</strong>
                  <Badge tone={ticket.used ? "red" : ticket.listed ? "amber" : "green"}>{ticket.used ? "Used" : ticket.listed ? "For sale" : "Valid"}</Badge>
                </div>
                <h3>{ticket.concertName}</h3>
                <p>
                  {ticket.location} · {ticket.date}
                </p>
                <p>Owner: {shortAddress(ticket.owner)}</p>
                <p>Max resale: {formatEth(ticket.maxResalePrice)}</p>
                {ticket.listed ? <p>Listed at: {formatEth(ticket.resalePrice)}</p> : null}
                <a href={sepoliaNftUrl(CONTRACT_ADDRESS, ticket.tokenId)} target="_blank" rel="noreferrer">
                  View NFT on Sepolia <ExternalLink size={14} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Secondary market</p>
              <h2>Resell</h2>
            </div>
            <Badge tone="gray">Max price enforced</Badge>
          </div>
          <FormInput label="Token ID" value={resaleForm.tokenId} onChange={(value) => setResaleForm({ ...resaleForm, tokenId: value })} />
          <FormInput label="Price ETH" value={resaleForm.price} onChange={(value) => setResaleForm({ ...resaleForm, price: value })} />
          <button className="primary-button full" onClick={() => void listTicket()} disabled={!address || Boolean(pending)}>
            <BadgeDollarSign size={18} />
            List Ticket
          </button>
          <div className="divider" />
          <FormInput label="Listed token ID" value={buyResaleForm.tokenId} onChange={(value) => setBuyResaleForm({ ...buyResaleForm, tokenId: value })} />
          <FormInput label="Listed price ETH" value={buyResaleForm.price} onChange={(value) => setBuyResaleForm({ ...buyResaleForm, price: value })} />
          <button className="secondary-button full" onClick={() => void buyResaleTicket()} disabled={!address || Boolean(pending)}>
            Buy Resale Ticket
          </button>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Controlled move</p>
              <h2>Transfer</h2>
            </div>
            <Badge tone="gray">Declared price check</Badge>
          </div>
          <FormInput label="Token ID" value={transferForm.tokenId} onChange={(value) => setTransferForm({ ...transferForm, tokenId: value })} />
          <FormInput label="Recipient wallet" value={transferForm.to} onChange={(value) => setTransferForm({ ...transferForm, to: value })} />
          <FormInput
            label="Declared price ETH"
            value={transferForm.declaredPrice}
            onChange={(value) => setTransferForm({ ...transferForm, declaredPrice: value })}
          />
          <button className="primary-button full" onClick={() => void transferTicket()} disabled={!address || Boolean(pending)}>
            <Send size={18} />
            Transfer Ticket
          </button>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Public check</p>
              <h2>Verify Ticket</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          <FormInput label="Token ID" value={verifyTokenId} onChange={setVerifyTokenId} />
          <button className="primary-button full" onClick={() => void verifyTicket()} disabled={!address}>
            <ShieldCheck size={18} />
            Verify Ticket
          </button>
          {verification ? (
            <div className="verification-result">
              <Badge tone={!verification.exists ? "red" : verification.valid ? "green" : "red"}>
                {!verification.exists ? "Not found" : verification.valid ? "Valid" : "Used"}
              </Badge>
              {verification.exists ? (
                <>
                  <p>Token #{verification.tokenId.toString()}</p>
                  <p>{verification.concertName}</p>
                  <p>Owner: {shortAddress(verification.owner)}</p>
                  <p>Max resale: {formatEth(verification.maxResalePrice)}</p>
                </>
              ) : (
                <p>This token does not exist on the TicketChain contract.</p>
              )}
            </div>
          ) : null}
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Entrance control</p>
              <h2>Admin Gate Check</h2>
            </div>
            <Badge tone={isOwner ? "green" : "amber"}>{isOwner ? "Ready" : "Owner only"}</Badge>
          </div>
          <FormInput label="Token ID" value={gateTokenId} onChange={setGateTokenId} />
          <button className="primary-button full" onClick={() => void markAsUsed()} disabled={!isOwner || Boolean(pending)}>
            <CheckCircle2 size={18} />
            Mark as Used
          </button>
        </section>
      </section>

      <footer>
        <span>Contract</span>
        {contractReady ? (
          <a href={sepoliaAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
            {shortAddress(CONTRACT_ADDRESS)} <ExternalLink size={14} />
          </a>
        ) : (
          <span>Not configured</span>
        )}
      </footer>
    </main>
  );
}

function FormInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
