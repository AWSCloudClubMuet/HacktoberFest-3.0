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
