export function getFriendlyError(error: unknown, fallback = "Action failed.") {
  const candidate = error as {
    code?: string | number;
    shortMessage?: string;
    reason?: string;
    message?: string;
  };

  const rawMessage = candidate.shortMessage || candidate.reason || candidate.message || fallback;
  const normalized = rawMessage.toLowerCase();

  if (candidate.code === 4001 || normalized.includes("user rejected") || normalized.includes("action_rejected")) {
    return "Request rejected in MetaMask.";
  }

  if (normalized.includes("insufficient funds")) {
    return "Not enough Sepolia ETH to pay for this transaction.";
  }

  if (normalized.includes("network changed") || normalized.includes("chain changed")) {
    return "MetaMask network changed. Check that Sepolia is selected and try again.";
  }

  if (normalized.includes("could not coalesce error")) {
    return "MetaMask returned an unexpected error. Check the wallet popup and try again.";
  }

  const knownContractMessages = [
    "Ticket already used",
    "Ticket does not exist",
    "Price exceeds max resale",
    "Incorrect ticket price",
    "Incorrect resale price",
    "Concert sold out",
    "Concert inactive",
    "Not ticket owner",
    "Ticket not listed",
    "Already ticket owner",
    "Invalid recipient"
  ];

  const contractMessage = knownContractMessages.find((message) => normalized.includes(message.toLowerCase()));
  if (contractMessage) {
    return contractMessage;
  }

  return rawMessage.length > 220 ? `${rawMessage.slice(0, 217)}...` : rawMessage;
}
