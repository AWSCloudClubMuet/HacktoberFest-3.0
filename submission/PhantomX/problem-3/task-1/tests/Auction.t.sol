// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Auction} from "../contracts/Auction.sol";

/// @title Auction tests
/// @notice Foundry tests for the sealed-bid auction contract.
contract AuctionTest is Test {
    Auction internal auction;

    function setUp() public {
        auction = new Auction();
    }

    /// @notice Smoke test: the scaffold compiles and the contract deploys.
    function test_Deploys() public view {
        assertTrue(address(auction) != address(0));
    }
}
