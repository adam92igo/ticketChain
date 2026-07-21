export type PitchDemoLinks = {
  organizer: string;
  concerts: string;
  tickets: string;
  marketplace: string;
  verify: string;
  gate: string;
};

function numericQueryValue(value?: string): string {
  const trimmed = value?.trim() || "";
  return /^\d+$/.test(trimmed) ? BigInt(trimmed).toString() : "";
}

export function createPitchDemoLinks({
  concertId,
  tokenId
}: {
  concertId?: string;
  tokenId?: string;
}): PitchDemoLinks {
  const concert = numericQueryValue(concertId);
  const token = numericQueryValue(tokenId);

  return {
    organizer: concert ? `/organizer?concertId=${concert}` : "/organizer",
    concerts: "/concerts",
    tickets: "/tickets",
    marketplace: concert ? `/marketplace?concertId=${concert}` : "/marketplace",
    verify: token ? `/verify?tokenId=${token}` : "/verify",
    gate: token ? `/gate?tokenId=${token}` : "/gate"
  };
}
