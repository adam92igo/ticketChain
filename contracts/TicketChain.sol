// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TicketChain is ERC721Enumerable, Ownable, ReentrancyGuard {
    struct Concert {
        string name;
        string location;
        string date;
        uint256 originalPrice;
        uint256 maxResalePrice;
        uint256 totalSupply;
        uint256 minted;
        bool active;
    }

    struct Ticket {
        uint256 concertId;
        bool used;
        uint256 maxResalePrice;
        bool listed;
        uint256 resalePrice;
    }

    struct TicketVerification {
        bool exists;
        bool valid;
        uint256 tokenId;
        uint256 concertId;
        string concertName;
        string location;
        string date;
        address owner;
        bool used;
        uint256 maxResalePrice;
        bool listed;
        uint256 resalePrice;
    }

    uint256 private _nextConcertId = 1;
    uint256 private _nextTokenId = 1;

    mapping(uint256 => Concert) private _concerts;
    mapping(uint256 => Ticket) private _tickets;
    mapping(uint256 => uint256[]) private _concertTicketIds;

    event ConcertCreated(uint256 indexed concertId, string name, uint256 totalSupply);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed concertId, address indexed owner);
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketResold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed concertId);
    event TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 declaredPrice);

    constructor() ERC721("TicketChain", "TICKET") Ownable(msg.sender) {}

    function createConcert(
        string calldata name,
        string calldata location,
        string calldata date,
        uint256 originalPrice,
        uint256 maxResalePrice,
        uint256 totalSupply
    ) external onlyOwner returns (uint256 concertId) {
        require(bytes(name).length > 0, "Concert name required");
        require(bytes(location).length > 0, "Location required");
        require(bytes(date).length > 0, "Date required");
        require(totalSupply > 0, "Total supply required");
        require(maxResalePrice >= originalPrice, "Max resale below original");

        concertId = _nextConcertId++;
        _concerts[concertId] = Concert({
            name: name,
            location: location,
            date: date,
            originalPrice: originalPrice,
            maxResalePrice: maxResalePrice,
            totalSupply: totalSupply,
            minted: 0,
            active: true
        });

        emit ConcertCreated(concertId, name, totalSupply);
    }

    function mintTicket(uint256 concertId, address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = _mintTicket(concertId, to);
    }

    function buyTicket(uint256 concertId) external payable nonReentrant returns (uint256 tokenId) {
        Concert storage concert = _concerts[concertId];
        require(concert.active, "Concert inactive");
        require(msg.value == concert.originalPrice, "Incorrect ticket price");

        tokenId = _mintTicket(concertId, msg.sender);
    }

    function listTicket(uint256 tokenId, uint256 price) external {
        require(_ticketExists(tokenId), "Ticket does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");

        Ticket storage ticket = _tickets[tokenId];
        require(!ticket.used, "Ticket already used");
        require(price > 0, "Price required");
        require(price <= ticket.maxResalePrice, "Price exceeds max resale");

        ticket.listed = true;
        ticket.resalePrice = price;

        emit TicketListed(tokenId, msg.sender, price);
    }

    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        require(_ticketExists(tokenId), "Ticket does not exist");

        Ticket storage ticket = _tickets[tokenId];
        address seller = ownerOf(tokenId);

        require(ticket.listed, "Ticket not listed");
        require(!ticket.used, "Ticket already used");
        require(seller != msg.sender, "Already ticket owner");
        require(msg.value == ticket.resalePrice, "Incorrect resale price");

        uint256 price = ticket.resalePrice;
        ticket.listed = false;
        ticket.resalePrice = 0;

        _transfer(seller, msg.sender, tokenId);

        (bool paid, ) = payable(seller).call{value: price}("");
        require(paid, "Seller payment failed");

        emit TicketResold(tokenId, seller, msg.sender, price);
    }

    function transferTicket(address to, uint256 tokenId, uint256 declaredPrice) external {
        require(_ticketExists(tokenId), "Ticket does not exist");
        require(to != address(0), "Invalid recipient");
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");

        Ticket storage ticket = _tickets[tokenId];
        require(!ticket.used, "Ticket already used");
        require(declaredPrice <= ticket.maxResalePrice, "Price exceeds max resale");

        ticket.listed = false;
        ticket.resalePrice = 0;

        _transfer(msg.sender, to, tokenId);
        emit TicketTransferred(tokenId, msg.sender, to, declaredPrice);
    }

    function markAsUsed(uint256 tokenId) external onlyOwner {
        require(_ticketExists(tokenId), "Ticket does not exist");

        Ticket storage ticket = _tickets[tokenId];
        require(!ticket.used, "Ticket already used");

        ticket.used = true;
        ticket.listed = false;
        ticket.resalePrice = 0;

        emit TicketUsed(tokenId, ticket.concertId);
    }

    function verifyTicket(uint256 tokenId) external view returns (TicketVerification memory verification) {
        if (!_ticketExists(tokenId)) {
            return verification;
        }

        Ticket memory ticket = _tickets[tokenId];
        Concert memory concert = _concerts[ticket.concertId];

        return TicketVerification({
            exists: true,
            valid: !ticket.used,
            tokenId: tokenId,
            concertId: ticket.concertId,
            concertName: concert.name,
            location: concert.location,
            date: concert.date,
            owner: ownerOf(tokenId),
            used: ticket.used,
            maxResalePrice: ticket.maxResalePrice,
            listed: ticket.listed,
            resalePrice: ticket.resalePrice
        });
    }

    function getConcert(uint256 concertId) external view returns (Concert memory) {
        require(_concerts[concertId].active, "Concert does not exist");
        return _concerts[concertId];
    }

    function getTicket(uint256 tokenId) external view returns (Ticket memory) {
        require(_ticketExists(tokenId), "Ticket does not exist");
        return _tickets[tokenId];
    }

    function getConcertTicketIds(uint256 concertId) external view returns (uint256[] memory) {
        require(_concerts[concertId].active, "Concert does not exist");
        return _concertTicketIds[concertId];
    }

    function totalConcerts() external view returns (uint256) {
        return _nextConcertId - 1;
    }

    function tokensOfOwner(address ownerAddress) external view returns (uint256[] memory) {
        uint256 count = balanceOf(ownerAddress);
        uint256[] memory tokenIds = new uint256[](count);

        for (uint256 index = 0; index < count; index++) {
            tokenIds[index] = tokenOfOwnerByIndex(ownerAddress, index);
        }

        return tokenIds;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool paid, ) = payable(owner()).call{value: balance}("");
        require(paid, "Withdraw failed");
    }

    function _mintTicket(uint256 concertId, address to) private returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");

        Concert storage concert = _concerts[concertId];
        require(concert.active, "Concert inactive");
        require(concert.minted < concert.totalSupply, "Concert sold out");

        tokenId = _nextTokenId++;
        concert.minted += 1;

        _tickets[tokenId] = Ticket({
            concertId: concertId,
            used: false,
            maxResalePrice: concert.maxResalePrice,
            listed: false,
            resalePrice: 0
        });

        _concertTicketIds[concertId].push(tokenId);

        _safeMint(to, tokenId);
        emit TicketMinted(tokenId, concertId, to);
    }

    function _ticketExists(uint256 tokenId) private view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
