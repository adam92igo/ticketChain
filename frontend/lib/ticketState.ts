export type StatusTone = "green" | "red" | "amber" | "blue" | "gray";

export function normalizeTokenId(value: string) {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error("Enter a numeric token ID.");
  }
  return normalized;
}

export function getTicketStatus(ticket: { concertActive: boolean; used: boolean; listed: boolean }): {
  label: "Expired" | "Valid" | "Used" | "For Sale";
  tone: StatusTone;
} {
  if (!ticket.concertActive) return { label: "Expired", tone: "red" };
  if (ticket.used) return { label: "Used", tone: "red" };
  if (ticket.listed) return { label: "For Sale", tone: "amber" };
  return { label: "Valid", tone: "green" };
}

export type MarketplaceState = "invalid" | "cancelled" | "used" | "not-listed" | "owned" | "available";

export function getMarketplaceState(ticket: {
  exists: boolean;
  concertActive: boolean;
  used: boolean;
  listed: boolean;
  owner: string;
  viewer: string;
}): MarketplaceState {
  if (!ticket.exists) return "invalid";
  if (!ticket.concertActive) return "cancelled";
  if (ticket.used) return "used";
  if (!ticket.listed) return "not-listed";
  if (ticket.viewer && ticket.owner.toLowerCase() === ticket.viewer.toLowerCase()) return "owned";
  return "available";
}

export type GateDecision = {
  title: "Valid ticket" | "Already used" | "Concert cancelled" | "Invalid ticket";
  decision: "Entry approved" | "Entry denied";
  message: string;
  tone: "approved" | "denied";
};

export function getGateDecision(ticket: { exists: boolean; concertActive: boolean; used: boolean; valid: boolean }): GateDecision {
  if (!ticket.exists) {
    return {
      title: "Invalid ticket",
      decision: "Entry denied",
      message: "This token does not exist on the TicketChain contract.",
      tone: "denied"
    };
  }
  if (!ticket.concertActive) {
    return {
      title: "Concert cancelled",
      decision: "Entry denied",
      message: "This concert has been cancelled and this ticket has expired.",
      tone: "denied"
    };
  }
  if (ticket.used || !ticket.valid) {
    return {
      title: "Already used",
      decision: "Entry denied",
      message: "This ticket has already been used for entry.",
      tone: "denied"
    };
  }
  return {
    title: "Valid ticket",
    decision: "Entry approved",
    message: "Ownership and usage status are valid on-chain.",
    tone: "approved"
  };
}
