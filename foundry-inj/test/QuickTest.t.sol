// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Test.sol";
import "../src/NFCWalletRegistry.sol";
import "../src/NFCCardNFT.sol";

contract QuickTest is Test {
    NFCWalletRegistry public registry;
    CatCardNFT public catNFT;

    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this); // 使用测试合约作为owner，简化权限
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // 部署合约
        registry = new NFCWalletRegistry();
        catNFT = new CatCardNFT(
            "CatCardNFT",
            "CCN",
            "https://api.example.com/cat/"
        );

        // 设置权限 - 使用合约地址转换格式
        string memory ownerHex = toHexString(address(this));
        registry.setOperatorAuthorization(ownerHex, true);
        catNFT.setAuthorizedMinter(address(this), true);
    }

    function testCompleteFlow() public {
        string memory nfcUID = "04:1a:2b:3c:4d:5e:6f";

        // 1. 检测空白卡
        bool isBlank = registry.detectAndBindBlankCard(nfcUID, user1);
        assertTrue(isBlank);
        assertTrue(registry.isNFCBound(nfcUID));
        assertEq(registry.getNFCWallet(nfcUID), user1);

        // 2. 铸造NFT
        uint256 tokenId = catNFT.mintCatCard(nfcUID, user1);
        assertEq(tokenId, 1);
        assertEq(catNFT.ownerOf(tokenId), user1);
        assertEq(catNFT.nfcToTokenId(nfcUID), tokenId);

        // 3. 初始化卡片
        registry.initializeBlankCard(nfcUID, "initialized");
        assertFalse(registry.isBlankCard(nfcUID));

        // 4. 验证用户状态
        string[] memory userNFCs = registry.getWalletActiveNFCs(user1);
        uint256[] memory userCats = catNFT.getWalletCats(user1);

        assertEq(userNFCs.length, 1);
        assertEq(userCats.length, 1);
        assertEq(userNFCs[0], nfcUID);
        assertEq(userCats[0], tokenId);
    }

    function testMultiUserScenario() public {
        string memory nfcUID1 = "04:1a:2b:3c:4d:5e:6f";
        string memory nfcUID2 = "04:2a:3b:4c:5d:6e:7f";

        // 用户1激活
        registry.detectAndBindBlankCard(nfcUID1, user1);
        uint256 tokenId1 = catNFT.mintCatCard(nfcUID1, user1);

        // 用户2激活
        registry.detectAndBindBlankCard(nfcUID2, user2);
        uint256 tokenId2 = catNFT.mintCatCard(nfcUID2, user2);

        // 验证两个用户的状态
        assertEq(catNFT.ownerOf(tokenId1), user1);
        assertEq(catNFT.ownerOf(tokenId2), user2);

        uint256[] memory user1Cats = catNFT.getWalletCats(user1);
        uint256[] memory user2Cats = catNFT.getWalletCats(user2);

        assertEq(user1Cats.length, 1);
        assertEq(user2Cats.length, 1);
        assertEq(user1Cats[0], tokenId1);
        assertEq(user2Cats[0], tokenId2);
    }

    function testBatchOperations() public {
        string[] memory nfcUIDs = new string[](3);
        address[] memory users = new address[](3);

        nfcUIDs[0] = "04:1a:2b:3c:4d:5e:6f";
        nfcUIDs[1] = "04:2a:3b:4c:5d:6e:7f";
        nfcUIDs[2] = "04:3a:4b:5c:6d:7e:8f";

        users[0] = user1;
        users[1] = user2;
        users[2] = makeAddr("user3");

        // 批量检测空白卡
        uint256 successCount = registry.batchDetectBlankCards(nfcUIDs, users);
        assertEq(successCount, 3);

        // 为所有用户铸造NFT
        for (uint256 i = 0; i < 3; i++) {
            uint256 tokenId = catNFT.mintCatCard(nfcUIDs[i], users[i]);
            assertEq(catNFT.ownerOf(tokenId), users[i]);
        }

        // 验证总体状态
        assertEq(registry.totalBindings(), 3);
    }

    // 辅助函数：将地址转换为十六进制字符串（与合约中的格式一致）
    function toHexString(address addr) internal pure returns (string memory) {
        return Strings.toHexString(uint160(addr), 20);
    }
}
