# Problem 3: Sealed-Bid Auction House

Mehran University sells surplus equipment on-chain. Buyers commit a hidden hash of their bid first and reveal the real amount later, so nobody can watch other bids and outbid them.

## Layout

```
problem-3/
  foundry.toml
  lib/forge-std/            # test library, committed to the repo
  task-1/contracts/Auction.sol
  task-1/tests/Auction.t.sol
  task-1/NOTES.md
```

## Run

All commands run from inside `problem-3/`.

```
forge build
forge test
```

## Status

Complete: create, commit, reveal, finalize and withdraw are implemented, audited and tested. See task-1/NOTES.md for design decisions and the audit log.

## Assumptions added beyond the task script

- **Reserve price must be greater than zero** (`InvalidReserve`). A zero reserve would make "no bid" and "bid of zero" indistinguishable.
- **A revealed amount below the reserve is rejected** (`BidBelowReserve`), so the bidder can retry until `revealEnd`.
- **At most `MAX_BIDDERS = 200` bidders per auction** (`TooManyBidders`). Added during the audit so the `finalize` loop can never exceed the block gas limit and lock deposits. 200 bidders finalize in about 3.9M gas.
- **No minimum reveal window is enforced.** The task script fixes `createAuction`'s checks exactly, so this is documented as accepted finding A-7 in `task-1/NOTES.md` with the recommended hardening.

## Team and contribution

Team PhantomX. Problem 3 (Sealed-Bid Auction House, task-1) was designed, implemented, tested, audited and documented by Ahmed Mustafa (GitHub: ahmedmustafa28).

## Tasks

Ahmed Mustafa: all five milestones (auction creation, commitments, reveal and ranking, finalize and withdraw, events/errors/tests), the audit pass, README and NOTES, and the live demo.

## Design decisions

- **Commit-reveal with the bidder in the hash.** A commitment is exactly `keccak256(abi.encode(amount, secret, msg.sender))`, so nobody can learn a bid before reveal and nobody can reuse another bidder's hash.
- **Pull payments only.** `finalize` never sends ETH; it only credits `pendingWithdrawals`. Each party calls `withdraw()`, which zeroes the balance before the external call (Checks-Effects-Interactions).
- **Strict `>` for ranking.** An equal amount never replaces the current leader, so ties go to the earliest successful reveal.
- **Strict `block.timestamp` phases.** Commit while `now < biddingEnd`, reveal while `biddingEnd <= now < revealEnd`, finalize once `now >= revealEnd`. No gap, no overlap, and `getPhase` reports the same boundaries.
- **One commitment per bidder per auction.** A second `commitBid` reverts and the first deposit is untouched.
- **`MAX_BIDDERS = 200`.** Caps the `finalize` loop so it can never exceed the block gas limit and strand deposits.
- **Struct named `AuctionData`.** Solidity does not allow a struct to share the contract's name; the fields match the task exactly.

Full reasoning, per-milestone assumptions and the audit log are in [task-1/NOTES.md](task-1/NOTES.md).

## References and attribution

- Solidity documentation (commit-reveal pattern, custom errors, Checks-Effects-Interactions).
- Foundry Book (forge test, cheatcodes, fuzzing, coverage).
- forge-std (foundry-rs/forge-std, MIT / Apache-2.0), vendored in `lib/` with its license files.
- Course notes on smart-contract security patterns.
- AI usage: Claude Code (Anthropic) was used to help draft the contract, tests, notes and audit. I reviewed, ran and can explain all of it.
- No code was copied from other teams.

## Demo plan

Ahmed walks through the milestones in order (create, commit, reveal and rank, finalize and forfeit, withdraw), then runs:

```
forge test --match-test test_Demo_FullFlow -vv
```
