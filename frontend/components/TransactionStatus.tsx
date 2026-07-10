"use client";

import { ExternalLink, X } from "lucide-react";
import { useTicketChain } from "@/context/TicketChainContext";
import { sepoliaTxUrl } from "@/lib/format";

export function TransactionStatus() {
  const {
    address,
    contractReady,
    isSepolia,
    networkLabel,
    transaction,
    error,
    clearError,
    switchToSepolia
  } = useTicketChain();

  return (
    <div className="global-notices" aria-live="polite">
      {!contractReady ? (
        <div className="notice error">
          <strong>Contract address missing</strong>
          <p>Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local before using the dApp.</p>
        </div>
      ) : null}
      {address && !isSepolia ? (
        <div className="notice error notice-row">
          <div>
            <strong>Wrong network</strong>
            <p>MetaMask is connected to {networkLabel}. TicketChain runs on Sepolia.</p>
          </div>
          <button onClick={() => void switchToSepolia()}>Switch to Sepolia</button>
        </div>
      ) : null}
      {transaction.phase !== "idle" ? (
        <div className={`notice transaction-notice ${transaction.phase}`}>
          <div>
            <strong>
              {transaction.phase === "failed"
                ? "Transaction failed"
                : transaction.phase === "confirmed"
                  ? "Transaction confirmed"
                  : "Transaction pending"}
            </strong>
            <p>{transaction.message}</p>
          </div>
          {transaction.hash ? (
            <a href={sepoliaTxUrl(transaction.hash)} target="_blank" rel="noreferrer">
              Sepolia Etherscan <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <div className="notice error notice-row">
          <div>
            <strong>Action needed</strong>
            <p>{error}</p>
          </div>
          <button className="icon-button dismiss-button" onClick={clearError} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
