// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Sealed-Bid Auction House
/// @notice Mehran University sells surplus equipment on-chain using commit-reveal bidding.
///         Buyers first commit a hidden hash of their bid, then reveal the real amount later,
///         so nobody can watch other bids and outbid them during the bidding window.
contract Auction {
    // Lint note: this contract is phased by block.timestamp on purpose. Validators can nudge a
    // timestamp by a few seconds, which is harmless against windows measured in hours or days.
    // Each comparison below is therefore marked as an accepted `block-timestamp` lint.
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    /// @notice Lifecycle of one auction. The phase is derived from time, never stored.
    enum Phase {
        Bidding, // block.timestamp <  biddingEnd
        Reveal, // biddingEnd <= block.timestamp < revealEnd
        Ended, // block.timestamp >= revealEnd, not yet finalized
        Finalized // finalize() has run
    }

    /// @notice All data for one auction listing.
    /// @dev Named AuctionData because Solidity forbids a struct sharing the contract's name.
    struct AuctionData {
        address seller; // who listed the item and receives the winning bid
        string description; // human readable item description
        uint256 reservePrice; // minimum amount that counts as a winning bid
        uint256 biddingEnd; // commit phase closes at this timestamp
        uint256 revealEnd; // reveal phase closes at this timestamp
        uint256 highestBid; // best revealed bid so far
        address highestBidder; // who placed highestBid
        bool finalized; // true once finalize() has run
    }

    /// @notice One bidder's sealed bid inside one auction.
    struct Bid {
        bytes32 commitment; // keccak256(abi.encode(amount, secret, bidder)); zero means "no bid"
        uint256 deposit; // wei locked with the commitment; must be at least the reserve price
        bool revealed; // true once the bidder has opened the commitment
    }

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    /// @notice Reserve price must be greater than zero.
    error InvalidReserve();
    /// @notice Bidding deadline must be strictly in the future.
    error InvalidBiddingDeadline();
    /// @notice Reveal deadline must be strictly after the bidding deadline.
    error InvalidRevealDeadline();
    /// @notice No auction has been created with this id.
    error AuctionDoesNotExist(uint256 auctionId);
    /// @notice Bidding phase is over; commitments are no longer accepted.
    error BiddingClosed();
    /// @notice The ETH sent with the commitment is below the reserve price.
    error DepositTooLow(uint256 sent, uint256 required);
    /// @notice A commitment of zero is reserved to mean "no bid".
    error EmptyCommitment();
    /// @notice Each address may commit only once per auction.
    error AlreadyCommitted();
    /// @notice The auction already has MAX_BIDDERS commitments.
    error TooManyBidders(uint256 maxBidders);
    /// @notice Reveals are only accepted while biddingEnd <= block.timestamp < revealEnd.
    error NotRevealPhase();
    /// @notice The caller never committed a bid to this auction.
    error NoCommitment();
    /// @notice The caller has already revealed their bid.
    error AlreadyRevealed();
    /// @notice The amount and secret do not hash to the stored commitment.
    error InvalidReveal();
    /// @notice The revealed amount is larger than the ETH deposited with the commitment.
    error DepositDoesNotCoverBid(uint256 deposit, uint256 amount);
    /// @notice The revealed amount is below the auction reserve price.
    error BidBelowReserve(uint256 amount, uint256 reservePrice);
    /// @notice finalize is only allowed once block.timestamp >= revealEnd.
    error AuctionStillRunning();
    /// @notice finalize has already run for this auction.
    error AlreadyFinalized();
    /// @notice The caller has no pending balance to withdraw.
    error NothingToWithdraw();
    /// @notice The ETH transfer to the caller failed.
    error WithdrawFailed();

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    /// @notice Emitted when a seller lists a new item.
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string description,
        uint256 reservePrice,
        uint256 biddingEnd,
        uint256 revealEnd
    );

    /// @notice Emitted when a bidder locks a sealed commitment. The bid amount is never logged.
    event BidCommitted(uint256 indexed auctionId, address indexed bidder, bytes32 commitment);

    /// @notice Emitted when a bidder opens their commitment and the amount becomes public.
    event BidRevealed(uint256 indexed auctionId, address indexed bidder, uint256 amount);

    /// @notice Emitted when a bidder who never revealed loses their deposit to the seller.
    event DepositForfeited(uint256 indexed auctionId, address indexed bidder, uint256 deposit);

    /// @notice Emitted once per auction when balances are settled. winner is address(0) if nobody won.
    event AuctionFinalized(uint256 indexed auctionId, address indexed winner, uint256 winningBid);

    /// @notice Emitted when an account pulls its pending balance out of the contract.
    event Withdrawal(address indexed account, uint256 amount);

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    /// @notice Hard cap on bidders per auction so finalize's loop always fits in one block.
    /// @dev Audit finding: without a cap, enough commitments could make finalize exceed the block
    ///      gas limit and lock every deposit forever. 200 bidders settle in well under 15M gas.
    uint256 public constant MAX_BIDDERS = 200;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @notice Auction data keyed by auction id.
    mapping(uint256 => AuctionData) public auctions;

    /// @notice Id that the next created auction will receive. Also equals the number of auctions.
    uint256 public nextAuctionId;

    /// @notice Sealed bids keyed by auction id, then bidder address.
    mapping(uint256 => mapping(address => Bid)) public bids;

    /// @dev Every address that committed to an auction, in commit order. Used to settle refunds later.
    mapping(uint256 => address[]) private bidders;

    /// @notice ETH each account may pull out via withdraw(). Credited by finalize, never pushed.
    mapping(address => uint256) public pendingWithdrawals;

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    /// @notice Reverts unless an auction with this id has been created.
    /// @dev A created auction always has a non-zero seller, so that field doubles as the exists flag.
    modifier auctionExists(uint256 auctionId) {
        if (auctions[auctionId].seller == address(0)) {
            revert AuctionDoesNotExist(auctionId);
        }
        _;
    }

    // ---------------------------------------------------------------------
    // Seller actions
    // ---------------------------------------------------------------------

    /// @notice List an item for sealed-bid auction.
    /// @param description Human readable description of the item.
    /// @param reservePrice Minimum bid that can win. Must be greater than zero.
    /// @param biddingEnd Timestamp when the commit phase closes. Must be in the future.
    /// @param revealEnd Timestamp when the reveal phase closes. Must be after biddingEnd.
    /// @return auctionId The id assigned to the new auction.
    function createAuction(
        string calldata description,
        uint256 reservePrice,
        uint256 biddingEnd,
        uint256 revealEnd
    ) external returns (uint256 auctionId) {
        if (reservePrice == 0) revert InvalidReserve();
        // forge-lint: disable-next-line(block-timestamp)
        if (biddingEnd <= block.timestamp) revert InvalidBiddingDeadline();
        if (revealEnd <= biddingEnd) revert InvalidRevealDeadline();

        auctionId = nextAuctionId;
        nextAuctionId = auctionId + 1;

        AuctionData storage a = auctions[auctionId];
        a.seller = msg.sender;
        a.description = description;
        a.reservePrice = reservePrice;
        a.biddingEnd = biddingEnd;
        a.revealEnd = revealEnd;
        // highestBid, highestBidder and finalized keep their zero defaults.

        emit AuctionCreated(auctionId, msg.sender, description, reservePrice, biddingEnd, revealEnd);
    }

    // ---------------------------------------------------------------------
    // Bidder actions
    // ---------------------------------------------------------------------

    /// @notice Lock a sealed bid by sending its commitment hash together with an ETH deposit.
    /// @dev The deposit must cover at least the reserve price so every revealed bid is backed by funds.
    ///      The real bid amount stays hidden until reveal; only the hash is stored and logged.
    /// @param auctionId Id of the auction to bid on.
    /// @param commitment keccak256(abi.encode(amount, secret, msg.sender)). See computeCommitment.
    function commitBid(uint256 auctionId, bytes32 commitment) external payable auctionExists(auctionId) {
        AuctionData storage a = auctions[auctionId];

        // Checks
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= a.biddingEnd) revert BiddingClosed();
        if (msg.value < a.reservePrice) revert DepositTooLow(msg.value, a.reservePrice);
        if (commitment == bytes32(0)) revert EmptyCommitment();
        Bid storage bid = bids[auctionId][msg.sender];
        if (bid.commitment != bytes32(0)) revert AlreadyCommitted();
        if (bidders[auctionId].length >= MAX_BIDDERS) revert TooManyBidders(MAX_BIDDERS);

        // Effects
        bid.commitment = commitment;
        bid.deposit = msg.value;
        bidders[auctionId].push(msg.sender);

        emit BidCommitted(auctionId, msg.sender, commitment);
    }

    /// @notice Open a sealed bid by proving the amount and secret behind the stored commitment.
    /// @dev A failed reveal reverts and changes nothing, so the bidder may retry until revealEnd.
    ///      A bidder who never reveals successfully is treated as a non-revealer at finalize.
    ///      Ties use strict greater-than, so the earliest reveal of the top amount keeps the lead.
    ///      No external calls happen here; only checks followed by storage writes.
    /// @param auctionId Id of the auction the bid belongs to.
    /// @param amount The bid amount in wei that was hashed into the commitment.
    /// @param secret The secret that was hashed into the commitment.
    function revealBid(uint256 auctionId, uint256 amount, bytes32 secret) external auctionExists(auctionId) {
        AuctionData storage a = auctions[auctionId];
        Bid storage bid = bids[auctionId][msg.sender];

        // Checks
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < a.biddingEnd || block.timestamp >= a.revealEnd) revert NotRevealPhase();
        if (bid.commitment == bytes32(0)) revert NoCommitment();
        if (bid.revealed) revert AlreadyRevealed();
        if (computeCommitment(amount, secret, msg.sender) != bid.commitment) revert InvalidReveal();
        if (bid.deposit < amount) revert DepositDoesNotCoverBid(bid.deposit, amount);
        if (amount < a.reservePrice) revert BidBelowReserve(amount, a.reservePrice);

        // Effects
        bid.revealed = true;
        if (amount > a.highestBid) {
            a.highestBid = amount;
            a.highestBidder = msg.sender;
        }

        emit BidRevealed(auctionId, msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------------

    /// @notice Settle an auction after the reveal window closes. Anyone may call this.
    /// @dev Only balances change here; no ETH leaves the contract. Each party pulls funds via withdraw().
    ///      Every wei deposited is credited to exactly one party:
    ///        winner           -> deposit - winning bid (their excess)
    ///        losing revealer  -> full deposit
    ///        non-revealer     -> nothing; deposit goes to the seller
    ///        seller           -> winning bid + all forfeited deposits
    ///      Bid records are kept as-is after settlement so anyone can audit the outcome.
    /// @param auctionId Id of the auction to settle.
    function finalize(uint256 auctionId) external auctionExists(auctionId) {
        AuctionData storage a = auctions[auctionId];

        // Checks
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < a.revealEnd) revert AuctionStillRunning();
        if (a.finalized) revert AlreadyFinalized();

        // Effects: lock the auction before touching any balance.
        a.finalized = true;

        address winner = a.highestBidder;
        uint256 winningBid = a.highestBid;
        uint256 forfeited = 0;

        address[] storage list = bidders[auctionId];
        uint256 count = list.length;
        for (uint256 i = 0; i < count; ++i) {
            address bidder = list[i];
            Bid storage bid = bids[auctionId][bidder];
            uint256 deposit = bid.deposit;

            if (!bid.revealed) {
                // Never opened their bid: the deposit is forfeited to the seller.
                forfeited += deposit;
                emit DepositForfeited(auctionId, bidder, deposit);
            } else if (bidder == winner) {
                // Winner pays the bid; anything above it comes back.
                pendingWithdrawals[bidder] += deposit - winningBid;
            } else {
                // Lost fairly: full refund.
                pendingWithdrawals[bidder] += deposit;
            }
        }

        // Seller receives the winning bid (zero if nobody won) plus every forfeited deposit.
        pendingWithdrawals[a.seller] += winningBid + forfeited;

        emit AuctionFinalized(auctionId, winner, winningBid);
    }

    /// @notice Pull out everything credited to the caller across all auctions.
    /// @dev Checks-Effects-Interactions: the balance is zeroed before the ETH call,
    ///      so a re-entrant call sees nothing left to withdraw.
    function withdraw() external {
        // Checks
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // Effects
        pendingWithdrawals[msg.sender] = 0;
        // Emit before the external call so a re-entrant callee cannot reorder or interleave logs.
        // If the call below fails the whole transaction reverts and this log is discarded with it.
        emit Withdrawal(msg.sender, amount);

        // Interactions
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert WithdrawFailed();
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Current phase of an auction, derived from block.timestamp and the finalized flag.
    /// @param auctionId Id of the auction to inspect.
    /// @return The current Phase.
    function getPhase(uint256 auctionId) public view auctionExists(auctionId) returns (Phase) {
        AuctionData storage a = auctions[auctionId];
        if (a.finalized) return Phase.Finalized;
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < a.biddingEnd) return Phase.Bidding;
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < a.revealEnd) return Phase.Reveal;
        return Phase.Ended;
    }

    /// @notice Number of distinct addresses that have committed a bid to an auction.
    /// @param auctionId Id of the auction to inspect.
    /// @return Count of bidders.
    function getBidderCount(uint256 auctionId) external view auctionExists(auctionId) returns (uint256) {
        return bidders[auctionId].length;
    }

    /// @notice Hash a bidder must submit during the bidding phase to hide their bid.
    /// @dev Binding the bidder address stops someone from copying another bidder's commitment.
    /// @param amount The bid amount in wei that will be revealed later.
    /// @param secret A random value only the bidder knows.
    /// @param bidder The address that will place and later reveal the bid.
    /// @return The commitment hash: keccak256(abi.encode(amount, secret, bidder)).
    function computeCommitment(uint256 amount, bytes32 secret, address bidder) public pure returns (bytes32) {
        return keccak256(abi.encode(amount, secret, bidder));
    }
}
