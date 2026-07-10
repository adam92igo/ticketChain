"use client";

import { ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { Badge } from "@/components/Badge";
import { useTicketChain } from "@/context/TicketChainContext";
import { sepoliaAddressUrl, shortAddress } from "@/lib/format";

export function WalletStatus() {
  const {
    address,
    isSepolia,
    networkLabel,
    transactionBusy,
    loading,
    connectWallet,
    refreshData
  } = useTicketChain();

  return (
    <div className="wallet-status" aria-label="Wallet and network status">
      <Badge tone={isSepolia ? "green" : "red"}>{networkLabel}</Badge>
      {address ? (
        <>
          <a
            className="address-pill"
            href={sepoliaAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
            title="Open wallet on Sepolia Etherscan"
          >
            {shortAddress(address)} <ExternalLink size={13} />
          </a>
          <button
            className="icon-button"
            onClick={() => void refreshData()}
            disabled={transactionBusy || loading || !isSepolia}
            title="Refresh on-chain data"
            aria-label="Refresh on-chain data"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </>
      ) : (
        <button className="primary-button compact-button" onClick={() => void connectWallet()}>
          <Wallet size={17} />
          Connect Wallet
        </button>
      )}
    </div>
  );
}
