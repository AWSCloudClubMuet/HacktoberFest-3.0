# Problem 3: Sealed-Bid Auction House

**Team PhantomX · Solidity 0.8.20 · Foundry · 80 passing tests · 100% line and branch coverage**

Mehran University sells surplus equipment on-chain. In a normal auction everyone can see the current highest bid and simply outbid it at the last second. This contract prevents that with a **commit-reveal** design: bidders first lock in a *hash* of their bid together with an ETH deposit, and only after bidding closes do they reveal the real amount. Nobody, not even the seller, can see a bid before the reveal phase. Settlement uses **pull payments**, so the contract never pushes ETH to anyone and cannot be blocked by a misbehaving bidder.

This folder contains the contract, a complete Foundry test suite, design notes with an audit log, and a plain-HTML demo UI.

![Demo UI: headline and the three-phase tracker while a lot is in the sealing phase](docs/screenshots/crop-hero-sealing.png)

*All screenshots in this README were captured automatically by the browser end-to-end test described in section 10, against a real deployment on a local anvil chain.*

---

## 1. What was built, in one minute

Every auction (a "lot") goes through three phases decided purely by `block.timestamp`:

```
 createAuction            biddingEnd              revealEnd
      |                       |                       |
      |  1. SEALING           |  2. OPENING           |  3. SETTLEMENT
      |  commitBid()          |  revealBid()          |  finalize()  then  withdraw()
      |  hash + deposit only  |  prove amount+secret  |  credit everyone, pull funds
      |  now <  biddingEnd    |  biddingEnd <= now    |  now >= revealEnd
      |                       |       < revealEnd     |
```

| Step | Who | What happens |
|---|---|---|
| List | Seller | Sets description, reserve price, bidding deadline, reveal deadline. Each lot gets the next id. |
| Seal | Bidder | Sends `keccak256(abi.encode(amount, secret, msg.sender))` plus a deposit of at least the reserve. Only the hash is stored and logged. One commitment per address per lot. |
| Open | Bidder | Sends the real `amount` and `secret`. The contract recomputes the hash and checks the deposit covers the amount and the amount meets the reserve. Highest valid amount leads; on a tie the first to open keeps the lead. |
| Settle | Anyone | After `revealEnd`, once only. Seller is credited the winning bid plus every unopened deposit. Winner is credited deposit minus bid. Losing openers are credited their full deposit. No ETH moves. |
| Withdraw | Each party | Pulls their own credit. Balance is zeroed before the transfer, so re-entrancy gets nothing. |

**Accounting invariant:** every wei deposited into a lot is credited to exactly one party. Tests prove the sum of credits equals the sum of deposits and that the contract drains to exactly zero after withdrawals.

---

## 2. Technology

| Layer | Choice | Why |
|---|---|---|
| Language | Solidity `^0.8.20` | Checked arithmetic, custom errors |
| Toolchain | Foundry 1.8 (`forge`, `anvil`, `cast`) | Fast Solidity-native tests, fuzzing, coverage, gas reports |
| Test library | forge-std, vendored in `lib/` | Committed to the repo so a fresh clone builds with no network |
| Demo UI | Single `index.html`, vanilla JavaScript, ethers.js v6 (vendored) | No build step, works offline, talks to MetaMask |
| Local chain | anvil | Instant blocks, time travel for demos |

No OpenZeppelin or other contract dependencies. The contract is self-contained.

---

## 3. Repository layout

```
problem-3/
├── foundry.toml                  # src = task-1/contracts, test = task-1/tests, solc 0.8.20
├── README.md                     # this file
├── lib/forge-std/                # test library (committed, not a submodule)
├── task-1/
│   ├── contracts/Auction.sol     # the contract (about 360 lines, fully NatSpec'd)
│   ├── tests/Auction.t.sol       # 80 tests: unit, boundary, adversarial, fuzz, demo
│   └── NOTES.md                  # design decisions per milestone, assumptions, audit log, stretch goals
├── ui/
│   ├── index.html                # demo UI (plain HTML + inline JS)
│   └── vendor/ethers.umd.min.js  # ethers v6, vendored for offline use
└── docs/screenshots/             # images used in this README, taken by the automated browser test
```

---

## 4. Prerequisites

- **Git** and **Foundry**. Install Foundry with:
  ```
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
  On Windows run those two lines in Git Bash. Foundry installs to `~/.foundry/bin`.
- **Windows PowerShell users:** new terminals may not see Foundry yet. Put it on the PATH in each window:
  ```powershell
  $env:Path += ";$env:USERPROFILE\.foundry\bin"
  ```
- For the UI only: Google Chrome or any browser with the **MetaMask** extension.

All commands below run from inside `problem-3/`.

---

## 5. Build and test

```
forge build          # expect: Compiler run successful!  (0 warnings)
forge test           # expect: 80 tests passed, 0 failed
```

Useful variations:

| Command | Shows |
|---|---|
| `forge test -vv` | Every test name with gas, plus the demo's step-by-step log |
| `forge test --match-test test_Demo_FullFlow -vv` | A narrated end-to-end run: create, commit, reveal, rank, forfeit, finalize, withdraw |
| `forge test --match-test "test_ValidReveal\|test_RevertWhen_\|test_LosingBidder\|test_NoReveal\|test_TwoConcurrent"` | Only the seven tests the task requires |
| `forge test --match-test testFuzz -vv` | The fuzz invariant over random bids, secrets, reveal order |
| `forge coverage --report summary` | 100% lines, statements, branches, functions on `Auction.sol` |
| `forge test --gas-report` | Gas per function; `finalize` with 200 bidders is about 3.9M |

### The seven required tests

| Requirement | Test name | Result |
|---|---|---|
| Valid reveal | `test_ValidReveal` | pass |
| Wrong secret fails | `test_RevertWhen_WrongSecret` | pass |
| Reveal outside window fails (before `biddingEnd`, at and after `revealEnd`) | `test_RevertWhen_RevealOutsideWindow` | pass |
| Losing bidder withdraws refund | `test_LosingBidderCanWithdrawRefund` | pass |
| No-reveal forfeiture to seller | `test_NoRevealForfeitsDepositToSeller` | pass |
| Double finalization reverts | `test_RevertWhen_FinalizedTwice` | pass |
| Two concurrent auctions | `test_TwoConcurrentAuctionsDoNotInterfere` | pass |

### What else is tested

- Every custom error has at least one revert test. 45 revert assertions in total.
- Exact boundaries: one second before and exactly at `biddingEnd` and `revealEnd`. At each instant exactly one of commit, reveal, finalize is allowed.
- Adversarial: re-entrant `withdraw()` from a `receive()` hook, cross-function re-entry via `finalize`, plain ETH sent to the contract, copied commitment hash, seller bidding in their own lot, repeated wrong reveals until the deadline, 20 bidders, 200 bidders at the cap.
- Fuzz: random amounts, over-deposits, secrets, which bidders reveal, and reveal order. Invariants: credits equal deposits, `highestBid` equals the max valid revealed amount, winner is the earliest revealer of that max, contract drains to zero.
- A receiver that rejects ETH keeps its credit instead of losing it.

---

## 6. Contract API (`task-1/contracts/Auction.sol`)

### Functions

| Function | Access | Phase | Purpose |
|---|---|---|---|
| `createAuction(string description, uint256 reservePrice, uint256 biddingEnd, uint256 revealEnd) → uint256 id` | anyone | any | List an item. Reverts on zero reserve, past bidding deadline, or reveal deadline not after bidding deadline. |
| `commitBid(uint256 id, bytes32 commitment)` payable | anyone | `now < biddingEnd` | Lock a sealed bid. `msg.value` must be at least the reserve. One per address per lot. |
| `revealBid(uint256 id, uint256 amount, bytes32 secret)` | committer | `biddingEnd <= now < revealEnd` | Open a bid. Hash must match, deposit must cover amount, amount must meet reserve. |
| `finalize(uint256 id)` | anyone | `now >= revealEnd` | Settle once. Credits balances only. |
| `withdraw()` | anyone | any | Pull everything credited to the caller across all lots. |
| `getPhase(uint256 id) → Phase` | view | | `Bidding`, `Reveal`, `Ended`, or `Finalized`. |
| `getBidderCount(uint256 id) → uint256` | view | | Number of sealed bids. |
| `computeCommitment(uint256 amount, bytes32 secret, address bidder) → bytes32` | pure | | Helper that returns `keccak256(abi.encode(amount, secret, bidder))`. |
| `auctions(id)`, `bids(id, bidder)`, `pendingWithdrawals(addr)`, `nextAuctionId()`, `MAX_BIDDERS()` | view | | Public storage getters. |

### Events

`AuctionCreated`, `BidCommitted` (hash only, never the amount), `BidRevealed`, `DepositForfeited`, `AuctionFinalized` (winner is `address(0)` when nobody won), `Withdrawal`.

### Custom errors

No `require` strings anywhere. Nineteen named errors, for example `BiddingClosed`, `DepositTooLow(sent, required)`, `AlreadyCommitted`, `NotRevealPhase`, `InvalidReveal`, `DepositDoesNotCoverBid(deposit, amount)`, `BidBelowReserve(amount, reserve)`, `AuctionStillRunning`, `AlreadyFinalized`, `NothingToWithdraw`, `WithdrawFailed`, `TooManyBidders(max)`. The UI decodes these by name.

---

## 7. Design decisions and security properties

- **Bidder address is inside the hash.** Copying someone else's commitment is accepted at commit time but can never be opened by the copier, so it only forfeits their own deposit.
- **Deposit must be at least the reserve, and must cover the revealed amount.** Every bid that can win is backed by real ETH.
- **Strict `>` for ranking.** An equal amount never replaces the leader, so ties resolve to the earliest reveal with no extra storage.
- **`finalized = true` is the first write in `finalize`.** A second call reverts before any balance is touched.
- **Pull payments only.** `finalize` contains no ETH transfer. The single `call` in the contract is in `withdraw`, after the balance is zeroed and the event is emitted (Checks-Effects-Interactions).
- **No `receive()` or `fallback()`.** ETH can only enter through `commitBid`.
- **Phases are computed from `block.timestamp`, never stored,** except the `finalized` flag. Validators can shift a timestamp by seconds, which is immaterial against windows measured in hours or days.
- **Bid records are never deleted,** so anyone can audit who bid, who opened, and who forfeited after settlement.

---

## 8. Assumptions added beyond the task sheet, and known limitations

| Item | Decision | Reason |
|---|---|---|
| Reserve price of zero | Rejected (`InvalidReserve`) | A zero reserve makes "no bid" and "bid of zero" indistinguishable. |
| Revealed amount below reserve | Rejected (`BidBelowReserve`), retry allowed until `revealEnd` | Such a bid can never win; rejecting keeps the leader logic simple. |
| Bidder cap `MAX_BIDDERS = 200` | Added during the audit (`TooManyBidders`) | `finalize` loops over all bidders. Without a cap, enough commitments could exceed the block gas limit and lock every deposit. 200 bidders finalize in about 3.9M gas. |
| Struct named `AuctionData` | Not `Auction` | Solidity forbids a struct sharing the contract's name. Fields match the task exactly. |
| No minimum reveal window | **Not enforced**, documented as accepted audit finding A-7 | The task fixes `createAuction`'s revert rules exactly. Deadlines are public before anyone commits. Recommended hardening is one line: require `revealEnd - biddingEnd >= 1 hours`. |
| Seller bidding in their own lot | Allowed | If they win they are credited bid plus excess, so their deposit returns and losers are refunded as usual. Tested and documented. |

Full reasoning, the audit log with severities, and stretch goals are in [task-1/NOTES.md](task-1/NOTES.md).

---

## 9. Demo UI

A single page, `ui/index.html`, drives the contract through MetaMask on a local anvil chain. Plain HTML and vanilla JavaScript, no build step, ethers.js vendored so it works offline. It shows a three-step phase tracker, a live lot card, the sealed hash as you type, and an activity feed that decodes every custom error by name.

### What it looks like

**Sealing phase.** Three bids are locked. The lot card shows the count but the highest bid stays hidden, and the "Seal a bid" card shows the commitment hash computed in the browser before anything is sent.

<p align="center">
  <img src="docs/screenshots/crop-lot-sealing.png" width="46%" alt="Lot card during sealing: 3 sealed bids, highest open still hidden">
  <img src="docs/screenshots/crop-seal-card.png" width="52%" alt="Seal a bid card with the live commitment hash">
</p>

**Opening phase.** Alice has opened 2.0 ETH and leads. Bob's lower open did not displace her. Carol tried the wrong secret, and the feed shows the contract's own error name, `InvalidReveal()`, rather than a raw hex code.

<p align="center">
  <img src="docs/screenshots/crop-tracker-opening.png" width="98%" alt="Phase tracker: step 1 done, step 2 current">
</p>
<p align="center">
  <img src="docs/screenshots/crop-lot-opening.png" width="46%" alt="Lot card during opening: Alice leading at 2.0 ETH">
  <img src="docs/screenshots/crop-feed-errors.png" width="52%" alt="Activity feed decoding InvalidReveal()">
</p>

**Settled.** Anyone pressed *Settle this lot*. Carol's unopened 1.2 ETH went to the seller, Alice won at 2.0 ETH, and every party has withdrawn, leaving the contract at exactly zero.

<p align="center">
  <img src="docs/screenshots/crop-tracker-settled.png" width="98%" alt="Phase tracker: all steps done with a check mark">
</p>
<p align="center">
  <img src="docs/screenshots/crop-lot-settled.png" width="46%" alt="Lot card after settlement">
</p>

Full-page captures of each state: [sealing](docs/screenshots/01-sealed.png), [opening](docs/screenshots/02-opened.png), [settled](docs/screenshots/03-settled.png).

### Setup, once

1. **Terminal A, start the chain** and leave it running:
   ```
   anvil
   ```
   It prints ten funded test accounts and listens on `http://127.0.0.1:8545`, chain id `31337`.

2. **Terminal B, deploy the contract:**
   ```
   forge create task-1/contracts/Auction.sol:Auction --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   On a fresh anvil the address is always `0x5FbDB2315678afecb367f032d93F642f64180aa3`.

3. **MetaMask network:** network selector, then *Add a custom network*.

   | Field | Value |
   |---|---|
   | Network name | `Anvil` |
   | RPC URL | `http://127.0.0.1:8545` (use `127.0.0.1`, not `localhost`) |
   | Chain ID | `31337` |
   | Currency symbol | `ETH` |

4. **MetaMask accounts:** account selector, then *Import account*, paste a key. These are anvil's public, well-known test keys and hold no real value.

   | Role | Address | Private key |
   |---|---|---|
   | Seller | `0xf39F…2266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
   | Alice | `0x7099…79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
   | Bob | `0x3C44…93BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
   | Carol | `0x90F7…b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

5. **Open the page:** double-click `ui/index.html`. Select the Seller account, click **Connect wallet**, paste the contract address, click **Load**.

### Demo flow

Switching accounts in MetaMask reloads the page. After each switch click **Connect wallet** then **Load**; the address is remembered.

1. **Seller lists** the Dell OptiPlex with reserve `1` ETH. Use **60-minute** sealing and opening windows, not 10. The clock is real chain time and wallet switching takes a while. Move between phases with the **Time machine** set to `3600` seconds instead of waiting.
2. **Seal** as Alice (`2` ETH bid, `2.5` deposit, secret `alice-secret`), Bob (`1.5`, `1.5`, `bob-secret`), Carol (`1.2`, `1.2`, `carol-secret`). Watch the hash preview and the bid count. Sealing twice shows `AlreadyCommitted()`.
3. **Jump ahead** 3600 s. Phase becomes Opening.
4. **Open** as Alice and Bob with *Use saved secret*. Alice leads at 2.0 ETH; Bob's lower open does not displace her. Have Carol try `wrong-secret` to see `InvalidReveal()`, then leave her unopened.
5. **Jump ahead** 3600 s. Anyone clicks **Settle this lot**. The feed logs Carol's 1.2 ETH forfeited to the seller and Alice winning at 2.0 ETH.
6. **Withdraw** per account: Seller 3.2 ETH, Alice 0.5 ETH, Bob 1.5 ETH, Carol nothing. The contract then holds exactly 0 ETH.

**Only two accounts?** The seller may bid in their own lot, so Seller can play the losing bidder while Alice wins. An unopened bid on an earlier lot doubles as the forfeiture demo.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `forge` / `anvil` not recognised | Run the PATH line from section 4 in that terminal, or open a new one. |
| `BiddingClosed()` when sealing | The window elapsed in real time. List a new lot with 60-minute windows. |
| MetaMask nonce error or stuck transaction | Settings, Advanced, *Clear activity tab data* for that account. Happens after an anvil restart. |
| "No contract at that address" | Anvil was restarted. Redeploy and paste the new address. |
| *Use saved secret* finds nothing | Secrets are stored per browser, per contract, per account. Type the phrase by hand. |

---

## 10. How this was verified

- `forge build` with zero compiler or lint warnings; `forge test` 80/80; `forge coverage` 100% lines, statements, branches and functions on `Auction.sol`.
- A fresh clone of the branch builds and passes all tests with no network access, proving `lib/` and every file are committed.
- The UI was driven end to end in real headless Chrome through the DevTools Protocol against a deployed contract: 53 automated checks covering connect, list, three seals, decoded errors, phase jumps, opens, wrong secret, settlement by a non-seller, forfeiture, withdrawals, zero final balance, and two concurrent lots staying independent. The screenshots in this README are that run's output.
- An audit pass reviewed re-entrancy, accounting, tie-break, boundaries, loop gas, events, NatSpec and fund-loss paths. Findings and fixes are tabled in `task-1/NOTES.md`.

---

## 11. Team and contribution

Team PhantomX. Problem 3 (Sealed-Bid Auction House, task-1) was designed, implemented, tested, audited and documented by **Ahmed Mustafa** (GitHub: [ahmedmustafa28](https://github.com/ahmedmustafa28)).

## 12. Tasks

Ahmed Mustafa: all five milestones (auction creation, commitments, reveal and ranking, finalize and withdraw, events/errors/tests), the audit pass, the demo UI, README and NOTES, and the live demo.

## 13. References and attribution

- Solidity documentation: commit-reveal pattern, custom errors, Checks-Effects-Interactions.
- Foundry Book: `forge test`, cheatcodes, fuzzing, coverage.
- forge-std (foundry-rs/forge-std, MIT / Apache-2.0), vendored in `lib/` with its license files.
- ethers.js v6 (MIT), vendored in `ui/vendor/` for the demo page.
- Course notes on smart-contract security patterns.
- **AI usage:** Claude Code (Anthropic) was used to help draft the contract, tests, notes, audit and UI. I reviewed, ran and can explain all of it.
- No code was copied from other teams.

## 14. Demo plan

Ahmed walks through the milestones in order using the UI, then shows the narrated contract-level run:

```
forge test --match-test test_Demo_FullFlow -vv
```
