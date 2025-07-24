// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/PokemonCard.sol";

contract DeployPokemonCard is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 部署PokemonCard合约
        PokemonCard pokemonCard = new PokemonCard();

        vm.stopBroadcast();

        console.log("PokemonCard deployed to:", address(pokemonCard));
        console.log("Owner:", pokemonCard.owner());
        console.log("Name:", pokemonCard.name());
        console.log("Symbol:", pokemonCard.symbol());
        console.log("Max Supply:", pokemonCard.maxSupply());
        console.log("Mint Price:", pokemonCard.mintPrice());
    }
}
