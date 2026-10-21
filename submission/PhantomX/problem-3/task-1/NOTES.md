# Task 1 Notes: Sealed-Bid Auction

Design notes, decisions and line-by-line explanations for the demo go here.

## Phases

| Phase    | Condition                                   |
| -------- | ------------------------------------------- |
| Bidding  | `block.timestamp < biddingEnd`              |
| Reveal   | `biddingEnd <= block.timestamp < revealEnd` |
| Finalize | `block.timestamp >= revealEnd`              |

## Rules we follow

- Commitment is exactly `keccak256(abi.encode(amount, secret, msg.sender))`.
- Pull payments only. No ETH is sent inside `finalize` or inside any loop.
- Every wei deposited is credited to exactly one party: seller, winner, or a losing bidder.

## Milestone 1: auction creation, phases, commitment

### Assumptions and decisions

- **Our assumption (not in the task script): reserve price must be greater than zero.** A zero reserve would break winner detection:
  `highestBid` starts at 0, so a reserve of 0 could not tell "nobody bid" apart from
  "someone bid zero", and a zero-value bid can never deposit funds anyway. `createAuction`
  reverts with `InvalidReserve` when `reservePrice == 0`.
- **The struct is called `AuctionData`, not `Auction`.** Solidity does not allow a struct to
  share its name with the enclosing contract (`Auction`), so the data struct is `AuctionData`.
  Fields are exactly: seller, description, reservePrice, biddingEnd, revealEnd, highestBid,
  highestBidder, finalized.
- **Existence check.** An auction exists when `auctions[id].seller != address(0)`. Every
  created auction has `msg.sender` as seller, which can never be the zero address, so this
  one field is enough. The `auctionExists` modifier wraps every function that takes an id.
- **Phase is computed, not stored.** `getPhase` reads `block.timestamp` each call. Only the
  `finalized` flag is stored, because it is the one transition time cannot tell us.
- **Deadline checks are strict.** `biddingEnd` must be `> block.timestamp` and `revealEnd`
  must be `> biddingEnd`, so each phase lasts at least one second and there is no gap or overlap.
- **Commitment binds the bidder.** `computeCommitment` hashes `(amount, secret, msg.sender)`
  so one bidder cannot reuse another bidder's commitment hash.

## Milestone 2: sealed commitments

- **Deposit must be at least the reserve.** `commitBid` rejects `msg.value < reservePrice`. This
  guarantees that any bid that can win is backed by real ETH, without revealing the bid size.
  A bidder may deposit more than their bid to hide its exact value; the excess comes back to them.
- **One commitment per address per auction.** A second `commitBid` reverts `AlreadyCommitted`
  and the first deposit is untouched. Changing a bid would leak information and complicate refunds.
- **`bidders` list is private.** It only exists so finalize can loop over every bidder and
  credit refunds. Reading it is not part of the public interface; `getBidderCount` exposes the size.
- **`BidCommitted` never logs the amount.** Only the hash goes on-chain until reveal.

## Milestone 3: reveals and ranking

- **Reveal window is `biddingEnd <= now < revealEnd`.** Both edges are tested: a reveal exactly
  at `biddingEnd` works, a reveal exactly at `revealEnd` reverts. This matches the phase table.
- **Order of checks** inside `revealBid`: phase, has a commitment, not already revealed, hash
  matches, deposit covers amount, amount meets reserve. All checks run before any storage write
  and the function makes no external calls, so a failed reveal changes nothing.
- **Hash recomputation uses `msg.sender`.** A bidder who copies someone else's commitment hash
  can never open it, because their own address is hashed in. Tested explicitly.
- **Deposit must cover the revealed amount** (`DepositDoesNotCoverBid`). Otherwise a bidder could
  commit to a huge amount, win, and never actually pay it.
- **Our assumption (not in the task script): revealed amount must be at least the reserve** (`BidBelowReserve`). A bid under
  the reserve could never win, so we reject the reveal rather than record a useless bid. The
  bidder can retry with the correct values until `revealEnd`. If they never reveal successfully
  they are treated like any other non-revealer at finalize.
- **Failed reveals are retryable.** Because every failure reverts, the `revealed` flag stays
  false and the bidder can call again with the right amount and secret inside the window.
- **Ranking uses strict `>`.** An equal amount never replaces the current leader, so on a tie
  the earliest successful reveal wins. This is deterministic and cheap: no tie-break storage.

## Milestone 4: finalize and withdraw

- **`finalized = true` is written first.** It is the very first storage write in `finalize`,
  before any balance changes, so a second call reverts `AlreadyFinalized` no matter what.
- **No ETH moves in `finalize`.** The loop only adds to `pendingWithdrawals`. This is the pull
  payment pattern: a bidder with a broken or malicious `receive()` cannot block settlement for
  everyone else, and there is no external call inside the loop to re-enter.
- **Every wei is credited to exactly one party.** For each bidder the deposit goes to one bucket:
  the winner gets `deposit - winningBid`, a losing revealer gets `deposit`, a non-revealer's
  deposit is added to a local `forfeited` total. After the loop the seller is credited
  `winningBid + forfeited`. Summing all credits therefore equals the sum of deposits. A test
  asserts this and a second test drains the contract to exactly zero.
- **No reveals means no winner.** `highestBidder` stays `address(0)` and `highestBid` stays 0,
  so the seller is credited only the forfeited deposits, which in that case is every deposit.
  `AuctionFinalized` is emitted with `address(0)` and 0.
- **Anyone may call `finalize`.** The outcome is fully determined by stored data and the clock,
  so there is no reason to restrict the caller. This also means the seller cannot stall refunds.
- **Bid records are never zeroed.** Commitments, deposits and the `revealed` flag stay readable
  after settlement so anyone can audit who bid, who revealed and who forfeited.
- **Credits accumulate across auctions.** `pendingWithdrawals` is keyed by address only, so a
  seller or bidder active in several auctions withdraws everything in one call.
- **`withdraw` follows Checks-Effects-Interactions.** Read the balance, revert if zero, set it
  to zero, then `call` out, then emit. If the `call` fails the whole transaction reverts, which
  restores the balance, so a receiver that rejects ETH keeps its credit and can fix itself later.
- **Why `call` and not `transfer`.** `transfer` forwards only 2300 gas and breaks for smart
  contract wallets. `call` forwards all gas, which is safe here because the balance was already
  zeroed and re-entry finds nothing to take.

## Milestone 5: required tests, adversarial tests, demo

### The 7 required tests (exact names in `Auction.t.sol`)

| Name                                      | What it proves                                                       |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `test_ValidReveal`                        | Correct amount + secret opens the bid and makes the caller leader    |
| `test_RevertWhen_WrongSecret`             | Wrong secret reverts `InvalidReveal`, nothing stored                 |
| `test_RevertWhen_RevealOutsideWindow`     | Reverts before `biddingEnd`, at `revealEnd`, and after it            |
| `test_LosingBidderCanWithdrawRefund`      | Loser is credited the full deposit and receives exactly that ETH     |
| `test_NoRevealForfeitsDepositToSeller`    | Non-revealer's deposit is credited to the seller, event emitted      |
| `test_RevertWhen_FinalizedTwice`          | Second `finalize` reverts `AlreadyFinalized`                         |
| `test_TwoConcurrentAuctionsDoNotInterfere`| Two auctions with different sellers, bidders, reserves and deadlines, interleaved end to end, settle independently |

### Documented behaviour: seller bidding in their own auction

Nothing in the contract stops the seller from committing a bid. We chose not to block it:

- If the seller **wins**, `finalize` credits them the winning bid (as seller) and
  `deposit - winningBid` (as winner). Net effect: their whole deposit comes back and the item is
  unsold. Other bidders are refunded exactly as in any other auction, so nobody loses money.
- If the seller **loses**, they are refunded like any loser and still receive the real winner's bid.
- The only thing a seller gains is the ability to push the price up to their own bid, which is the
  same as setting a higher reserve. Because bids are sealed they cannot react to others' amounts.

`test_Adversarial_SellerBiddingInOwnAuction` pins this behaviour down.

### Adversarial tests

- **Re-entrancy.** `ReentrancyAttacker` loses an auction, then calls `withdraw()`; its `receive()`
  tries to call `withdraw()` again inside a `try/catch`. Because the balance is zeroed before the
  ETH call, the nested call reverts `NothingToWithdraw`. The attacker gets exactly one refund and
  the seller's ETH stays in the contract.
- **Plain ETH is rejected.** The contract has no `receive()` or `fallback()`, so a bare transfer or
  an unknown selector reverts. All ETH must come in through `commitBid`.
- **Copied commitment.** Copying another bidder's hash is accepted at commit time (the contract
  cannot know), but it can never be revealed by the copier because their own address is hashed
  in. The copier ends up as a non-revealer and forfeits.
- **Wrong reveals until the deadline.** Repeated failed reveals change nothing; at `revealEnd`
  the bidder is treated as a non-revealer and their deposit goes to the seller.
- **Twenty bidders.** Mixed over-deposits and non-revealers; winner, seller credit, bucket sums
  and the drain-to-zero are all asserted.
- **Fuzz** (`testFuzz_AccountingAndWinner`). Random amounts, excess deposits, secrets, which
  bidders reveal, and reveal order. Invariants: total credited == total deposited, `highestBid`
  == max of the valid revealed amounts, winner == earliest revealer of that max, and the contract
  drains to zero after withdrawals.

### Demo

`test_Demo_FullFlow` walks create -> commit -> reveal -> rank -> forfeit -> finalize -> withdraw
with a `console.log` line per step. Run it on its own with:

```
forge test --match-test test_Demo_FullFlow -vv
```

## Assumption added during the audit: bidder cap

`MAX_BIDDERS = 200`. `commitBid` reverts `TooManyBidders(200)` once an auction already has 200
commitments. This is not in the task script. It exists because `finalize` must loop over every
bidder in one transaction; without a cap, enough commitments could make that loop exceed the block
gas limit, after which nobody could settle or withdraw. 200 is far above any realistic surplus
sale and finalizes in about 3.9M gas (measured in `test_Audit_FinalizeAtBidderCapFitsInOneBlock`).

## Audit log

Scope: `Auction.sol` reviewed for re-entrancy, ETH accounting, tie-break, boundary timestamps,
loop gas, events/NatSpec/existence checks, unexpected fund loss, and compiler warnings.
`forge build` produced zero solc warnings; the eight remaining messages were Foundry lint hints.

| #   | Severity | Finding | Fix | Test |
| --- | -------- | ------- | --- | ---- |
| A-1 | Low | `withdraw` emitted `Withdrawal` after the external call. A re-entering receiver could interleave or reorder logs that indexers rely on (forge lint `reentrancy-events`). | Emit before the `call`. The balance is already zeroed, and if the call fails the revert discards the log. | `test_Audit_WithdrawalEventEmittedOnceUnderReentrancy` |
| A-2 | Info | Cross-function re-entry: a receiver could call `finalize` on another auction and then `withdraw` again inside the callback. | No change needed. Every credit is additive and zeroed before payout, so the callee can only collect what it is genuinely owed. | `test_Audit_CrossFunctionReentrancyCannotDrain` |
| A-3 | Medium | `finalize` loops over every bidder. With no cap, enough commitments could push `finalize` past the block gas limit, and then nobody could ever settle or withdraw. | Added `MAX_BIDDERS = 200` and `TooManyBidders` in `commitBid`. Measured: 200 bidders finalize in well under 15M gas. | `test_Audit_BidderCapRevertsNextCommit`, `test_Audit_FinalizeAtBidderCapFitsInOneBlock` |
| A-4 | Info | Boundary timestamps. Verified `commit < biddingEnd`, `biddingEnd <= reveal < revealEnd`, `finalize >= revealEnd` are gap-free and non-overlapping. | No change. | `test_Audit_ExactlyOneActionOpenAtEachBoundary` |
| A-5 | Info | Tie-break. Strict `>` means the earliest reveal of the top amount wins; a later equal amount never replaces it. Note: "earliest" is transaction order, so a tied bidder watching the mempool could try to get in first. Accepted as the specified rule. | No change. | `test_Audit_ThreeWayTieThenStrictlyHigherBid` |
| A-6 | Info | ETH accounting. Checked for stuck funds and double credits across auctions and partial withdrawals. Invariant: contract balance == sum of all credits + deposits of unfinalized auctions. No path strands ETH. | No change. | `test_Audit_ContractBalanceEqualsCreditsPlusOpenDeposits` |
| A-7 | Medium (accepted) | No minimum reveal duration. A seller can set `revealEnd = biddingEnd + 1`, which may contain zero blocks, so every bidder forfeits. | **Not changed in code**: the brief fixes `createAuction`'s revert conditions exactly, so adding a minimum would change required behaviour. Mitigation: deadlines are public in the event and the struct before anyone commits, so bidders must check them. Recommended hardening for production: `revert InvalidRevealDeadline` unless `revealEnd - biddingEnd >= 1 hours`. | `test_Audit_ShortRevealWindowIsVisibleBeforeCommit` |
| A-8 | Info | Lint `block-timestamp` on every phase comparison. Timestamp-based phases are the design; validators can shift a timestamp by seconds, which is harmless against hour-or-day windows. | Marked each comparison as an accepted lint with a file-level explanation. `forge build` is now warning-free. | existing boundary tests |
| A-9 | Info | Events, NatSpec, existence checks: every state change emits, every public/external function and state variable has NatSpec, every id-taking function uses `auctionExists`. | No change. | whole suite |

### Other reviewed paths where a user can lose funds (by design, all documented above)

- Committing an amount larger than the deposit, or below the reserve, makes the reveal impossible and the deposit forfeits. The bidder controls both values.
- Never revealing, or revealing wrongly until the deadline, forfeits.
- A copied commitment can never be revealed by the copier and forfeits.
- A receiver that rejects ETH keeps its credit; nothing is lost, it just cannot be pulled until the receiver is fixed.
- ETH forced in via `selfdestruct` would sit in the contract with no owner. It is not credited to anyone and cannot break settlement, because settlement is driven by stored deposits, not by `address(this).balance`.

## Stretch goals

Considered but not built, in rough priority order:

1. **Minimum reveal window** (audit finding A-7): reject `createAuction` unless
   `revealEnd - biddingEnd >= 1 hours`, so a seller cannot create a window too short to reveal in.
2. **Lazy per-bidder refunds** instead of the `MAX_BIDDERS` cap: `finalize` would only credit the
   seller and record the winner; each bidder would then claim their own refund or excess in a
   separate call. That removes the loop entirely and lifts the bidder cap.
3. **Seller cancel before the first commit**: let the seller withdraw a listing while
   `getBidderCount(id) == 0`, with an `AuctionCancelled` event.
4. **ERC-721 item escrow**: hold the item token in the contract at creation and transfer it to the
   winner in `finalize`, so payment and delivery settle together.
5. **`getBidders(auctionId)` view**: expose the private bidder list for off-chain auditing without
   having to replay `BidCommitted` events.
6. **Front-end**: a small web page that builds the commitment hash locally, stores the secret in the
   browser, and shows the current phase and countdown.
