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

Scaffold only. Contract and tests are being built.
