// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/CatNFT.sol";
import "../src/NFCWalletRegistry.sol";

contract QuickTest is Test {
    NFCWalletRegistry public registry;
    CatNFT public catNFT;

    function setUp() public {
        // 部署合约
        registry = new NFCWalletRegistry();
        catNFT = new CatNFT();
    }

    function testBasicSetup() public view {
        // 测试基本设置
        assertTrue(address(registry) != address(0));
        assertTrue(address(catNFT) != address(0));
    }

    function testRegistryBasics() public {
        // 测试注册表基本功能
        string memory testNFC = "test_nfc_uid";
        address testWallet = makeAddr("testWallet");
        
        // 首先检查初始状态
        assertFalse(registry.isNFCBound(testNFC));
        assertTrue(registry.isBlankCard(testNFC)); // 未绑定的卡都是空白卡
        
        // 检查总绑定数量
        assertEq(registry.totalBindings(), 0);
    }

    function testCatNFTBasics() public {
        // 测试小猫NFT基本功能
        address user = makeAddr("user");
        vm.deal(user, 1 ether);
        
        vm.prank(user);
        catNFT.drawCatNFT{value: 0.1 ether}("TestCat");
        
        uint256[] memory userCats = catNFT.getUserCats(user);
        assertEq(userCats.length, 1);
        assertEq(catNFT.ownerOf(userCats[0]), user);
    }
}
