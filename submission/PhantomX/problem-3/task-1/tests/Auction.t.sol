// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {Auction} from "../contracts/Auction.sol";

/// @title Auction tests
/// @notice Foundry tests for the sealed-bid auction contract.
contract AuctionTest is Test {
    Auction internal auction;

    // Fixed timeline used by every test. setUp warps the chain to START.
    uint256 internal constant START = 1_000;
    uint256 internal constant BIDDING_END = START + 1 days;
    uint256 internal constant REVEAL_END = BIDDING_END + 1 days;
    uint256 internal constant RESERVE = 1 ether;
    string internal constant DESCRIPTION = "Dell OptiPlex 7090 desktop";

    address internal seller = makeAddr("seller");
    address internal otherSeller = makeAddr("otherSeller");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    // Mirror of the contract event so expectEmit can match it.
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string description,
        uint256 reservePrice,
        uint256 biddingEnd,
        uint256 revealEnd
    );
    event BidCommitted(uint256 indexed auctionId, address indexed bidder, bytes32 commitment);
    event BidRevealed(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event DepositForfeited(uint256 indexed auctionId, address indexed bidder, uint256 deposit);
    event AuctionFinalized(uint256 indexed auctionId, address indexed winner, uint256 winningBid);
    event Withdrawal(address indexed account, uint256 amount);

    function setUp() public {
        vm.warp(START);
        auction = new Auction();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
    }

    /// @dev Helper that creates the standard auction as `seller`.
    function _createDefault() internal returns (uint256) {
        vm.prank(seller);
        return auction.createAuction(DESCRIPTION, RESERVE, BIDDING_END, REVEAL_END);
    }

    // ---------------------------------------------------------------------
    // createAuction
    // ---------------------------------------------------------------------

    function test_CreateAuction_StoresFieldsAndEmits() public {
        vm.expectEmit(true, true, false, true, address(auction));
        emit AuctionCreated(0, seller, DESCRIPTION, RESERVE, BIDDING_END, REVEAL_END);

        uint256 id = _createDefault();
        assertEq(id, 0, "first id is 0");
        assertEq(auction.nextAuctionId(), 1, "counter advanced");

        (
            address storedSeller,
            string memory storedDescription,
            uint256 storedReserve,
            uint256 storedBiddingEnd,
            uint256 storedRevealEnd,
            uint256 highestBid,
            address highestBidder,
            bool finalized
        ) = auction.auctions(id);

        assertEq(storedSeller, seller, "seller");
        assertEq(storedDescription, DESCRIPTION, "description");
        assertEq(storedReserve, RESERVE, "reservePrice");
        assertEq(storedBiddingEnd, BIDDING_END, "biddingEnd");
        assertEq(storedRevealEnd, REVEAL_END, "revealEnd");
        assertEq(highestBid, 0, "highestBid starts at 0");
        assertEq(highestBidder, address(0), "highestBidder starts empty");
        assertFalse(finalized, "not finalized");
    }

    function test_CreateAuction_RevertsOnZeroReserve() public {
        vm.prank(seller);
        vm.expectRevert(Auction.InvalidReserve.selector);
        auction.createAuction(DESCRIPTION, 0, BIDDING_END, REVEAL_END);
    }

    function test_CreateAuction_RevertsOnBiddingDeadlineInPast() public {
        vm.prank(seller);
        vm.expectRevert(Auction.InvalidBiddingDeadline.selector);
        auction.createAuction(DESCRIPTION, RESERVE, START - 1, REVEAL_END);
    }

    function test_CreateAuction_RevertsOnBiddingDeadlineEqualToNow() public {
        vm.prank(seller);
        vm.expectRevert(Auction.InvalidBiddingDeadline.selector);
        auction.createAuction(DESCRIPTION, RESERVE, START, REVEAL_END);
    }

    function test_CreateAuction_RevertsOnRevealDeadlineBeforeBidding() public {
        vm.prank(seller);
        vm.expectRevert(Auction.InvalidRevealDeadline.selector);
        auction.createAuction(DESCRIPTION, RESERVE, BIDDING_END, BIDDING_END - 1);
    }

    function test_CreateAuction_RevertsOnRevealDeadlineEqualToBidding() public {
        vm.prank(seller);
        vm.expectRevert(Auction.InvalidRevealDeadline.selector);
        auction.createAuction(DESCRIPTION, RESERVE, BIDDING_END, BIDDING_END);
    }

    function test_CreateAuction_TwoAuctionsGetSequentialIdsAndIndependentData() public {
        uint256 firstId = _createDefault();

        vm.prank(otherSeller);
        uint256 secondId = auction.createAuction("HP LaserJet printer", 2 ether, BIDDING_END + 1 hours, REVEAL_END + 1 hours);

        assertEq(firstId, 0, "first id");
        assertEq(secondId, 1, "second id");
        assertEq(auction.nextAuctionId(), 2, "counter");

        (address s0, string memory d0, uint256 r0, uint256 b0, uint256 v0,,,) = auction.auctions(0);
        (address s1, string memory d1, uint256 r1, uint256 b1, uint256 v1,,,) = auction.auctions(1);

        assertEq(s0, seller);
        assertEq(d0, DESCRIPTION);
        assertEq(r0, RESERVE);
        assertEq(b0, BIDDING_END);
        assertEq(v0, REVEAL_END);

        assertEq(s1, otherSeller);
        assertEq(d1, "HP LaserJet printer");
        assertEq(r1, 2 ether);
        assertEq(b1, BIDDING_END + 1 hours);
        assertEq(v1, REVEAL_END + 1 hours);
    }

    // ---------------------------------------------------------------------
    // getPhase
    // ---------------------------------------------------------------------

    function test_GetPhase_BiddingBeforeBiddingEnd() public {
        uint256 id = _createDefault();
        vm.warp(BIDDING_END - 1);
        assertEq(uint256(auction.getPhase(id)), uint256(Auction.Phase.Bidding));
    }

    function test_GetPhase_RevealExactlyAtBiddingEnd() public {
        uint256 id = _createDefault();
        vm.warp(BIDDING_END);
        assertEq(uint256(auction.getPhase(id)), uint256(Auction.Phase.Reveal));
    }

    function test_GetPhase_RevealInsideRevealWindow() public {
        uint256 id = _createDefault();
        vm.warp(BIDDING_END + 12 hours);
        assertEq(uint256(auction.getPhase(id)), uint256(Auction.Phase.Reveal));
    }

    function test_GetPhase_EndedExactlyAtRevealEnd() public {
        uint256 id = _createDefault();
        vm.warp(REVEAL_END);
        assertEq(uint256(auction.getPhase(id)), uint256(Auction.Phase.Ended));
    }

    function test_GetPhase_EndedAfterRevealEnd() public {
        uint256 id = _createDefault();
        vm.warp(REVEAL_END + 30 days);
        assertEq(uint256(auction.getPhase(id)), uint256(Auction.Phase.Ended));
    }

    function test_GetPhase_RevertsOnUnknownId() public {
        _createDefault();
        vm.expectRevert(abi.encodeWithSelector(Auction.AuctionDoesNotExist.selector, 99));
        auction.getPhase(99);
    }

    // ---------------------------------------------------------------------
    // computeCommitment
    // ---------------------------------------------------------------------

    function test_ComputeCommitment_MatchesKeccakOfAbiEncode() public {
        uint256 amount = 3 ether;
        bytes32 secret = keccak256("my secret");
        address bidder = makeAddr("bidder");

        bytes32 expected = keccak256(abi.encode(amount, secret, bidder));
        assertEq(auction.computeCommitment(amount, secret, bidder), expected);
    }

    function test_ComputeCommitment_ChangesWithBidder() public {
        bytes32 secret = keccak256("my secret");
        bytes32 a = auction.computeCommitment(1 ether, secret, makeAddr("alice"));
        bytes32 b = auction.computeCommitment(1 ether, secret, makeAddr("bob"));
        assertTrue(a != b, "same bid by different bidders must hash differently");
    }

    // ---------------------------------------------------------------------
    // commitBid
    // ---------------------------------------------------------------------

    /// @dev Helper: commitment for `bidder` bidding `amount` with a fixed secret.
    ///      Computed locally on purpose: an external call here would consume vm.prank /
    ///      vm.expectRevert before commitBid runs, because arguments are evaluated first.
    function _commitmentFor(uint256 amount, address bidder) internal pure returns (bytes32) {
        return keccak256(abi.encode(amount, keccak256("secret"), bidder));
    }

    function test_CommitBid_StoresBidEmitsAndTakesDeposit() public {
        uint256 id = _createDefault();
        bytes32 commitment = _commitmentFor(2 ether, alice);
        uint256 balanceBefore = address(auction).balance;

        vm.expectEmit(true, true, false, true, address(auction));
        emit BidCommitted(id, alice, commitment);

        vm.prank(alice);
        auction.commitBid{value: 2 ether}(id, commitment);

        (bytes32 storedCommitment, uint256 storedDeposit, bool revealed) = auction.bids(id, alice);
        assertEq(storedCommitment, commitment, "commitment");
        assertEq(storedDeposit, 2 ether, "deposit");
        assertFalse(revealed, "not revealed yet");
        assertEq(address(auction).balance, balanceBefore + 2 ether, "contract holds the deposit");
        assertEq(auction.getBidderCount(id), 1, "one bidder");
    }

    function test_CommitBid_RevertsWhenDepositBelowReserve() public {
        uint256 id = _createDefault();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Auction.DepositTooLow.selector, RESERVE - 1, RESERVE));
        auction.commitBid{value: RESERVE - 1}(id, _commitmentFor(RESERVE - 1, alice));
    }

    function test_CommitBid_DepositExactlyReserveWorks() public {
        uint256 id = _createDefault();
        vm.prank(alice);
        auction.commitBid{value: RESERVE}(id, _commitmentFor(RESERVE, alice));
        (, uint256 deposit,) = auction.bids(id, alice);
        assertEq(deposit, RESERVE);
    }

    function test_CommitBid_DepositAboveReserveWorks() public {
        uint256 id = _createDefault();
        vm.prank(alice);
        auction.commitBid{value: RESERVE + 1 ether}(id, _commitmentFor(RESERVE + 1 ether, alice));
        (, uint256 deposit,) = auction.bids(id, alice);
        assertEq(deposit, RESERVE + 1 ether);
    }

    function test_CommitBid_RevertsExactlyAtBiddingEnd() public {
        uint256 id = _createDefault();
        vm.warp(BIDDING_END);
        vm.prank(alice);
        vm.expectRevert(Auction.BiddingClosed.selector);
        auction.commitBid{value: RESERVE}(id, _commitmentFor(RESERVE, alice));
    }

    function test_CommitBid_OneSecondBeforeBiddingEndWorks() public {
        uint256 id = _createDefault();
        vm.warp(BIDDING_END - 1);
        vm.prank(alice);
        auction.commitBid{value: RESERVE}(id, _commitmentFor(RESERVE, alice));
        assertEq(auction.getBidderCount(id), 1);
    }

    function test_CommitBid_RevertsAfterBiddingEnds() public {
        uint256 id = _createDefault();
        vm.warp(REVEAL_END + 1);
        vm.prank(alice);
        vm.expectRevert(Auction.BiddingClosed.selector);
        auction.commitBid{value: RESERVE}(id, _commitmentFor(RESERVE, alice));
    }

    function test_CommitBid_RevertsOnSecondCommitFromSameAddress() public {
        uint256 id = _createDefault();
        bytes32 first = _commitmentFor(2 ether, alice);

        vm.prank(alice);
        auction.commitBid{value: 2 ether}(id, first);

        vm.prank(alice);
        vm.expectRevert(Auction.AlreadyCommitted.selector);
        auction.commitBid{value: 3 ether}(id, _commitmentFor(3 ether, alice));

        // First bid is untouched and no extra ETH was taken.
        (bytes32 storedCommitment, uint256 storedDeposit,) = auction.bids(id, alice);
        assertEq(storedCommitment, first, "original commitment kept");
        assertEq(storedDeposit, 2 ether, "original deposit kept");
        assertEq(address(auction).balance, 2 ether, "only the first deposit is held");
        assertEq(auction.getBidderCount(id), 1, "bidder counted once");
    }

    function test_CommitBid_RevertsOnZeroCommitment() public {
        uint256 id = _createDefault();
        vm.prank(alice);
        vm.expectRevert(Auction.EmptyCommitment.selector);
        auction.commitBid{value: RESERVE}(id, bytes32(0));
    }

    function test_CommitBid_RevertsOnUnknownAuction() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Auction.AuctionDoesNotExist.selector, 7));
        auction.commitBid{value: RESERVE}(7, _commitmentFor(RESERVE, alice));
    }

    function test_CommitBid_TwoBiddersSameAuction() public {
        uint256 id = _createDefault();

        vm.prank(alice);
        auction.commitBid{value: 2 ether}(id, _commitmentFor(2 ether, alice));
        vm.prank(bob);
        auction.commitBid{value: 3 ether}(id, _commitmentFor(3 ether, bob));

        assertEq(auction.getBidderCount(id), 2, "two bidders");
        assertEq(address(auction).balance, 5 ether, "both deposits held");

        (bytes32 cA, uint256 dA,) = auction.bids(id, alice);
        (bytes32 cB, uint256 dB,) = auction.bids(id, bob);
        assertEq(cA, _commitmentFor(2 ether, alice));
        assertEq(dA, 2 ether);
        assertEq(cB, _commitmentFor(3 ether, bob));
        assertEq(dB, 3 ether);
    }

    function test_GetBidderCount_RevertsOnUnknownAuction() public {
        vm.expectRevert(abi.encodeWithSelector(Auction.AuctionDoesNotExist.selector, 5));
        auction.getBidderCount(5);
    }

    // ---------------------------------------------------------------------
    // revealBid
    // ---------------------------------------------------------------------

    bytes32 internal constant SECRET = keccak256("secret");

    /// @dev Helper: bidder commits amount with SECRET and deposits deposit.
    function _commit(uint256 id, address bidder, uint256 amount, uint256 deposit) internal {
        vm.prank(bidder);
        auction.commitBid{value: deposit}(id, _commitmentFor(amount, bidder));
    }

    /// @dev Helper: create an auction, have alice commit amount, and move into the reveal window.
    function _createCommitAndEnterReveal(uint256 amount, uint256 deposit) internal returns (uint256 id) {
        id = _createDefault();
        _commit(id, alice, amount, deposit);
        vm.warp(BIDDING_END);
    }

    function _leader(uint256 id) internal view returns (uint256 highestBid, address highestBidder) {
        (,,,,, highestBid, highestBidder,) = auction.auctions(id);
    }

    function test_ValidReveal() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);

        vm.expectEmit(true, true, false, true, address(auction));
        emit BidRevealed(id, alice, 2 ether);

        vm.prank(alice);
        auction.revealBid(id, 2 ether, SECRET);

        (,, bool revealed) = auction.bids(id, alice);
        assertTrue(revealed, "marked revealed");
        (uint256 highestBid, address highestBidder) = _leader(id);
        assertEq(highestBid, 2 ether, "highestBid");
        assertEq(highestBidder, alice, "highestBidder");
    }

    function test_RevertWhen_WrongSecret() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        vm.prank(alice);
        vm.expectRevert(Auction.InvalidReveal.selector);
        auction.revealBid(id, 2 ether, keccak256("wrong"));
    }

    function test_RevealBid_RevertsOnWrongAmount() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        vm.prank(alice);
        vm.expectRevert(Auction.InvalidReveal.selector);
        auction.revealBid(id, 1.5 ether, SECRET);
    }

    function test_RevealBid_RevertsBeforeBiddingEnd() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        vm.warp(BIDDING_END - 1);
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);
    }

    function test_RevealBid_ExactlyAtBiddingEndWorks() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether); // warps to exactly BIDDING_END
        assertEq(block.timestamp, BIDDING_END);
        vm.prank(alice);
        auction.revealBid(id, 2 ether, SECRET);
        (, address highestBidder) = _leader(id);
        assertEq(highestBidder, alice);
    }

    function test_RevealBid_RevertsExactlyAtRevealEnd() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        vm.warp(REVEAL_END);
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);
    }

    function test_RevealBid_RevertsAfterRevealEnd() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        vm.warp(REVEAL_END + 1 days);
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);
    }

    function test_RevealBid_RevertsOnDoubleReveal() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        vm.prank(alice);
        auction.revealBid(id, 2 ether, SECRET);
        vm.prank(alice);
        vm.expectRevert(Auction.AlreadyRevealed.selector);
        auction.revealBid(id, 2 ether, SECRET);
    }

    function test_RevealBid_RevertsWhenCallerNeverCommitted() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        vm.prank(bob);
        vm.expectRevert(Auction.NoCommitment.selector);
        auction.revealBid(id, 2 ether, SECRET);
    }

    function test_RevealBid_RevertsWhenDepositSmallerThanAmount() public {
        // alice commits to 3 ether but only deposits 2 ether.
        uint256 id = _createCommitAndEnterReveal(3 ether, 2 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Auction.DepositDoesNotCoverBid.selector, 2 ether, 3 ether));
        auction.revealBid(id, 3 ether, SECRET);
    }

    function test_RevealBid_RevertsWhenAmountBelowReserve() public {
        // Deposit covers the reserve, but the hidden amount is below it.
        uint256 id = _createCommitAndEnterReveal(0.5 ether, RESERVE);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Auction.BidBelowReserve.selector, 0.5 ether, RESERVE));
        auction.revealBid(id, 0.5 ether, SECRET);
    }

    function test_RevealBid_HigherBidReplacesLeader() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        _commit(id, bob, 3 ether, 3 ether);
        vm.warp(BIDDING_END);

        vm.prank(alice);
        auction.revealBid(id, 2 ether, SECRET);
        vm.prank(bob);
        auction.revealBid(id, 3 ether, SECRET);

        (uint256 highestBid, address highestBidder) = _leader(id);
        assertEq(highestBid, 3 ether);
        assertEq(highestBidder, bob);
    }

    function test_RevealBid_LowerBidDoesNotReplaceLeader() public {
        uint256 id = _createDefault();
        _commit(id, alice, 3 ether, 3 ether);
        _commit(id, bob, 2 ether, 2 ether);
        vm.warp(BIDDING_END);

        vm.prank(alice);
        auction.revealBid(id, 3 ether, SECRET);
        vm.prank(bob);
        auction.revealBid(id, 2 ether, SECRET);

        (uint256 highestBid, address highestBidder) = _leader(id);
        assertEq(highestBid, 3 ether);
        assertEq(highestBidder, alice);
        (,, bool bobRevealed) = auction.bids(id, bob);
        assertTrue(bobRevealed, "losing reveal is still recorded");
    }

    function test_RevealBid_TieKeepsEarliestRevealer() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        _commit(id, bob, 2 ether, 2 ether);
        vm.warp(BIDDING_END);

        vm.prank(alice);
        auction.revealBid(id, 2 ether, SECRET);
        vm.warp(BIDDING_END + 1 hours);
        vm.prank(bob);
        auction.revealBid(id, 2 ether, SECRET);

        (uint256 highestBid, address highestBidder) = _leader(id);
        assertEq(highestBid, 2 ether);
        assertEq(highestBidder, alice, "first to reveal the top amount wins the tie");
    }

    function test_RevealBid_FailedRevealCanBeRetried() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);

        vm.prank(alice);
        vm.expectRevert(Auction.InvalidReveal.selector);
        auction.revealBid(id, 2 ether, keccak256("typo"));

        // Nothing changed after the failure.
        (,, bool revealed) = auction.bids(id, alice);
        assertFalse(revealed, "failed reveal leaves revealed=false");

        vm.warp(REVEAL_END - 1);
        vm.prank(alice);
        auction.revealBid(id, 2 ether, SECRET);
        (, address highestBidder) = _leader(id);
        assertEq(highestBidder, alice, "retry succeeded");
    }

    function test_RevealBid_RevertsOnUnknownAuction() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Auction.AuctionDoesNotExist.selector, 42));
        auction.revealBid(42, 2 ether, SECRET);
    }

    // ---------------------------------------------------------------------
    // finalize
    // ---------------------------------------------------------------------

    /// @dev Helper: reveal as bidder with SECRET.
    function _reveal(uint256 id, address bidder, uint256 amount) internal {
        vm.prank(bidder);
        auction.revealBid(id, amount, SECRET);
    }

    /// @dev Standard three-bidder auction, already finalized.
    ///      alice: bids 2 ether, deposits 2.5 ether, reveals (winner, 0.5 ether excess)
    ///      bob:   bids 1.5 ether, deposits 1.5 ether, reveals (loser, full refund)
    ///      carol: bids 1.2 ether, deposits 1.2 ether, never reveals (forfeits to seller)
    function _finalizedThreeBidderAuction() internal returns (uint256 id) {
        id = _createDefault();
        _commit(id, alice, 2 ether, 2.5 ether);
        _commit(id, bob, 1.5 ether, 1.5 ether);
        _commit(id, carol, 1.2 ether, 1.2 ether);
        vm.warp(BIDDING_END);
        _reveal(id, alice, 2 ether);
        _reveal(id, bob, 1.5 ether);
        vm.warp(REVEAL_END);
        auction.finalize(id);
    }

    function test_Finalize_RevertsOneSecondBeforeRevealEnd() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END - 1);
        vm.expectRevert(Auction.AuctionStillRunning.selector);
        auction.finalize(id);
    }

    function test_Finalize_ExactlyAtRevealEndWorks() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END);
        auction.finalize(id);
        (,,,,,,, bool finalized) = auction.auctions(id);
        assertTrue(finalized);
        assertEq(uint256(auction.getPhase(id)), uint256(Auction.Phase.Finalized));
    }

    function test_RevertWhen_FinalizedTwice() public {
        uint256 id = _finalizedThreeBidderAuction();
        vm.expectRevert(Auction.AlreadyFinalized.selector);
        auction.finalize(id);
    }

    function test_Finalize_RevertsOnUnknownId() public {
        vm.warp(REVEAL_END);
        vm.expectRevert(abi.encodeWithSelector(Auction.AuctionDoesNotExist.selector, 9));
        auction.finalize(9);
    }

    function test_Finalize_AnyoneCanCall() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END);
        vm.prank(makeAddr("randomStranger"));
        auction.finalize(id);
        (,,,,,,, bool finalized) = auction.auctions(id);
        assertTrue(finalized);
    }

    function test_Finalize_SellerCreditedWinningBidPlusForfeits() public {
        _finalizedThreeBidderAuction();
        // winning bid 2 ether + carol's forfeited 1.2 ether
        assertEq(auction.pendingWithdrawals(seller), 3.2 ether);
    }

    function test_Finalize_WinnerCreditedExcessDeposit() public {
        _finalizedThreeBidderAuction();
        // deposited 2.5, bid 2 -> 0.5 back
        assertEq(auction.pendingWithdrawals(alice), 0.5 ether);
    }

    function test_Finalize_WinnerWithExactDepositGetsNothingBack() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END);
        auction.finalize(id);
        assertEq(auction.pendingWithdrawals(alice), 0);
        assertEq(auction.pendingWithdrawals(seller), 2 ether);
    }

    function test_LosingBidderCanWithdrawRefund() public {
        _finalizedThreeBidderAuction();
        assertEq(auction.pendingWithdrawals(bob), 1.5 ether, "credited");

        uint256 before = bob.balance;
        vm.expectEmit(true, false, false, true, address(auction));
        emit Withdrawal(bob, 1.5 ether);
        vm.prank(bob);
        auction.withdraw();

        assertEq(bob.balance, before + 1.5 ether, "ETH received exactly");
        assertEq(auction.pendingWithdrawals(bob), 0, "balance cleared");
    }

    function test_NoRevealForfeitsDepositToSeller() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        _commit(id, carol, 1.2 ether, 1.2 ether);
        vm.warp(BIDDING_END);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END);

        vm.expectEmit(true, true, false, true, address(auction));
        emit DepositForfeited(id, carol, 1.2 ether);
        vm.expectEmit(true, true, false, true, address(auction));
        emit AuctionFinalized(id, alice, 2 ether);
        auction.finalize(id);

        assertEq(auction.pendingWithdrawals(carol), 0, "non-revealer gets nothing");
        assertEq(auction.pendingWithdrawals(seller), 3.2 ether, "seller gets bid + forfeit");
        // Bid data is kept for transparency.
        (bytes32 c, uint256 d, bool r) = auction.bids(id, carol);
        assertTrue(c != bytes32(0));
        assertEq(d, 1.2 ether);
        assertFalse(r);
    }

    function test_Finalize_NoRevealsSellerGetsEverythingNoWinner() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        _commit(id, bob, 1.5 ether, 1.5 ether);
        vm.warp(REVEAL_END);

        vm.expectEmit(true, true, false, true, address(auction));
        emit AuctionFinalized(id, address(0), 0);
        auction.finalize(id);

        assertEq(auction.pendingWithdrawals(seller), 3.5 ether, "all deposits to seller");
        assertEq(auction.pendingWithdrawals(alice), 0);
        assertEq(auction.pendingWithdrawals(bob), 0);
        (,,,,, uint256 highestBid, address highestBidder,) = auction.auctions(id);
        assertEq(highestBidder, address(0));
        assertEq(highestBid, 0);
    }

    function test_Finalize_NoBiddersAtAll() public {
        uint256 id = _createDefault();
        vm.warp(REVEAL_END);
        vm.expectEmit(true, true, false, true, address(auction));
        emit AuctionFinalized(id, address(0), 0);
        auction.finalize(id);
        assertEq(auction.pendingWithdrawals(seller), 0);
    }

    function test_Finalize_AccountingCreditsEqualDeposits() public {
        uint256 totalDeposits = 2.5 ether + 1.5 ether + 1.2 ether;
        _finalizedThreeBidderAuction();

        uint256 totalCredits = auction.pendingWithdrawals(seller) + auction.pendingWithdrawals(alice)
            + auction.pendingWithdrawals(bob) + auction.pendingWithdrawals(carol);

        assertEq(totalCredits, totalDeposits, "every wei credited exactly once");
        assertEq(address(auction).balance, totalDeposits, "contract still holds everything");
    }

    function test_Finalize_ContractEmptyAfterEveryoneWithdraws() public {
        _finalizedThreeBidderAuction();

        vm.prank(seller);
        auction.withdraw();
        vm.prank(alice);
        auction.withdraw();
        vm.prank(bob);
        auction.withdraw();
        // carol has nothing to withdraw

        assertEq(address(auction).balance, 0, "contract drained exactly");
    }

    function test_Finalize_CreditsAccumulateAcrossAuctions() public {
        // Same seller runs two auctions; alice wins both with exact deposits.
        uint256 first = _createDefault();
        vm.prank(seller);
        uint256 second = auction.createAuction("Second item", RESERVE, BIDDING_END, REVEAL_END);
        _commit(first, alice, 2 ether, 2 ether);
        _commit(second, alice, 3 ether, 3 ether);
        vm.warp(BIDDING_END);
        _reveal(first, alice, 2 ether);
        _reveal(second, alice, 3 ether);
        vm.warp(REVEAL_END);
        auction.finalize(first);
        auction.finalize(second);
        assertEq(auction.pendingWithdrawals(seller), 5 ether);
    }

    // ---------------------------------------------------------------------
    // withdraw
    // ---------------------------------------------------------------------

    function test_Withdraw_RevertsOnSecondCall() public {
        _finalizedThreeBidderAuction();
        vm.prank(bob);
        auction.withdraw();
        vm.prank(bob);
        vm.expectRevert(Auction.NothingToWithdraw.selector);
        auction.withdraw();
    }

    function test_Withdraw_RevertsWithZeroBalance() public {
        _finalizedThreeBidderAuction();
        vm.prank(makeAddr("nobody"));
        vm.expectRevert(Auction.NothingToWithdraw.selector);
        auction.withdraw();
    }

    function test_Withdraw_RevertsBeforeFinalize() public {
        uint256 id = _createCommitAndEnterReveal(2 ether, 2 ether);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END);
        // Not finalized yet, so nothing has been credited to anyone.
        vm.prank(alice);
        vm.expectRevert(Auction.NothingToWithdraw.selector);
        auction.withdraw();
        vm.prank(seller);
        vm.expectRevert(Auction.NothingToWithdraw.selector);
        auction.withdraw();
    }

    function test_Withdraw_RevertsWhenReceiverRejectsEthAndKeepsCredit() public {
        RejectingReceiver rejecting = new RejectingReceiver(auction);
        vm.deal(address(rejecting), 5 ether);

        uint256 id = _createDefault();
        rejecting.commit(id, _commitmentFor(2 ether, address(rejecting)), 2.5 ether);
        vm.warp(BIDDING_END);
        rejecting.reveal(id, 2 ether, SECRET);
        vm.warp(REVEAL_END);
        auction.finalize(id);
        assertEq(auction.pendingWithdrawals(address(rejecting)), 0.5 ether);

        vm.expectRevert(Auction.WithdrawFailed.selector);
        rejecting.withdraw();
        // Revert rolled back the zeroing, so the credit is still there.
        assertEq(auction.pendingWithdrawals(address(rejecting)), 0.5 ether);
    }

    // ---------------------------------------------------------------------
    // Required named tests (the rest of the 7 are renamed tests above)
    // ---------------------------------------------------------------------

    function test_RevertWhen_RevealOutsideWindow() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);

        // Before biddingEnd: still in Bidding.
        vm.warp(BIDDING_END - 1);
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);

        // Exactly at revealEnd: window is closed.
        vm.warp(REVEAL_END);
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);

        // Well after revealEnd.
        vm.warp(REVEAL_END + 7 days);
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);

        (,, bool revealed) = auction.bids(id, alice);
        assertFalse(revealed, "no reveal was recorded");
    }

    function test_TwoConcurrentAuctionsDoNotInterfere() public {
        // Auction A: seller, reserve 1 ether, default deadlines. Bidders alice (wins) and bob.
        // Auction B: otherSeller, reserve 2 ether, later deadlines. Bidders carol (wins) and dave.
        uint256 bEnd = BIDDING_END + 6 hours;
        uint256 rEnd = REVEAL_END + 6 hours;
        address dave = makeAddr("dave");
        vm.deal(dave, 10 ether);

        uint256 a = _createDefault();
        vm.prank(otherSeller);
        uint256 b = auction.createAuction("Projector", 2 ether, bEnd, rEnd);

        // Interleaved commits.
        _commit(a, alice, 3 ether, 3.5 ether);
        _commit(b, carol, 4 ether, 4 ether);
        _commit(a, bob, 2 ether, 2 ether);
        _commit(b, dave, 2.5 ether, 3 ether);
        assertEq(auction.getBidderCount(a), 2);
        assertEq(auction.getBidderCount(b), 2);

        // A enters reveal first; B is still bidding.
        vm.warp(BIDDING_END);
        assertEq(uint256(auction.getPhase(a)), uint256(Auction.Phase.Reveal));
        assertEq(uint256(auction.getPhase(b)), uint256(Auction.Phase.Bidding));
        _reveal(a, alice, 3 ether);
        vm.prank(carol);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(b, 4 ether, SECRET);

        // B enters reveal; interleave the remaining reveals.
        vm.warp(bEnd);
        _reveal(b, dave, 2.5 ether);
        _reveal(a, bob, 2 ether);
        _reveal(b, carol, 4 ether);

        // A can finalize while B is still in reveal.
        vm.warp(REVEAL_END);
        assertEq(uint256(auction.getPhase(b)), uint256(Auction.Phase.Reveal));
        vm.expectRevert(Auction.AuctionStillRunning.selector);
        auction.finalize(b);
        auction.finalize(a);
        assertEq(uint256(auction.getPhase(a)), uint256(Auction.Phase.Finalized));
        assertEq(uint256(auction.getPhase(b)), uint256(Auction.Phase.Reveal));

        // Credits come from A only.
        assertEq(auction.pendingWithdrawals(seller), 3 ether, "A seller gets A bid");
        assertEq(auction.pendingWithdrawals(alice), 0.5 ether, "A winner excess");
        assertEq(auction.pendingWithdrawals(bob), 2 ether, "A loser refund");
        assertEq(auction.pendingWithdrawals(otherSeller), 0, "B seller untouched");
        assertEq(auction.pendingWithdrawals(carol), 0, "B bidder untouched");
        assertEq(auction.pendingWithdrawals(dave), 0, "B bidder untouched");

        // bob withdraws from A while B is not yet finalized.
        vm.prank(bob);
        auction.withdraw();
        assertEq(address(auction).balance, 3.5 ether + 4 ether + 3 ether, "B deposits still held");

        // Finalize B.
        vm.warp(rEnd);
        auction.finalize(b);

        (,,,,, uint256 hbA, address hwA,) = auction.auctions(a);
        (,,,,, uint256 hbB, address hwB,) = auction.auctions(b);
        assertEq(hwA, alice, "A winner");
        assertEq(hbA, 3 ether, "A winning bid");
        assertEq(hwB, carol, "B winner");
        assertEq(hbB, 4 ether, "B winning bid");

        assertEq(auction.pendingWithdrawals(otherSeller), 4 ether, "B seller gets B bid");
        assertEq(auction.pendingWithdrawals(carol), 0, "B winner had exact deposit");
        assertEq(auction.pendingWithdrawals(dave), 3 ether, "B loser refund");
        assertEq(auction.pendingWithdrawals(seller), 3 ether, "A seller unchanged by B");
        assertEq(auction.pendingWithdrawals(alice), 0.5 ether, "A winner unchanged by B");
        assertEq(uint256(auction.getPhase(a)), uint256(Auction.Phase.Finalized));
        assertEq(uint256(auction.getPhase(b)), uint256(Auction.Phase.Finalized));

        // Drain everything.
        vm.prank(seller);
        auction.withdraw();
        vm.prank(alice);
        auction.withdraw();
        vm.prank(otherSeller);
        auction.withdraw();
        vm.prank(dave);
        auction.withdraw();
        assertEq(address(auction).balance, 0, "both auctions fully paid out");
    }

    // ---------------------------------------------------------------------
    // Adversarial
    // ---------------------------------------------------------------------

    function test_Adversarial_ReentrantWithdrawGetsRefundOnlyOnce() public {
        ReentrancyAttacker attacker = new ReentrancyAttacker(auction);
        vm.deal(address(attacker), 5 ether);

        uint256 id = _createDefault();
        _commit(id, alice, 3 ether, 3 ether); // alice wins
        attacker.commit(id, 1.5 ether, 1.5 ether); // attacker loses
        vm.warp(BIDDING_END);
        _reveal(id, alice, 3 ether);
        attacker.reveal(id, 1.5 ether);
        vm.warp(REVEAL_END);
        auction.finalize(id);

        uint256 attackerBefore = address(attacker).balance;
        uint256 contractBefore = address(auction).balance;
        attacker.attack();

        assertEq(address(attacker).balance, attackerBefore + 1.5 ether, "exactly one refund received");
        assertEq(address(auction).balance, contractBefore - 1.5 ether, "nothing extra left the contract");
        assertEq(auction.pendingWithdrawals(address(attacker)), 0, "credit consumed");
        assertGt(attacker.reentryAttempts(), 0, "attacker did try to re-enter");
        assertEq(attacker.reentrySuccesses(), 0, "re-entry never succeeded");
        // Other parties' funds are intact.
        assertEq(auction.pendingWithdrawals(seller), 3 ether, "seller credit untouched");
        assertEq(address(auction).balance, 3 ether, "seller's ETH still held");
    }

    function test_Adversarial_PlainEthTransferReverts() public {
        uint256 before = address(auction).balance;

        (bool ok,) = address(auction).call{value: 1 ether}("");
        assertFalse(ok, "no receive(): plain ETH must be rejected");

        (bool ok2,) = address(auction).call{value: 1 ether}(hex"deadbeef");
        assertFalse(ok2, "no fallback(): unknown selector must be rejected");

        assertEq(address(auction).balance, before, "balance unchanged");
    }

    function test_Adversarial_CopiedCommitmentCommitsButCannotReveal() public {
        uint256 id = _createDefault();
        bytes32 aliceCommitment = _commitmentFor(2 ether, alice);
        _commit(id, alice, 2 ether, 2 ether);

        // Bob copies alice's hash from the BidCommitted event. The commit itself is accepted.
        vm.prank(bob);
        auction.commitBid{value: 2 ether}(id, aliceCommitment);
        (bytes32 stored,,) = auction.bids(id, bob);
        assertEq(stored, aliceCommitment, "copied hash is stored");

        vm.warp(BIDDING_END);
        _reveal(id, alice, 2 ether);

        // Even knowing alice's amount and secret, bob cannot open it: his address is not in the hash.
        vm.prank(bob);
        vm.expectRevert(Auction.InvalidReveal.selector);
        auction.revealBid(id, 2 ether, SECRET);

        // Bob ends up as a non-revealer and forfeits his copycat deposit to the seller.
        vm.warp(REVEAL_END);
        auction.finalize(id);
        assertEq(auction.pendingWithdrawals(bob), 0, "copier forfeits");
        assertEq(auction.pendingWithdrawals(seller), 4 ether, "alice's bid + bob's forfeit");
    }

    function test_Adversarial_SellerBiddingInOwnAuction() public {
        // Documented behaviour (NOTES.md): nothing stops the seller from bidding. If they win they
        // are credited the winning bid as seller and their excess as winner, so the whole deposit
        // comes back and the item stays with them. Losers are refunded exactly as usual.
        uint256 id = _createDefault();
        vm.deal(seller, 10 ether);
        _commit(id, seller, 3 ether, 3.5 ether);
        _commit(id, alice, 2 ether, 2 ether);
        vm.warp(BIDDING_END);
        _reveal(id, seller, 3 ether);
        _reveal(id, alice, 2 ether);
        vm.warp(REVEAL_END);
        auction.finalize(id);

        (,,,,, uint256 hb, address hw,) = auction.auctions(id);
        assertEq(hw, seller, "seller can win their own auction");
        assertEq(hb, 3 ether);
        assertEq(auction.pendingWithdrawals(seller), 3.5 ether, "3 as seller + 0.5 as winner = whole deposit");
        assertEq(auction.pendingWithdrawals(alice), 2 ether, "loser fully refunded");
        assertEq(
            auction.pendingWithdrawals(seller) + auction.pendingWithdrawals(alice), 5.5 ether, "all deposits accounted"
        );
    }

    function test_Adversarial_WrongRevealsUntilDeadlineAreForfeited() public {
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        _commit(id, bob, 1.5 ether, 1.5 ether);
        vm.warp(BIDDING_END);
        _reveal(id, bob, 1.5 ether);

        // alice keeps getting it wrong, right up to the last second of the window.
        uint256[3] memory times = [BIDDING_END, BIDDING_END + 12 hours, REVEAL_END - 1];
        for (uint256 i = 0; i < times.length; i++) {
            vm.warp(times[i]);
            vm.prank(alice);
            vm.expectRevert(Auction.InvalidReveal.selector);
            auction.revealBid(id, 2 ether, keccak256(abi.encode("wrong", i)));
        }

        vm.warp(REVEAL_END);
        vm.expectEmit(true, true, false, true, address(auction));
        emit DepositForfeited(id, alice, 2 ether);
        auction.finalize(id);

        (,,,,, uint256 hb, address hw,) = auction.auctions(id);
        assertEq(hw, bob, "only the valid revealer can win");
        assertEq(hb, 1.5 ether);
        assertEq(auction.pendingWithdrawals(alice), 0, "forfeited");
        assertEq(auction.pendingWithdrawals(bob), 0, "winner paid exactly their bid");
        assertEq(auction.pendingWithdrawals(seller), 1.5 ether + 2 ether, "bid + forfeit");
    }

    function test_Adversarial_TwentyBiddersSettleCorrectly() public {
        uint256 id = _createDefault();
        uint256 n = 20;
        address[] memory people = new address[](n);
        uint256 totalDeposits;
        uint256 expectedForfeits;
        uint256 expectedRefunds;

        // Bidder i bids 1.0 + 0.1*i ether (strictly increasing). Odd bidders over-deposit by 0.05.
        for (uint256 i = 0; i < n; i++) {
            people[i] = makeAddr(string(abi.encodePacked("bidder", vm.toString(i))));
            vm.deal(people[i], 100 ether);
            uint256 amount = 1 ether + i * 0.1 ether;
            uint256 deposit = amount + (i % 2) * 0.05 ether;
            vm.prank(people[i]);
            auction.commitBid{value: deposit}(id, _commitmentFor(amount, people[i]));
            totalDeposits += deposit;
        }
        assertEq(auction.getBidderCount(id), n);

        // Every third bidder (0, 3, 6, ...) never reveals. Highest revealer is i = 19 -> 2.9 ether.
        vm.warp(BIDDING_END);
        for (uint256 i = 0; i < n; i++) {
            uint256 amount = 1 ether + i * 0.1 ether;
            uint256 deposit = amount + (i % 2) * 0.05 ether;
            if (i % 3 == 0) {
                expectedForfeits += deposit;
                continue;
            }
            vm.prank(people[i]);
            auction.revealBid(id, amount, SECRET);
            if (i != 19) expectedRefunds += deposit;
        }

        vm.warp(REVEAL_END);
        auction.finalize(id);

        (,,,,, uint256 hb, address hw,) = auction.auctions(id);
        assertEq(hw, people[19], "highest revealer wins");
        assertEq(hb, 2.9 ether);

        uint256 winnerExcess = 0.05 ether; // 19 is odd, so over-deposited
        assertEq(auction.pendingWithdrawals(people[19]), winnerExcess, "winner excess");
        assertEq(auction.pendingWithdrawals(seller), 2.9 ether + expectedForfeits, "seller credit");

        uint256 totalCredits = auction.pendingWithdrawals(seller);
        for (uint256 i = 0; i < n; i++) {
            totalCredits += auction.pendingWithdrawals(people[i]);
        }
        assertEq(totalCredits, totalDeposits, "credits == deposits");
        assertEq(totalCredits, expectedRefunds + winnerExcess + 2.9 ether + expectedForfeits, "bucket sum");

        for (uint256 i = 0; i < n; i++) {
            if (auction.pendingWithdrawals(people[i]) == 0) continue;
            vm.prank(people[i]);
            auction.withdraw();
        }
        vm.prank(seller);
        auction.withdraw();
        assertEq(address(auction).balance, 0, "contract drained");
    }

    // Scratch storage for the fuzz test. Keeping these out of the stack avoids "stack too deep".
    address[4] internal fzPeople;
    uint256[4] internal fzAmounts;
    uint256[4] internal fzDeposits;
    bytes32[4] internal fzSecrets;
    bool[4] internal fzRevealed;

    /// @dev Fuzz: 4 bidders with random amounts, over-deposits, secrets, reveal choices and reveal order.
    ///      Invariants: total credited == total deposited, highestBid == max of valid revealed amounts,
    ///      the winner is the earliest revealer of that max, and the contract drains to zero.
    function testFuzz_AccountingAndWinner(
        uint256[4] memory rawAmounts,
        uint256[4] memory rawExcess,
        bytes32[4] memory secrets,
        uint8 revealMask,
        uint8 orderSeed
    ) public {
        uint256 id = _createDefault();
        uint256 totalDeposits = _fuzzCommit(id, rawAmounts, rawExcess, secrets);

        vm.warp(BIDDING_END);
        (uint256 expectedHighest, address expectedWinner) = _fuzzReveal(id, revealMask, orderSeed);

        vm.warp(REVEAL_END);
        auction.finalize(id);

        _fuzzAssertSettlement(id, totalDeposits, expectedHighest, expectedWinner);
    }

    /// @dev Bound the inputs, fund each bidder with exactly their deposit, and commit.
    function _fuzzCommit(uint256 id, uint256[4] memory rawAmounts, uint256[4] memory rawExcess, bytes32[4] memory secrets)
        internal
        returns (uint256 totalDeposits)
    {
        fzPeople = [alice, bob, carol, makeAddr("dave")];
        for (uint256 i = 0; i < 4; i++) {
            fzAmounts[i] = bound(rawAmounts[i], RESERVE, 5 ether);
            fzDeposits[i] = fzAmounts[i] + bound(rawExcess[i], 0, 1 ether);
            fzSecrets[i] = secrets[i];
            fzRevealed[i] = false;
            vm.deal(fzPeople[i], fzDeposits[i]);
            vm.prank(fzPeople[i]);
            auction.commitBid{value: fzDeposits[i]}(id, keccak256(abi.encode(fzAmounts[i], secrets[i], fzPeople[i])));
            totalDeposits += fzDeposits[i];
        }
    }

    /// @dev Reveal in a rotated (and maybe reversed) order derived from orderSeed; skip bidders not in revealMask.
    ///      Tracks the expected winner the same way the contract should: strict > on amount, first reveal wins ties.
    function _fuzzReveal(uint256 id, uint8 revealMask, uint8 orderSeed)
        internal
        returns (uint256 expectedHighest, address expectedWinner)
    {
        for (uint256 k = 0; k < 4; k++) {
            uint256 i = (k + orderSeed) % 4;
            if (orderSeed >= 128) i = 3 - i;
            if ((revealMask >> i) & 1 == 0) continue;
            vm.prank(fzPeople[i]);
            auction.revealBid(id, fzAmounts[i], fzSecrets[i]);
            fzRevealed[i] = true;
            if (fzAmounts[i] > expectedHighest) {
                expectedHighest = fzAmounts[i];
                expectedWinner = fzPeople[i];
            }
        }
    }

    /// @dev Check winner, accounting invariant, seller bucket, and drain the contract to zero.
    function _fuzzAssertSettlement(uint256 id, uint256 totalDeposits, uint256 expectedHighest, address expectedWinner)
        internal
    {
        uint256 expectedForfeits;
        for (uint256 i = 0; i < 4; i++) {
            if (!fzRevealed[i]) expectedForfeits += fzDeposits[i];
        }

        (,,,,, uint256 hb, address hw,) = auction.auctions(id);
        assertEq(hb, expectedHighest, "highestBid == max valid revealed amount");
        assertEq(hw, expectedWinner, "winner == earliest revealer of the max");

        uint256 totalCredits = auction.pendingWithdrawals(seller);
        for (uint256 i = 0; i < 4; i++) {
            totalCredits += auction.pendingWithdrawals(fzPeople[i]);
        }
        assertEq(totalCredits, totalDeposits, "total credited == total deposited");
        assertEq(auction.pendingWithdrawals(seller), expectedHighest + expectedForfeits, "seller bucket");

        for (uint256 i = 0; i < 4; i++) {
            if (auction.pendingWithdrawals(fzPeople[i]) == 0) continue;
            vm.prank(fzPeople[i]);
            auction.withdraw();
        }
        if (auction.pendingWithdrawals(seller) > 0) {
            vm.prank(seller);
            auction.withdraw();
        }
        assertEq(address(auction).balance, 0, "contract drained");
    }

    // ---------------------------------------------------------------------
    // Live demo: run with  forge test --match-test test_Demo_FullFlow -vv
    // ---------------------------------------------------------------------

    function test_Demo_FullFlow() public {
        console.log("=== Mehran University surplus auction: full flow ===");

        console.log("[1] CREATE   seller lists 'Dell OptiPlex 7090 desktop', reserve 1 ether");
        uint256 id = _createDefault();
        console.log("    auctionId = %s, biddingEnd = %s, revealEnd = %s", id, BIDDING_END, REVEAL_END);
        console.log("    phase = Bidding");

        console.log("[2] COMMIT   bidders lock a hash + deposit; amounts stay hidden");
        _commit(id, alice, 2 ether, 2.5 ether);
        console.log("    alice  commits hash, deposits 2.5 ether (secretly bidding 2.0)");
        _commit(id, bob, 1.5 ether, 1.5 ether);
        console.log("    bob    commits hash, deposits 1.5 ether (secretly bidding 1.5)");
        _commit(id, carol, 1.2 ether, 1.2 ether);
        console.log("    carol  commits hash, deposits 1.2 ether (secretly bidding 1.2)");
        console.log("    contract holds %s wei from %s bidders", address(auction).balance, auction.getBidderCount(id));

        vm.warp(BIDDING_END);
        console.log("[3] REVEAL   clock reaches biddingEnd; phase = Reveal");
        _reveal(id, alice, 2 ether);
        console.log("    alice  reveals 2.0 ether -> new leader");
        _reveal(id, bob, 1.5 ether);
        console.log("    bob    reveals 1.5 ether -> lower, alice stays leader");
        console.log("    carol  never reveals");

        (,,,,, uint256 hb, address hw,) = auction.auctions(id);
        console.log("[4] RANK     highestBidder = %s, highestBid = %s wei", hw, hb);
        assertEq(hw, alice);

        vm.warp(REVEAL_END);
        console.log("[5] FINALIZE clock reaches revealEnd; anyone can settle (no ETH moves)");
        auction.finalize(id);
        console.log("    FORFEIT  carol's 1.2 ether deposit goes to the seller");
        console.log("    credit   seller = %s wei (2.0 bid + 1.2 forfeit)", auction.pendingWithdrawals(seller));
        console.log("    credit   alice  = %s wei (2.5 deposit - 2.0 bid)", auction.pendingWithdrawals(alice));
        console.log("    credit   bob    = %s wei (full refund)", auction.pendingWithdrawals(bob));
        console.log("    credit   carol  = %s wei", auction.pendingWithdrawals(carol));
        uint256 credits = auction.pendingWithdrawals(seller) + auction.pendingWithdrawals(alice)
            + auction.pendingWithdrawals(bob) + auction.pendingWithdrawals(carol);
        console.log("    accounting: credited %s == held %s", credits, address(auction).balance);
        assertEq(credits, address(auction).balance);

        console.log("[6] WITHDRAW each party pulls their own funds");
        vm.prank(seller);
        auction.withdraw();
        console.log("    seller withdrew -> wallet %s wei", seller.balance);
        vm.prank(alice);
        auction.withdraw();
        console.log("    alice  withdrew -> wallet %s wei", alice.balance);
        vm.prank(bob);
        auction.withdraw();
        console.log("    bob    withdrew -> wallet %s wei", bob.balance);
        console.log("    contract balance = %s wei", address(auction).balance);
        assertEq(address(auction).balance, 0);
        console.log("=== done ===");
    }

    // ---------------------------------------------------------------------
    // Audit findings (see NOTES.md "Audit log")
    // ---------------------------------------------------------------------

    /// @dev A-1: Withdrawal is logged exactly once, before the ETH call, even when the receiver re-enters.
    function test_Audit_WithdrawalEventEmittedOnceUnderReentrancy() public {
        ReentrancyAttacker attacker = new ReentrancyAttacker(auction);
        vm.deal(address(attacker), 5 ether);
        uint256 id = _createDefault();
        _commit(id, alice, 3 ether, 3 ether);
        attacker.commit(id, 1.5 ether, 1.5 ether);
        vm.warp(BIDDING_END);
        _reveal(id, alice, 3 ether);
        attacker.reveal(id, 1.5 ether);
        vm.warp(REVEAL_END);
        auction.finalize(id);

        vm.recordLogs();
        attacker.attack();
        Vm.Log[] memory logs = vm.getRecordedLogs();

        bytes32 sig = keccak256("Withdrawal(address,uint256)");
        uint256 seen;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter != address(auction) || logs[i].topics[0] != sig) continue;
            seen++;
            assertEq(address(uint160(uint256(logs[i].topics[1]))), address(attacker), "account");
            assertEq(abi.decode(logs[i].data, (uint256)), 1.5 ether, "amount");
        }
        assertEq(seen, 1, "exactly one Withdrawal log");
        assertGt(attacker.reentryAttempts(), 0, "re-entry was attempted");
    }

    /// @dev A-2: cross-function re-entry (finalize + withdraw from inside receive) pays only what is owed.
    function test_Audit_CrossFunctionReentrancyCannotDrain() public {
        uint256 a = _createDefault();
        vm.prank(seller);
        uint256 b = auction.createAuction("Second item", RESERVE, BIDDING_END, REVEAL_END);
        CrossFunctionAttacker attacker = new CrossFunctionAttacker(auction, b);
        vm.deal(address(attacker), 5 ether);

        _commit(a, alice, 3 ether, 3 ether);
        _commit(b, alice, 3 ether, 3 ether);
        attacker.commit(a, 1.5 ether, 1.5 ether);
        attacker.commit(b, 1.2 ether, 1.2 ether);
        vm.warp(BIDDING_END);
        _reveal(a, alice, 3 ether);
        _reveal(b, alice, 3 ether);
        attacker.reveal(a, 1.5 ether);
        attacker.reveal(b, 1.2 ether);
        vm.warp(REVEAL_END);
        auction.finalize(a); // b is left for the attacker's callback to finalize

        uint256 before = address(attacker).balance;
        attacker.attack();

        // Received exactly its two legitimate refunds and nothing more.
        assertEq(address(attacker).balance, before + 1.5 ether + 1.2 ether, "only what was owed");
        assertEq(attacker.nestedWithdrawSuccesses(), 1, "nested withdraw paid the second refund once");
        assertEq(auction.pendingWithdrawals(address(attacker)), 0);
        assertEq(auction.pendingWithdrawals(seller), 6 ether, "seller credits intact");
        assertEq(address(auction).balance, 6 ether, "contract holds exactly the seller's credits");
    }

    /// @dev A-3: a bidder cap keeps finalize's loop bounded. The cap+1-th commit reverts.
    function test_Audit_BidderCapRevertsNextCommit() public {
        uint256 id = _createDefault();
        uint256 cap = auction.MAX_BIDDERS();
        for (uint256 i = 0; i < cap; i++) {
            address p = makeAddr(string(abi.encodePacked("cap", vm.toString(i))));
            vm.deal(p, RESERVE);
            vm.prank(p);
            auction.commitBid{value: RESERVE}(id, _commitmentFor(RESERVE, p));
        }
        assertEq(auction.getBidderCount(id), cap);

        address extra = makeAddr("oneTooMany");
        vm.deal(extra, RESERVE);
        vm.prank(extra);
        vm.expectRevert(abi.encodeWithSelector(Auction.TooManyBidders.selector, cap));
        auction.commitBid{value: RESERVE}(id, _commitmentFor(RESERVE, extra));
    }

    /// @dev A-3: finalize at the cap, worst case for storage writes, stays far below a 30M block.
    function test_Audit_FinalizeAtBidderCapFitsInOneBlock() public {
        uint256 id = _createDefault();
        uint256 cap = auction.MAX_BIDDERS();
        address[] memory people = new address[](cap);
        uint256 totalDeposits;
        for (uint256 i = 0; i < cap; i++) {
            people[i] = makeAddr(string(abi.encodePacked("gas", vm.toString(i))));
            uint256 amount = RESERVE + i * 0.001 ether;
            vm.deal(people[i], amount);
            vm.prank(people[i]);
            auction.commitBid{value: amount}(id, _commitmentFor(amount, people[i]));
            totalDeposits += amount;
        }
        vm.warp(BIDDING_END);
        for (uint256 i = 0; i < cap; i++) {
            if (i % 2 == 1) continue; // odd bidders never reveal
            vm.prank(people[i]);
            auction.revealBid(id, RESERVE + i * 0.001 ether, SECRET);
        }
        vm.warp(REVEAL_END);

        uint256 gasBefore = gasleft();
        auction.finalize(id);
        uint256 gasUsed = gasBefore - gasleft();
        console.log("finalize gas with %s bidders: %s", cap, gasUsed);
        assertLt(gasUsed, 15_000_000, "must fit comfortably inside one block");

        uint256 credits = auction.pendingWithdrawals(seller);
        for (uint256 i = 0; i < cap; i++) {
            credits += auction.pendingWithdrawals(people[i]);
        }
        assertEq(credits, totalDeposits, "accounting holds at the cap");
    }

    /// @dev A-4: at every boundary instant exactly one of commit / reveal / finalize is open.
    function test_Audit_ExactlyOneActionOpenAtEachBoundary() public {
        uint256[4] memory at = [BIDDING_END - 1, BIDDING_END, REVEAL_END - 1, REVEAL_END];
        bool[4] memory commitOpen = [true, false, false, false];
        bool[4] memory revealOpen = [false, true, true, false];
        bool[4] memory finalizeOpen = [false, false, false, true];

        for (uint256 i = 0; i < 4; i++) {
            vm.warp(START);
            uint256 id = _createDefault();
            _commit(id, alice, 2 ether, 2 ether);
            vm.warp(at[i]);

            vm.prank(bob);
            if (!commitOpen[i]) vm.expectRevert(Auction.BiddingClosed.selector);
            auction.commitBid{value: 2 ether}(id, _commitmentFor(2 ether, bob));

            vm.prank(alice);
            if (!revealOpen[i]) vm.expectRevert(Auction.NotRevealPhase.selector);
            auction.revealBid(id, 2 ether, SECRET);

            if (!finalizeOpen[i]) vm.expectRevert(Auction.AuctionStillRunning.selector);
            auction.finalize(id);

            uint256 openCount = (commitOpen[i] ? 1 : 0) + (revealOpen[i] ? 1 : 0) + (finalizeOpen[i] ? 1 : 0);
            assertEq(openCount, 1, "no gap and no overlap");
        }
    }

    /// @dev A-5: three-way tie keeps the first revealer; only a strictly higher amount replaces the leader.
    function test_Audit_ThreeWayTieThenStrictlyHigherBid() public {
        address dave = makeAddr("dave");
        vm.deal(dave, 10 ether);
        uint256 id = _createDefault();
        _commit(id, alice, 2 ether, 2 ether);
        _commit(id, bob, 2 ether, 2 ether);
        _commit(id, carol, 2 ether, 2 ether);
        _commit(id, dave, 2.5 ether, 2.5 ether);
        vm.warp(BIDDING_END);

        _reveal(id, bob, 2 ether);
        _reveal(id, alice, 2 ether);
        _reveal(id, carol, 2 ether);
        (, address leader) = _leader(id);
        assertEq(leader, bob, "first of the tied revealers leads");

        _reveal(id, dave, 2.5 ether);
        (uint256 hb, address winner) = _leader(id);
        assertEq(winner, dave, "strictly higher replaces");
        assertEq(hb, 2.5 ether);

        vm.warp(REVEAL_END);
        auction.finalize(id);
        assertEq(auction.pendingWithdrawals(alice) + auction.pendingWithdrawals(bob) + auction.pendingWithdrawals(carol), 6 ether);
        assertEq(auction.pendingWithdrawals(seller), 2.5 ether);
    }

    /// @dev A-6: global accounting. Contract balance == all credits + deposits of auctions not yet finalized.
    function test_Audit_ContractBalanceEqualsCreditsPlusOpenDeposits() public {
        uint256 a = _createDefault();
        vm.prank(otherSeller);
        uint256 b = auction.createAuction("Later item", RESERVE, BIDDING_END + 1 days, REVEAL_END + 1 days);

        _commit(a, alice, 2 ether, 2.5 ether);
        _commit(a, bob, 1.5 ether, 1.5 ether);
        _commit(b, carol, 2 ether, 2 ether);
        vm.warp(BIDDING_END);
        _reveal(a, alice, 2 ether);
        vm.warp(REVEAL_END);
        auction.finalize(a);

        uint256 openDepositsB = 2 ether;
        assertEq(address(auction).balance, _allCredits() + openDepositsB, "after finalize(a)");

        vm.prank(alice);
        auction.withdraw();
        assertEq(address(auction).balance, _allCredits() + openDepositsB, "after a withdrawal");

        vm.warp(REVEAL_END + 1 days);
        auction.finalize(b); // carol never revealed: her deposit is credited to otherSeller
        assertEq(address(auction).balance, _allCredits(), "after finalize(b)");

        vm.prank(seller);
        auction.withdraw();
        vm.prank(otherSeller);
        auction.withdraw();
        assertEq(address(auction).balance, 0, "fully drained");
    }

    function _allCredits() internal view returns (uint256) {
        return auction.pendingWithdrawals(seller) + auction.pendingWithdrawals(otherSeller)
            + auction.pendingWithdrawals(alice) + auction.pendingWithdrawals(bob) + auction.pendingWithdrawals(carol);
    }

    /// @dev A-7 (documented, not changed): the spec allows a 1-second reveal window. Deadlines are
    ///      public before anyone commits, so a bidder can refuse such an auction. One who commits
    ///      anyway and misses the window forfeits, exactly like any other non-revealer.
    function test_Audit_ShortRevealWindowIsVisibleBeforeCommit() public {
        vm.prank(seller);
        uint256 id = auction.createAuction("Rushed sale", RESERVE, START + 10, START + 11);
        (,,, uint256 bEnd, uint256 rEnd,,,) = auction.auctions(id);
        assertEq(rEnd - bEnd, 1, "reveal window length is readable on-chain before committing");

        _commit(id, alice, 2 ether, 2 ether);
        vm.warp(START + 11); // the single reveal second has already passed
        vm.prank(alice);
        vm.expectRevert(Auction.NotRevealPhase.selector);
        auction.revealBid(id, 2 ether, SECRET);

        auction.finalize(id);
        assertEq(auction.pendingWithdrawals(alice), 0, "forfeited");
        assertEq(auction.pendingWithdrawals(seller), 2 ether, "seller receives it");
    }
}

/// @dev Re-enters through a different function: finalizes a second auction inside receive(), then
///      withdraws again. Proves cross-function re-entry can only ever collect what is legitimately owed.
contract CrossFunctionAttacker {
    Auction internal auction;
    uint256 internal targetAuction;
    bytes32 internal constant SECRET = keccak256("secret");
    uint256 public nestedWithdrawSuccesses;

    constructor(Auction _auction, uint256 _targetAuction) {
        auction = _auction;
        targetAuction = _targetAuction;
    }

    function commit(uint256 id, uint256 amount, uint256 deposit) external {
        auction.commitBid{value: deposit}(id, keccak256(abi.encode(amount, SECRET, address(this))));
    }

    function reveal(uint256 id, uint256 amount) external {
        auction.revealBid(id, amount, SECRET);
    }

    function attack() external {
        auction.withdraw();
    }

    receive() external payable {
        try auction.finalize(targetAuction) {} catch {}
        try auction.withdraw() {
            nestedWithdrawSuccesses++;
        } catch {}
    }
}

/// @dev Bids, loses, and tries to re-enter withdraw() from its receive() hook.
contract ReentrancyAttacker {
    Auction internal auction;
    bytes32 internal constant SECRET = keccak256("secret");
    uint256 public reentryAttempts;
    uint256 public reentrySuccesses;

    constructor(Auction _auction) {
        auction = _auction;
    }

    function commit(uint256 id, uint256 amount, uint256 deposit) external {
        auction.commitBid{value: deposit}(id, keccak256(abi.encode(amount, SECRET, address(this))));
    }

    function reveal(uint256 id, uint256 amount) external {
        auction.revealBid(id, amount, SECRET);
    }

    function attack() external {
        auction.withdraw();
    }

    /// @dev Called while Auction.withdraw() is mid-flight. The balance was already zeroed,
    ///      so the nested withdraw reverts with NothingToWithdraw and is swallowed here.
    receive() external payable {
        reentryAttempts++;
        try auction.withdraw() {
            reentrySuccesses++;
        } catch {}
    }
}

/// @dev Contract that bids but refuses incoming ETH, to prove withdraw reverts cleanly.
contract RejectingReceiver {
    Auction internal auction;

    constructor(Auction _auction) {
        auction = _auction;
    }

    function commit(uint256 id, bytes32 commitment, uint256 deposit) external {
        auction.commitBid{value: deposit}(id, commitment);
    }

    function reveal(uint256 id, uint256 amount, bytes32 secret) external {
        auction.revealBid(id, amount, secret);
    }

    function withdraw() external {
        auction.withdraw();
    }

    // No receive() or fallback(): any ETH sent here reverts.
}
