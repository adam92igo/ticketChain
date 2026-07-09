"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, Ticket } from "lucide-react";
import { Badge } from "@/components/Badge";
import { ticketChainAbi } from "@/config/ticketchainAbi";
import { getFriendlyError } from "@/lib/errors";
import { formatEth, sepoliaAddressUrl, sepoliaNftUrl, shortAddress } from "@/lib/format";

type VerificationResult = {
  exists: boolean;
  valid: boolean;
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

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

function getEthereum() {
  return (window as unknown as {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }).ethereum;
}

export default function VerifyTicketClient({ initialTokenId }: { initialTokenId: string }) {
  const [tokenId, setTokenId] = useState(initialTokenId);
  const [chainId, setChainId] = useState<number | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const isSepolia = chainId === EXPECTED_CHAIN_ID;
  const contractReady = Boolean(CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS));
  const resultTone = !result?.exists ? "denied" : result.valid ? "approved" : "denied";

  const verifyFromWallet = useCallback(async () => {
    setError("");
    setStatus("Reading ticket from Sepolia...");
    setResult(null);

    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        throw new Error("MetaMask is required to verify this ticket in the demo.");
      }
      if (!contractReady) {
        throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local.");
      }
      if (!tokenId) {
        throw new Error("Missing tokenId in the verification URL.");
      }
      if (!/^\d+$/.test(tokenId.trim())) {
        throw new Error("Enter a numeric token ID.");
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();

      setChainId(Number(network.chainId));

      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        throw new Error("Switch MetaMask to Sepolia before verifying the ticket.");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ticketChainAbi, provider);
      const data = await contract.verifyTicket(BigInt(tokenId.trim()));

      setResult({
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
      setStatus("");
    } catch (err) {
      setStatus("");
      setError(getFriendlyError(err, "Ticket verification failed."));
    }
  }, [contractReady, tokenId]);

  const switchToSepolia = async () => {
    setError("");
    try {
      await getEthereum()?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
      await verifyFromWallet();
    } catch (err) {
      setError(getFriendlyError(err, "Could not switch network."));
    }
  };

  useEffect(() => {
    if (initialTokenId && tokenId === initialTokenId) {
      void verifyFromWallet();
    }
  }, [initialTokenId, tokenId, verifyFromWallet]);

  return (
    <main className="verify-shell">
      <section className="verify-hero">
        <div className="brand-lockup">
          <Ticket size={22} />
          <span>TicketChain</span>
        </div>
        <div className="verify-copy">
          <p className="eyebrow">Gate verification</p>
          <h1>Scan result</h1>
          <p>Staff can verify the scanned NFT ticket directly on-chain before approving entry.</p>
        </div>
      </section>

      <section className="verify-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Token lookup</p>
            <h2>Verify Ticket</h2>
          </div>
          <Badge tone={isSepolia ? "green" : "red"}>{chainId === null ? "Not connected" : isSepolia ? "Sepolia" : `Chain ${chainId}`}</Badge>
        </div>

        <label className="field">
          <span>Token ID</span>
          <input value={tokenId} onChange={(event) => setTokenId(event.target.value)} />
        </label>

        <div className="verify-actions">
          <button className="primary-button" onClick={() => void verifyFromWallet()}>
            <ShieldCheck size={18} />
            Verify Ticket
          </button>
          {contractReady ? (
            <a className="secondary-button button-link" href={sepoliaAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
              Contract on Sepolia <ExternalLink size={14} />
            </a>
          ) : null}
        </div>

        {error ? (
          <div className="notice error">
            <strong>Verification failed</strong>
            <p>{error}</p>
            {error.includes("Sepolia") ? <button onClick={() => void switchToSepolia()}>Switch to Sepolia</button> : null}
          </div>
        ) : null}

        {status ? (
          <div className="notice pending">
            <strong>{status}</strong>
          </div>
        ) : null}

        {result ? (
          <div className={`scan-result ${resultTone}`}>
            <div className="scan-icon">{result.valid ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}</div>
            <div>
              <p className="eyebrow">{result.valid ? "Entry approved" : "Entry denied"}</p>
              <h2>{!result.exists ? "Invalid ticket" : result.used ? "Already used" : "Valid ticket"}</h2>
              {result.exists ? (
                <>
                  <p>
                    Token #{result.tokenId.toString()} for {result.concertName}
                  </p>
                  <p>
                    {result.location} · {result.date}
                  </p>
                  <p>Owner: {shortAddress(result.owner)}</p>
                  <p>Max resale: {formatEth(result.maxResalePrice)}</p>
                  <a href={sepoliaNftUrl(CONTRACT_ADDRESS, result.tokenId)} target="_blank" rel="noreferrer">
                    View NFT on Sepolia <ExternalLink size={14} />
                  </a>
                </>
              ) : (
                <p>This token does not exist on the TicketChain contract.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="scan-result idle">
            <div className="scan-icon">
              <RefreshCw size={26} />
            </div>
            <div>
              <p className="eyebrow">Awaiting verification</p>
              <h2>Ready to scan</h2>
              <p>The QR code should open this page with a token ID already filled in.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
