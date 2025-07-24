// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/PokemonCardVRF.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract PokemonCardVRFTest is Test {
    PokemonCardVRF public pokemonCard;
    VRFCoordinatorV2_5Mock public vrfCoordinator;

    address public owner = address(0x123);
    address public user1 = address(0x456);
    address public user2 = address(0x789);

    // VRF配置
    uint256 public subscriptionId;
    bytes32 public keyHash =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 public callbackGasLimit = 300000;
    uint16 public requestConfirmations = 3;

    // Mock VRF配置
    uint96 public baseFee = 0.25 ether;
    uint96 public gasPriceLink = 1e9;
    int256 public weiPerUnitLink = 4e15;

    function setUp() public {
        // 部署VRF Coordinator Mock
        vrfCoordinator = new VRFCoordinatorV2_5Mock(
            baseFee,
            gasPriceLink,
            weiPerUnitLink
        );

        // 创建订阅
        subscriptionId = vrfCoordinator.createSubscription();

        // 部署PokemonCard合约
        vm.startPrank(owner);
        pokemonCard = new PokemonCardVRF(
            address(vrfCoordinator),
            subscriptionId,
            keyHash,
            callbackGasLimit,
            requestConfirmations
        );
        vm.stopPrank();

        // 添加消费者到订阅
        vrfCoordinator.addConsumer(subscriptionId, address(pokemonCard));

        // 为订阅充值
        vrfCoordinator.fundSubscription(subscriptionId, 100 ether);

        // 给测试用户一些ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function test_BasicInfo() public {
        assertEq(pokemonCard.name(), "Pokemon Cards VRF");
        assertEq(pokemonCard.symbol(), "PKMN-VRF");
        assertEq(pokemonCard.owner(), owner);
        assertEq(pokemonCard.totalSupply(), 0);
        assertEq(pokemonCard.maxSupply(), 10000);
        assertEq(pokemonCard.mintPrice(), 0.01 ether);
    }

    function test_VRFConfig() public {
        (
            address vrfCoord,
            uint256 subId,
            bytes32 keyH,
            uint32 gasLimit,
            uint16 confirmations
        ) = pokemonCard.getVRFConfig();

        assertEq(vrfCoord, address(vrfCoordinator));
        assertEq(subId, subscriptionId);
        assertEq(keyH, keyHash);
        assertEq(gasLimit, callbackGasLimit);
        assertEq(confirmations, requestConfirmations);
    }

    function test_RequestDrawCard() public {
        vm.startPrank(user1);

        // 测试支付不足
        vm.expectRevert("Insufficient payment");
        pokemonCard.requestDrawCard{value: 0.005 ether}();

        // 正常请求抽卡
        uint256 requestId = pokemonCard.requestDrawCard{value: 0.01 ether}();

        // 验证请求被记录
        PokemonCardVRF.DrawRequest memory request = pokemonCard.getDrawRequest(
            requestId
        );
        assertEq(request.requester, user1);
        assertEq(request.numCards, 1);
        assertFalse(request.fulfilled);

        // 验证用户待处理请求
        uint256[] memory pendingRequests = pokemonCard.getUserPendingRequests(
            user1
        );
        assertEq(pendingRequests.length, 1);
        assertEq(pendingRequests[0], requestId);

        vm.stopPrank();
    }

    function test_RequestDrawMultipleCards() public {
        vm.startPrank(user1);

        // 测试无效数量
        vm.expectRevert("Invalid number of cards");
        pokemonCard.requestDrawMultipleCards{value: 0.05 ether}(0);

        vm.expectRevert("Invalid number of cards");
        pokemonCard.requestDrawMultipleCards{value: 0.15 ether}(15);

        // 测试支付不足
        vm.expectRevert("Insufficient payment");
        pokemonCard.requestDrawMultipleCards{value: 0.02 ether}(5);

        // 正常批量抽卡
        uint256 requestId = pokemonCard.requestDrawMultipleCards{
            value: 0.05 ether
        }(5);

        // 验证请求
        PokemonCardVRF.DrawRequest memory request = pokemonCard.getDrawRequest(
            requestId
        );
        assertEq(request.requester, user1);
        assertEq(request.numCards, 5);
        assertFalse(request.fulfilled);

        vm.stopPrank();
    }

    function test_FulfillRandomWords() public {
        vm.startPrank(user1);

        // 请求单张卡片
        uint256 requestId = pokemonCard.requestDrawCard{value: 0.01 ether}();

        vm.stopPrank();

        // 模拟VRF回调
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345678901234567890; // 模拟随机数

        vrfCoordinator.fulfillRandomWords(requestId, randomWords);

        // 验证NFT被铸造
        assertEq(pokemonCard.totalSupply(), 1);
        assertEq(pokemonCard.ownerOf(1), user1);

        // 验证卡片属性
        PokemonCardVRF.Card memory card = pokemonCard.getCard(1);
        assertTrue(card.rarity >= 1 && card.rarity <= 4);
        assertTrue(card.element >= 1 && card.element <= 5);
        assertTrue(card.attack >= 50);
        assertTrue(card.defense >= 30);
        assertTrue(card.speed >= 20);
        assertTrue(bytes(card.name).length > 0);
        assertTrue(card.revealed);

        // 验证请求已完成
        PokemonCardVRF.DrawRequest memory request = pokemonCard.getDrawRequest(
            requestId
        );
        assertTrue(request.fulfilled);
        assertEq(request.tokenIds.length, 1);
        assertEq(request.tokenIds[0], 1);

        // 验证用户待处理请求已清空
        uint256[] memory pendingRequests = pokemonCard.getUserPendingRequests(
            user1
        );
        assertEq(pendingRequests.length, 0);
    }

    function test_FulfillMultipleCards() public {
        vm.startPrank(user1);

        // 请求多张卡片
        uint256 requestId = pokemonCard.requestDrawMultipleCards{
            value: 0.03 ether
        }(3);

        vm.stopPrank();

        // 模拟VRF回调，提供3个随机数
        uint256[] memory randomWords = new uint256[](3);
        randomWords[0] = 12345678901234567890;
        randomWords[1] = 98765432109876543210;
        randomWords[2] = 55555555555555555555;

        vrfCoordinator.fulfillRandomWords(requestId, randomWords);

        // 验证NFT被铸造
        assertEq(pokemonCard.totalSupply(), 3);
        assertEq(pokemonCard.ownerOf(1), user1);
        assertEq(pokemonCard.ownerOf(2), user1);
        assertEq(pokemonCard.ownerOf(3), user1);

        // 验证请求已完成
        PokemonCardVRF.DrawRequest memory request = pokemonCard.getDrawRequest(
            requestId
        );
        assertTrue(request.fulfilled);
        assertEq(request.tokenIds.length, 3);
    }

    function test_RandomnessDistribution() public {
        // 模拟多个不同的随机数来测试属性分布
        vm.startPrank(user1);

        // 请求多张卡片
        for (uint i = 0; i < 5; i++) {
            uint256 requestId = pokemonCard.requestDrawCard{
                value: 0.01 ether
            }();

            // 使用不同的随机数
            uint256[] memory randomWords = new uint256[](1);
            randomWords[0] = uint256(keccak256(abi.encodePacked("random", i)));

            vrfCoordinator.fulfillRandomWords(requestId, randomWords);
        }

        vm.stopPrank();

        // 验证每张卡片都有不同的特征
        bool hasVariation = false;
        PokemonCardVRF.Card memory firstCard = pokemonCard.getCard(1);

        for (uint256 i = 2; i <= 5; i++) {
            PokemonCardVRF.Card memory card = pokemonCard.getCard(i);
            if (
                card.rarity != firstCard.rarity ||
                card.element != firstCard.element ||
                card.attack != firstCard.attack
            ) {
                hasVariation = true;
                break;
            }
        }

        assertTrue(hasVariation);
    }

    function test_ElementNames() public {
        assertEq(pokemonCard.getElementName(1), "Fire");
        assertEq(pokemonCard.getElementName(2), "Water");
        assertEq(pokemonCard.getElementName(3), "Grass");
        assertEq(pokemonCard.getElementName(4), "Electric");
        assertEq(pokemonCard.getElementName(5), "Psychic");
        assertEq(pokemonCard.getElementName(6), "Unknown");
    }

    function test_RarityNames() public {
        assertEq(pokemonCard.getRarityName(1), "Common");
        assertEq(pokemonCard.getRarityName(2), "Rare");
        assertEq(pokemonCard.getRarityName(3), "Epic");
        assertEq(pokemonCard.getRarityName(4), "Legendary");
        assertEq(pokemonCard.getRarityName(5), "Unknown");
    }

    function test_CardPowerCalculation() public {
        vm.startPrank(user1);

        uint256 requestId = pokemonCard.requestDrawCard{value: 0.01 ether}();

        vm.stopPrank();

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345678901234567890;

        vrfCoordinator.fulfillRandomWords(requestId, randomWords);

        PokemonCardVRF.Card memory card = pokemonCard.getCard(1);
        uint256 expectedPower = uint256(card.attack) +
            uint256(card.defense) +
            uint256(card.speed);
        uint256 actualPower = pokemonCard.getCardPower(1);

        assertEq(actualPower, expectedPower);
    }

    function test_TokenURI() public {
        vm.startPrank(user1);

        uint256 requestId = pokemonCard.requestDrawCard{value: 0.01 ether}();

        vm.stopPrank();

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345678901234567890;

        vrfCoordinator.fulfillRandomWords(requestId, randomWords);

        string memory uri = pokemonCard.tokenURI(1);
        assertTrue(bytes(uri).length > 0);
    }

    function test_OwnerFunctions() public {
        // 测试非所有者无法调用管理员功能
        vm.startPrank(user1);

        vm.expectRevert();
        pokemonCard.setMintPrice(0.02 ether);

        vm.expectRevert();
        pokemonCard.setMaxSupply(5000);

        vm.expectRevert();
        pokemonCard.withdraw();

        vm.stopPrank();

        // 测试所有者可以调用管理员功能
        vm.startPrank(owner);

        pokemonCard.setMintPrice(0.02 ether);
        assertEq(pokemonCard.mintPrice(), 0.02 ether);

        pokemonCard.setMaxSupply(5000);
        assertEq(pokemonCard.maxSupply(), 5000);

        vm.stopPrank();
    }

    function test_WithdrawFunds() public {
        // 用户抽卡
        vm.startPrank(user1);
        pokemonCard.requestDrawCard{value: 0.01 ether}();
        vm.stopPrank();

        vm.startPrank(user2);
        pokemonCard.requestDrawCard{value: 0.01 ether}();
        vm.stopPrank();

        // 检查合约余额
        assertEq(address(pokemonCard).balance, 0.02 ether);

        // 所有者提取资金
        vm.startPrank(owner);
        uint256 balanceBefore = owner.balance;
        pokemonCard.withdraw();
        assertEq(owner.balance, balanceBefore + 0.02 ether);
        assertEq(address(pokemonCard).balance, 0);
        vm.stopPrank();
    }

    function test_MaxSupplyLimit() public {
        // 设置较小的最大供应量
        vm.startPrank(owner);
        pokemonCard.setMaxSupply(2);
        vm.stopPrank();

        vm.startPrank(user1);

        // 请求第一张卡片
        uint256 requestId1 = pokemonCard.requestDrawCard{value: 0.01 ether}();

        // 请求第二张卡片
        uint256 requestId2 = pokemonCard.requestDrawCard{value: 0.01 ether}();

        // 第三张应该失败
        vm.expectRevert("Exceeds max supply");
        pokemonCard.requestDrawMultipleCards{value: 0.02 ether}(2);

        vm.stopPrank();

        // 完成前两个请求
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345;

        vrfCoordinator.fulfillRandomWords(requestId1, randomWords);
        vrfCoordinator.fulfillRandomWords(requestId2, randomWords);

        assertEq(pokemonCard.totalSupply(), 2);
    }

    function test_EmergencyCancelRequest() public {
        vm.startPrank(user1);
        uint256 requestId = pokemonCard.requestDrawCard{value: 0.01 ether}();
        vm.stopPrank();

        // 验证用户有待处理请求
        uint256[] memory pendingBefore = pokemonCard.getUserPendingRequests(
            user1
        );
        assertEq(pendingBefore.length, 1);

        // 所有者取消请求
        vm.startPrank(owner);
        uint256 balanceBefore = user1.balance;
        pokemonCard.emergencyCancelRequest(requestId);

        // 验证用户收到退款
        assertEq(user1.balance, balanceBefore + 0.01 ether);

        // 验证请求被清理
        uint256[] memory pendingAfter = pokemonCard.getUserPendingRequests(
            user1
        );
        assertEq(pendingAfter.length, 0);

        vm.stopPrank();
    }

    function test_CannotFulfillNonexistentRequest() public {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345;

        // 尝试完成不存在的请求应该失败
        vm.expectRevert("Request not found");
        vrfCoordinator.fulfillRandomWords(999, randomWords);
    }
}
