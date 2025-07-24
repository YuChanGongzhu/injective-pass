// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/PokemonCardVRF.sol";

contract DeployPokemonCardVRF is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Injective EVM 测试网的 VRF 配置
        // 注意：如果Injective不支持Chainlink VRF，需要使用其他测试网如Sepolia
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        bytes32 keyHash = vm.envBytes32("VRF_KEY_HASH");
        uint32 callbackGasLimit = 500000; // 500K gas limit
        uint16 requestConfirmations = 3;

        vm.startBroadcast(deployerPrivateKey);

        // 部署PokemonCardVRF合约
        PokemonCardVRF pokemonCard = new PokemonCardVRF(
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit,
            requestConfirmations
        );

        vm.stopBroadcast();

        console.log("=== PokemonCardVRF Deployment ===");
        console.log("Contract deployed to:", address(pokemonCard));
        console.log("Owner:", pokemonCard.owner());
        console.log("Name:", pokemonCard.name());
        console.log("Symbol:", pokemonCard.symbol());
        console.log("Max Supply:", pokemonCard.maxSupply());
        console.log("Mint Price:", pokemonCard.mintPrice());

        console.log("\n=== VRF Configuration ===");
        (
            address vrfCoord,
            uint256 subId,
            bytes32 keyH,
            uint32 gasLimit,
            uint16 confirmations
        ) = pokemonCard.getVRFConfig();

        console.log("VRF Coordinator:", vrfCoord);
        console.log("Subscription ID:", subId);
        console.log("Key Hash:");
        console.logBytes32(keyH);
        console.log("Callback Gas Limit:", gasLimit);
        console.log("Request Confirmations:", confirmations);

        console.log("\n=== Next Steps ===");
        console.log(
            "1. Add this contract as a consumer to your VRF subscription"
        );
        console.log("2. Fund your VRF subscription with LINK tokens");
        console.log("3. Verify the contract on the block explorer");
    }
}

// 用于Sepolia测试网的部署脚本
contract DeployPokemonCardVRFSepolia is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Sepolia 测试网的 VRF 配置
        address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
        bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
        uint32 callbackGasLimit = 500000;
        uint16 requestConfirmations = 3;

        // 从环境变量获取订阅ID
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");

        vm.startBroadcast(deployerPrivateKey);

        // 部署PokemonCardVRF合约
        PokemonCardVRF pokemonCard = new PokemonCardVRF(
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit,
            requestConfirmations
        );

        vm.stopBroadcast();

        console.log("=== PokemonCardVRF Sepolia Deployment ===");
        console.log("Contract deployed to:", address(pokemonCard));
        console.log("Owner:", pokemonCard.owner());
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("Subscription ID:", subscriptionId);
        console.log("Key Hash:");
        console.logBytes32(keyHash);

        console.log("\n=== Manual Steps Required ===");
        console.log("1. Go to https://vrf.chain.link/");
        console.log("2. Add this contract as a consumer:");
        console.log("   Contract Address:", address(pokemonCard));
        console.log("3. Fund subscription with LINK tokens");
        console.log("4. Test the contract by calling requestDrawCard()");
    }
}
