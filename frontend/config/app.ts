export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";

export const clientNavigationItems = [
  { href: "/concerts", label: "Events" },
  { href: "/tickets", label: "My Tickets" },
  { href: "/marketplace", label: "Resale" },
  { href: "/verify", label: "Verify" }
] as const;

export const organizerNavigationItems = [
  { href: "/organizer", label: "Organizer Portal" },
  { href: "/gate", label: "Gate Check" },
  { href: "/demo", label: "Demo Guide" },
  { href: "/about", label: "About" }
] as const;

export const emptyCreateForm = {
  name: "FinTech Summer Beats",
  location: "Madrid Arena",
  date: "2026-08-15",
  originalPrice: "0.02",
  maxResalePrice: "0.05",
  totalSupply: "50"
};
