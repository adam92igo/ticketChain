import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const concertInput = {
  name: "FinTech Summer Beats",
  location: "Madrid Arena",
  date: "2026-08-15",
  originalPrice: ethers.parseEther("0.02"),
  maxResalePrice: ethers.parseEther("0.05"),
  totalSupply: 3n
};

async function deployTicketChainFixture() {
  const [owner, buyer, secondBuyer, outsider] = await ethers.getSigners();
  const ticketChain = await ethers.deployContract("TicketChain");

  await ticketChain.createConcert(
    concertInput.name,
    concertInput.location,
    concertInput.date,
    concertInput.originalPrice,
    concertInput.maxResalePrice,
    concertInput.totalSupply
  );

  return { ticketChain, owner, buyer, secondBuyer, outsider };
}

describe("TicketChain", function () {
  it("creates a concert owned by the contract owner", async function () {
    const [owner] = await ethers.getSigners();
    const ticketChain = await ethers.deployContract("TicketChain");

    await expect(
      ticketChain.createConcert(
        concertInput.name,
        concertInput.location,
        concertInput.date,
        concertInput.originalPrice,
        concertInput.maxResalePrice,
        concertInput.totalSupply
      )
    )
      .to.emit(ticketChain, "ConcertCreated")
      .withArgs(1n, concertInput.name, concertInput.totalSupply);

    const concert = await ticketChain.getConcert(1);
    expect(concert.name).to.equal(concertInput.name);
    expect(concert.location).to.equal(concertInput.location);
    expect(concert.date).to.equal(concertInput.date);
    expect(concert.originalPrice).to.equal(concertInput.originalPrice);
    expect(concert.maxResalePrice).to.equal(concertInput.maxResalePrice);
    expect(concert.totalSupply).to.equal(concertInput.totalSupply);
    expect(concert.minted).to.equal(0n);
    expect(concert.active).to.equal(true);
    expect(await ticketChain.owner()).to.equal(owner.address);
  });

  it("mints a ticket to a recipient and exposes verification data", async function () {
    const { ticketChain, buyer } = await networkHelpers.loadFixture(deployTicketChainFixture);

    await expect(ticketChain.mintTicket(1, buyer.address))
      .to.emit(ticketChain, "TicketMinted")
      .withArgs(1n, 1n, buyer.address);

    const ticket = await ticketChain.getTicket(1);
    expect(ticket.concertId).to.equal(1n);
    expect(ticket.used).to.equal(false);
    expect(ticket.maxResalePrice).to.equal(concertInput.maxResalePrice);
    expect(ticket.listed).to.equal(false);
    expect(ticket.resalePrice).to.equal(0n);

    const verification = await ticketChain.verifyTicket(1);
    expect(verification.exists).to.equal(true);
    expect(verification.valid).to.equal(true);
    expect(verification.owner).to.equal(buyer.address);
    expect(verification.concertName).to.equal(concertInput.name);
    expect(verification.used).to.equal(false);
  });

  it("lets a buyer purchase a primary ticket with ETH", async function () {
    const { ticketChain, buyer } = await networkHelpers.loadFixture(deployTicketChainFixture);

    await expect(ticketChain.connect(buyer).buyTicket(1, { value: concertInput.originalPrice }))
      .to.emit(ticketChain, "TicketMinted")
      .withArgs(1n, 1n, buyer.address);

    expect(await ticketChain.ownerOf(1)).to.equal(buyer.address);
    expect(await ticketChain.tokensOfOwner(buyer.address)).to.deep.equal([1n]);
  });

  it("returns only the issued ticket IDs for the requested concert", async function () {
    const { ticketChain, buyer, secondBuyer } = await networkHelpers.loadFixture(deployTicketChainFixture);
    await ticketChain.createConcert(
      "Afterparty",
      "Madrid Arena",
      "2026-08-16",
      ethers.parseEther("0.01"),
      ethers.parseEther("0.02"),
      3
    );
    await ticketChain.mintTicket(1, buyer.address);
    await ticketChain.connect(secondBuyer).buyTicket(1, { value: concertInput.originalPrice });
    await ticketChain.mintTicket(2, buyer.address);

    expect(await ticketChain.getConcertTicketIds(1)).to.deep.equal([1n, 2n]);
    expect(await ticketChain.getConcertTicketIds(2)).to.deep.equal([3n]);
    await expect(ticketChain.getConcertTicketIds(999)).to.be.revertedWith("Concert does not exist");
  });

  it("cancels a concert while preserving history and isolating other concerts", async function () {
    const { ticketChain, buyer, secondBuyer, outsider } = await networkHelpers.loadFixture(deployTicketChainFixture);
    const resalePrice = ethers.parseEther("0.04");

    await ticketChain.createConcert(
      "Afterparty",
      "Madrid Arena",
      "2026-08-16",
      ethers.parseEther("0.01"),
      ethers.parseEther("0.02"),
      3
    );
    await ticketChain.connect(buyer).buyTicket(1, { value: concertInput.originalPrice });
    await ticketChain.mintTicket(1, secondBuyer.address);
    await ticketChain.mintTicket(2, outsider.address);
    await ticketChain.connect(buyer).listTicket(1, resalePrice);

    await expect(ticketChain.connect(outsider).cancelConcert(1))
      .to.be.revertedWithCustomError(ticketChain, "OwnableUnauthorizedAccount")
      .withArgs(outsider.address);
    await expect(ticketChain.cancelConcert(1)).to.emit(ticketChain, "ConcertCancelled").withArgs(1n);

    const cancelledConcert = await ticketChain.getConcert(1);
    expect(cancelledConcert.active).to.equal(false);
    expect(await ticketChain.getConcertTicketIds(1)).to.deep.equal([1n, 2n]);
    await expect(ticketChain.getConcert(999)).to.be.revertedWith("Concert does not exist");
    await expect(ticketChain.getConcertTicketIds(999)).to.be.revertedWith("Concert does not exist");

    const cancelledVerification = await ticketChain.verifyTicket(1);
    expect(cancelledVerification.exists).to.equal(true);
    expect(cancelledVerification.concertActive).to.equal(false);
    expect(cancelledVerification.valid).to.equal(false);

    const activeVerification = await ticketChain.verifyTicket(3);
    expect(activeVerification.concertActive).to.equal(true);
    expect(activeVerification.valid).to.equal(true);

    await expect(ticketChain.mintTicket(1, outsider.address)).to.be.revertedWith("Concert inactive");
    await expect(ticketChain.connect(outsider).buyTicket(1, { value: concertInput.originalPrice })).to.be.revertedWith(
      "Concert inactive"
    );
    await expect(ticketChain.connect(buyer).listTicket(1, resalePrice)).to.be.revertedWith("Concert inactive");
    await expect(ticketChain.connect(outsider).buyResaleTicket(1, { value: resalePrice })).to.be.revertedWith(
      "Concert inactive"
    );
    await expect(ticketChain.connect(buyer).transferTicket(outsider.address, 1, 0)).to.be.revertedWith("Concert inactive");
    await expect(ticketChain.markAsUsed(1)).to.be.revertedWith("Concert inactive");

    await ticketChain.connect(outsider).listTicket(3, ethers.parseEther("0.015"));
    await ticketChain.connect(buyer).buyResaleTicket(3, { value: ethers.parseEther("0.015") });
    expect(await ticketChain.ownerOf(3)).to.equal(buyer.address);
  });

  it("lets a holder resell a ticket below the maximum resale price", async function () {
    const { ticketChain, buyer, secondBuyer } = await networkHelpers.loadFixture(deployTicketChainFixture);
    await ticketChain.connect(buyer).buyTicket(1, { value: concertInput.originalPrice });

    const resalePrice = ethers.parseEther("0.04");
    await expect(ticketChain.connect(buyer).listTicket(1, resalePrice))
      .to.emit(ticketChain, "TicketListed")
      .withArgs(1n, buyer.address, resalePrice);

    await expect(ticketChain.connect(secondBuyer).buyResaleTicket(1, { value: resalePrice }))
      .to.emit(ticketChain, "TicketResold")
      .withArgs(1n, buyer.address, secondBuyer.address, resalePrice);

    expect(await ticketChain.ownerOf(1)).to.equal(secondBuyer.address);
    const ticket = await ticketChain.getTicket(1);
    expect(ticket.listed).to.equal(false);
    expect(ticket.resalePrice).to.equal(0n);
  });

  it("rejects resale listings above the maximum resale price", async function () {
    const { ticketChain, buyer } = await networkHelpers.loadFixture(deployTicketChainFixture);
    await ticketChain.connect(buyer).buyTicket(1, { value: concertInput.originalPrice });

    await expect(ticketChain.connect(buyer).listTicket(1, ethers.parseEther("0.06"))).to.be.revertedWith(
      "Price exceeds max resale"
    );
  });

  it("marks a ticket as used and prevents double use", async function () {
    const { ticketChain, buyer } = await networkHelpers.loadFixture(deployTicketChainFixture);
    await ticketChain.connect(buyer).buyTicket(1, { value: concertInput.originalPrice });

    await expect(ticketChain.markAsUsed(1)).to.emit(ticketChain, "TicketUsed").withArgs(1n, 1n);

    const verification = await ticketChain.verifyTicket(1);
    expect(verification.used).to.equal(true);
    expect(verification.valid).to.equal(false);

    await expect(ticketChain.markAsUsed(1)).to.be.revertedWith("Ticket already used");
  });

  it("rejects markAsUsed from a non-owner", async function () {
    const { ticketChain, buyer, outsider } = await networkHelpers.loadFixture(deployTicketChainFixture);
    await ticketChain.connect(buyer).buyTicket(1, { value: concertInput.originalPrice });

    await expect(ticketChain.connect(outsider).markAsUsed(1))
      .to.be.revertedWithCustomError(ticketChain, "OwnableUnauthorizedAccount")
      .withArgs(outsider.address);
  });

  it("returns clean verification data for an unknown token", async function () {
    const { ticketChain } = await networkHelpers.loadFixture(deployTicketChainFixture);

    const verification = await ticketChain.verifyTicket(999);
    expect(verification.exists).to.equal(false);
    expect(verification.valid).to.equal(false);
    expect(verification.owner).to.equal(ethers.ZeroAddress);
    expect(verification.concertId).to.equal(0n);
  });

  it("supports the full academic demo flow end to end", async function () {
    const { ticketChain, owner, buyer, secondBuyer } = await networkHelpers.loadFixture(deployTicketChainFixture);

    await expect(ticketChain.mintTicket(1, buyer.address))
      .to.emit(ticketChain, "TicketMinted")
      .withArgs(1n, 1n, buyer.address);

    expect(await ticketChain.tokensOfOwner(buyer.address)).to.deep.equal([1n]);

    let verification = await ticketChain.verifyTicket(1);
    expect(verification.exists).to.equal(true);
    expect(verification.valid).to.equal(true);
    expect(verification.owner).to.equal(buyer.address);
    expect(verification.used).to.equal(false);

    const resalePrice = ethers.parseEther("0.04");
    await expect(ticketChain.connect(buyer).listTicket(1, resalePrice))
      .to.emit(ticketChain, "TicketListed")
      .withArgs(1n, buyer.address, resalePrice);

    await expect(ticketChain.connect(secondBuyer).buyResaleTicket(1, { value: resalePrice }))
      .to.emit(ticketChain, "TicketResold")
      .withArgs(1n, buyer.address, secondBuyer.address, resalePrice);

    verification = await ticketChain.verifyTicket(1);
    expect(verification.owner).to.equal(secondBuyer.address);
    expect(verification.valid).to.equal(true);

    await expect(ticketChain.markAsUsed(1)).to.emit(ticketChain, "TicketUsed").withArgs(1n, 1n);

    verification = await ticketChain.verifyTicket(1);
    expect(verification.owner).to.equal(secondBuyer.address);
    expect(verification.used).to.equal(true);
    expect(verification.valid).to.equal(false);

    await expect(ticketChain.markAsUsed(1)).to.be.revertedWith("Ticket already used");
    await expect(ticketChain.connect(secondBuyer).listTicket(1, ethers.parseEther("0.01"))).to.be.revertedWith(
      "Ticket already used"
    );
    await expect(ticketChain.connect(secondBuyer).transferTicket(owner.address, 1, 0)).to.be.revertedWith(
      "Ticket already used"
    );
  });
});
