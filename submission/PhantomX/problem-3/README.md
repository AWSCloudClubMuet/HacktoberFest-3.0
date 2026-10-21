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
