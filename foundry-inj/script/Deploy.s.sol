// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/NFCWalletRegistry.sol";
import "../src/INJDomainNFT.sol";
import "../src/CatNFT.sol";

contract DeployContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy NFCWalletRegistry first (no dependencies)
        NFCWalletRegistry nfcRegistry = new NFCWalletRegistry();
        console.log("NFCWalletRegistry deployed at:", address(nfcRegistry));

        // 2. Deploy INJDomainNFT (no constructor parameters)
        INJDomainNFT domainNFT = new INJDomainNFT();
        console.log("INJDomainNFT deployed at:", address(domainNFT));

        // 3. Deploy CatNFT (no constructor parameters)
        CatNFT catNFT = new CatNFT();
        console.log("CatNFT deployed at:", address(catNFT));

        console.log("=== Deployment Summary ===");
        console.log("NFCWalletRegistry:", address(nfcRegistry));
        console.log("INJDomainNFT:", address(domainNFT));
        console.log("CatNFT:", address(catNFT));

        vm.stopBroadcast();
    }
}
