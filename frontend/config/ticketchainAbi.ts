export const ticketChainAbi = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "totalConcerts",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getConcert",
    stateMutability: "view",
    inputs: [{ name: "concertId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "location", type: "string" },
          { name: "date", type: "string" },
          { name: "originalPrice", type: "uint256" },
          { name: "maxResalePrice", type: "uint256" },
          { name: "totalSupply", type: "uint256" },
          { name: "minted", type: "uint256" },
          { name: "active", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getTicket",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "concertId", type: "uint256" },
          { name: "used", type: "bool" },
          { name: "maxResalePrice", type: "uint256" },
          { name: "listed", type: "bool" },
          { name: "resalePrice", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "tokensOfOwner",
    stateMutability: "view",
    inputs: [{ name: "ownerAddress", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }]
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "createConcert",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "location", type: "string" },
      { name: "date", type: "string" },
      { name: "originalPrice", type: "uint256" },
      { name: "maxResalePrice", type: "uint256" },
      { name: "totalSupply", type: "uint256" }
    ],
    outputs: [{ name: "concertId", type: "uint256" }]
  },
  {
    type: "function",
    name: "mintTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "concertId", type: "uint256" },
      { name: "to", type: "address" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "function",
    name: "buyTicket",
    stateMutability: "payable",
    inputs: [{ name: "concertId", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "function",
    name: "listTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "buyResaleTicket",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "transferTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "declaredPrice", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "verifyTicket",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "verification",
        type: "tuple",
        components: [
          { name: "exists", type: "bool" },
          { name: "valid", type: "bool" },
          { name: "tokenId", type: "uint256" },
          { name: "concertId", type: "uint256" },
          { name: "concertName", type: "string" },
          { name: "location", type: "string" },
          { name: "date", type: "string" },
          { name: "owner", type: "address" },
          { name: "used", type: "bool" },
          { name: "maxResalePrice", type: "uint256" },
          { name: "listed", type: "bool" },
          { name: "resalePrice", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "markAsUsed",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: []
  }
] as const;
