export function isTicketOwner(connectedAddress: string, ticketOwner: string) {
  return Boolean(connectedAddress && ticketOwner) && connectedAddress.toLowerCase() === ticketOwner.toLowerCase();
}
