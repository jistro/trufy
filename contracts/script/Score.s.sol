// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Score} from "../src/Score.sol";

contract ScoreScript is Script {
    Score public c;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        c = new Score();

        vm.stopBroadcast();
    }
}
