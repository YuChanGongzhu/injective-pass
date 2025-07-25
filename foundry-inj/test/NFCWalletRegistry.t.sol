// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Test.sol";
import "../src/NFCWalletRegistry.sol";

contract NFCWalletRegistryTest is Test {
    NFCWalletRegistry public registry;

    address public owner;
    address public operator;
    address public user1;
    address public user2;
    address public unauthorizedUser;

    string constant NFC_UID_1 = "04:1a:2b:3c:4d:5e:6f";
    string constant NFC_UID_2 = "04:2a:3b:4c:5d:6e:7f";
    string constant NFC_UID_3 = "04:3a:4b:5c:6d:7e:8f";

    event NFCWalletBound(
        string indexed nfcUID,
        address indexed walletAddress,
        uint256 boundAt
    );
    event NFCWalletUnbound(
        string indexed nfcUID,
        address indexed walletAddress,
        uint256 unboundAt,
        bool cardReset
    );
    event BlankCardDetected(
        string indexed nfcUID,
        address indexed newWallet,
        uint256 timestamp
    );
    event CardInitialized(
        string indexed nfcUID,
        address indexed walletAddress,
        uint256 timestamp
    );
    event OperatorAuthorized(string indexed operatorId, bool authorized);

    function setUp() public {
        owner = makeAddr("owner");
        operator = makeAddr("operator");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        unauthorizedUser = makeAddr("unauthorizedUser");

        vm.startPrank(owner);
        registry = new NFCWalletRegistry();

        // 授权操作者
        string memory operatorId = vm.toString(operator);
        registry.setOperatorAuthorization(operatorId, true);
        vm.stopPrank();
    }

    // ============ 基础功能测试 ============

    function testDeployment() public {
        assertEq(registry.owner(), owner);
        assertEq(registry.totalBindings(), 0);
        assertEq(registry.totalUnbindings(), 0);
    }

    function testOperatorAuthorization() public {
        string memory operatorId = vm.toString(operator);
        assertTrue(registry.authorizedOperators(operatorId));

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit OperatorAuthorized(operatorId, false);
        registry.setOperatorAuthorization(operatorId, false);

        assertFalse(registry.authorizedOperators(operatorId));
    }

    function testUnauthorizedCannotSetOperator() public {
        string memory operatorId = vm.toString(unauthorizedUser);

        vm.prank(unauthorizedUser);
        vm.expectRevert("Ownable: caller is not the owner");
        registry.setOperatorAuthorization(operatorId, true);
    }

    // ============ NFC绑定测试 ============

    function testBindNFCWallet() public {
        vm.prank(operator);
        vm.expectEmit(true, true, false, true);
        emit NFCWalletBound(NFC_UID_1, user1, block.timestamp);

        registry.bindNFCWallet(NFC_UID_1, user1);

        // 验证绑定信息
        (
            address walletAddress,
            uint256 boundAt,
            uint256 unboundAt,
            bool isActive,
            bool isBlank,
            string memory metadata
        ) = registry.nfcBindings(NFC_UID_1);

        assertEq(walletAddress, user1);
        assertEq(boundAt, block.timestamp);
        assertEq(unboundAt, 0);
        assertTrue(isActive);
        assertFalse(isBlank);
        assertEq(metadata, "");

        // 验证统计信息
        assertEq(registry.totalBindings(), 1);
        assertTrue(registry.isNFCBound(NFC_UID_1));
        assertEq(registry.getNFCWallet(NFC_UID_1), user1);
    }

    function testBindNFCWalletInvalidInputs() public {
        vm.startPrank(operator);

        // 测试空 UID
        vm.expectRevert("Invalid NFC UID");
        registry.bindNFCWallet("", user1);

        // 测试零地址
        vm.expectRevert("Invalid wallet address");
        registry.bindNFCWallet(NFC_UID_1, address(0));

        vm.stopPrank();
    }

    function testBindNFCWalletAlreadyBound() public {
        vm.startPrank(operator);

        // 先绑定一次
        registry.bindNFCWallet(NFC_UID_1, user1);

        // 尝试重复绑定
        vm.expectRevert("NFC already bound");
        registry.bindNFCWallet(NFC_UID_1, user2);

        vm.stopPrank();
    }

    function testUnauthorizedCannotBind() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not authorized operator");
        registry.bindNFCWallet(NFC_UID_1, user1);
    }

    // ============ 空白卡检测测试 ============

    function testDetectAndBindBlankCard() public {
        vm.prank(operator);
        vm.expectEmit(true, true, false, true);
        emit BlankCardDetected(NFC_UID_1, user1, block.timestamp);

        bool result = registry.detectAndBindBlankCard(NFC_UID_1, user1);
        assertTrue(result);

        // 验证空白卡信息
        (
            address walletAddress,
            uint256 boundAt,
            uint256 unboundAt,
            bool isActive,
            bool isBlank,
            string memory metadata
        ) = registry.nfcBindings(NFC_UID_1);

        assertEq(walletAddress, user1);
        assertTrue(isActive);
        assertTrue(isBlank);
        assertEq(metadata, "auto_created");

        // 验证历史记录
        assertTrue(registry.isBlankCard(NFC_UID_1));
    }

    function testDetectBlankCardAlreadyBound() public {
        vm.startPrank(operator);

        // 先绑定一个卡
        registry.bindNFCWallet(NFC_UID_1, user1);

        // 尝试检测已绑定的卡
        bool result = registry.detectAndBindBlankCard(NFC_UID_1, user2);
        assertFalse(result);

        vm.stopPrank();
    }

    function testInitializeBlankCard() public {
        vm.startPrank(operator);

        // 先检测空白卡
        registry.detectAndBindBlankCard(NFC_UID_1, user1);

        // 初始化空白卡
        string memory initMetadata = "initialized_by_user";
        vm.expectEmit(true, true, false, true);
        emit CardInitialized(NFC_UID_1, user1, block.timestamp);

        registry.initializeBlankCard(NFC_UID_1, initMetadata);

        // 验证初始化后状态
        (, , , , bool isBlank, string memory metadata) = registry.nfcBindings(
            NFC_UID_1
        );
        assertFalse(isBlank);
        assertEq(metadata, initMetadata);
        assertFalse(registry.isBlankCard(NFC_UID_1));

        vm.stopPrank();
    }

    function testInitializeBlankCardInvalidStates() public {
        vm.startPrank(operator);

        // 尝试初始化未绑定的卡
        vm.expectRevert("NFC not bound");
        registry.initializeBlankCard(NFC_UID_1, "test");

        // 绑定非空白卡
        registry.bindNFCWallet(NFC_UID_1, user1);

        // 尝试初始化非空白卡
        vm.expectRevert("Card is not blank");
        registry.initializeBlankCard(NFC_UID_1, "test");

        vm.stopPrank();
    }

    // ============ 批量操作测试 ============

    function testBatchDetectBlankCards() public {
        string[] memory nfcUIDs = new string[](3);
        address[] memory walletAddresses = new address[](3);

        nfcUIDs[0] = NFC_UID_1;
        nfcUIDs[1] = NFC_UID_2;
        nfcUIDs[2] = NFC_UID_3;

        walletAddresses[0] = user1;
        walletAddresses[1] = user2;
        walletAddresses[2] = makeAddr("user3");

        vm.prank(operator);
        uint256 successCount = registry.batchDetectBlankCards(
            nfcUIDs,
            walletAddresses
        );

        assertEq(successCount, 3);
        assertEq(registry.totalBindings(), 3);

        // 验证所有卡都被正确绑定
        for (uint256 i = 0; i < 3; i++) {
            assertTrue(registry.isNFCBound(nfcUIDs[i]));
            assertTrue(registry.isBlankCard(nfcUIDs[i]));
            assertEq(registry.getNFCWallet(nfcUIDs[i]), walletAddresses[i]);
        }
    }

    function testBatchDetectBlankCardsArrayMismatch() public {
        string[] memory nfcUIDs = new string[](2);
        address[] memory walletAddresses = new address[](3);

        vm.prank(operator);
        vm.expectRevert("Array length mismatch");
        registry.batchDetectBlankCards(nfcUIDs, walletAddresses);
    }

    function testBatchDetectBlankCardsPartialSuccess() public {
        // 先绑定一个卡
        vm.prank(operator);
        registry.bindNFCWallet(NFC_UID_1, user1);

        string[] memory nfcUIDs = new string[](3);
        address[] memory walletAddresses = new address[](3);

        nfcUIDs[0] = NFC_UID_1; // 已绑定
        nfcUIDs[1] = NFC_UID_2; // 新卡
        nfcUIDs[2] = NFC_UID_3; // 新卡

        walletAddresses[0] = user1;
        walletAddresses[1] = user2;
        walletAddresses[2] = makeAddr("user3");

        vm.prank(operator);
        uint256 successCount = registry.batchDetectBlankCards(
            nfcUIDs,
            walletAddresses
        );

        assertEq(successCount, 2); // 只有2个新卡成功
        assertEq(registry.totalBindings(), 3); // 总共3个绑定
    }

    // ============ 查询功能测试 ============

    function testGetWalletActiveNFCs() public {
        vm.startPrank(operator);

        // 绑定多个NFC到同一个钱包
        registry.bindNFCWallet(NFC_UID_1, user1);
        registry.bindNFCWallet(NFC_UID_2, user1);
        registry.detectAndBindBlankCard(NFC_UID_3, user1);

        vm.stopPrank();

        string[] memory activeNFCs = registry.getWalletActiveNFCs(user1);
        assertEq(activeNFCs.length, 3);

        // 验证返回的NFCs是正确的（顺序可能不同）
        bool found1 = false;
        bool found2 = false;
        bool found3 = false;

        for (uint256 i = 0; i < activeNFCs.length; i++) {
            if (keccak256(bytes(activeNFCs[i])) == keccak256(bytes(NFC_UID_1)))
                found1 = true;
            if (keccak256(bytes(activeNFCs[i])) == keccak256(bytes(NFC_UID_2)))
                found2 = true;
            if (keccak256(bytes(activeNFCs[i])) == keccak256(bytes(NFC_UID_3)))
                found3 = true;
        }

        assertTrue(found1);
        assertTrue(found2);
        assertTrue(found3);
    }

    function testGetWalletCardStats() public {
        vm.startPrank(operator);

        // 绑定不同类型的卡
        registry.bindNFCWallet(NFC_UID_1, user1); // 普通卡
        registry.detectAndBindBlankCard(NFC_UID_2, user1); // 空白卡
        registry.detectAndBindBlankCard(NFC_UID_3, user1); // 另一个空白卡

        vm.stopPrank();

        (uint256 totalCards, uint256 activeCards, uint256 blankCards) = registry
            .getWalletCardStats(user1);

        assertEq(totalCards, 3);
        assertEq(activeCards, 3);
        assertEq(blankCards, 2);
    }

    // ============ 紧急管理功能测试 ============

    function testEmergencyFreezeNFC() public {
        vm.prank(operator);
        registry.bindNFCWallet(NFC_UID_1, user1);

        vm.prank(owner);
        registry.emergencyFreezeNFC(NFC_UID_1);

        (, , , bool isActive, , ) = registry.nfcBindings(NFC_UID_1);
        assertFalse(isActive);
        assertFalse(registry.isNFCBound(NFC_UID_1)); // 冻结的卡不算已绑定
    }

    function testUnfreezeNFC() public {
        vm.prank(operator);
        registry.bindNFCWallet(NFC_UID_1, user1);

        vm.startPrank(owner);
        registry.emergencyFreezeNFC(NFC_UID_1);
        registry.unfreezeNFC(NFC_UID_1);
        vm.stopPrank();

        (, , , bool isActive, , ) = registry.nfcBindings(NFC_UID_1);
        assertTrue(isActive);
        assertTrue(registry.isNFCBound(NFC_UID_1));
    }

    function testBatchBindNFCs() public {
        string[] memory nfcUIDs = new string[](2);
        address[] memory walletAddresses = new address[](2);

        nfcUIDs[0] = NFC_UID_1;
        nfcUIDs[1] = NFC_UID_2;
        walletAddresses[0] = user1;
        walletAddresses[1] = user2;

        vm.prank(owner);
        registry.batchBindNFCs(nfcUIDs, walletAddresses);

        assertEq(registry.totalBindings(), 2);
        assertTrue(registry.isNFCBound(NFC_UID_1));
        assertTrue(registry.isNFCBound(NFC_UID_2));
        assertEq(registry.getNFCWallet(NFC_UID_1), user1);
        assertEq(registry.getNFCWallet(NFC_UID_2), user2);
    }

    // ============ Edge Cases 测试 ============

    function testQueryNonExistentNFC() public {
        assertFalse(registry.isNFCBound("non_existent"));
        assertEq(registry.getNFCWallet("non_existent"), address(0));
        assertTrue(registry.isBlankCard("non_existent")); // 未绑定的都是空白卡
    }

    function testEmptyWalletQueries() public {
        string[] memory activeNFCs = registry.getWalletActiveNFCs(user1);
        assertEq(activeNFCs.length, 0);

        (uint256 totalCards, uint256 activeCards, uint256 blankCards) = registry
            .getWalletCardStats(user1);
        assertEq(totalCards, 0);
        assertEq(activeCards, 0);
        assertEq(blankCards, 0);
    }

    // ============ 权限测试 ============

    function testOnlyOwnerFunctions() public {
        vm.startPrank(unauthorizedUser);

        vm.expectRevert("Ownable: caller is not the owner");
        registry.setOperatorAuthorization("test", true);

        vm.expectRevert("Ownable: caller is not the owner");
        registry.emergencyFreezeNFC(NFC_UID_1);

        vm.expectRevert("Ownable: caller is not the owner");
        registry.unfreezeNFC(NFC_UID_1);

        string[] memory nfcUIDs = new string[](1);
        address[] memory walletAddresses = new address[](1);
        vm.expectRevert("Ownable: caller is not the owner");
        registry.batchBindNFCs(nfcUIDs, walletAddresses);

        vm.stopPrank();
    }

    // ============ 气体优化测试 ============

    function testGasOptimization() public {
        vm.startPrank(operator);

        // 测试单个绑定的气体消耗
        uint256 gasBefore = gasleft();
        registry.bindNFCWallet(NFC_UID_1, user1);
        uint256 gasUsed = gasBefore - gasleft();

        // 验证气体消耗在合理范围内（具体值需要根据实际情况调整）
        assertTrue(gasUsed < 200000, "Single bind gas usage too high");

        vm.stopPrank();
    }
}
