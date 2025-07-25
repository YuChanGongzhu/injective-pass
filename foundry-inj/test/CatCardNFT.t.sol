// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Test.sol";
import "../src/NFCCardNFT.sol";

contract CatCardNFTTest is Test {
    CatCardNFT public catNFT;

    address public owner;
    address public authorizedMinter;
    address public user1;
    address public user2;
    address public unauthorizedUser;

    string constant NFC_UID_1 = "04:1a:2b:3c:4d:5e:6f";
    string constant NFC_UID_2 = "04:2a:3b:4c:5d:6e:7f";
    string constant NFC_UID_3 = "04:3a:4b:5c:6d:7e:8f";

    event CatMinted(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed owner,
        string catName,
        uint8 breed
    );
    event CatBound(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed wallet
    );
    event CatUnbound(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed wallet,
        bool burned
    );
    event CatsInteracted(
        uint256 indexed tokenId1,
        uint256 indexed tokenId2,
        address indexed initiator,
        uint8 interactionType
    );
    event CatMoodChanged(uint256 indexed tokenId, uint8 oldMood, uint8 newMood);
    event FriendshipLevelUp(
        uint256 indexed tokenId,
        uint256 oldLevel,
        uint256 newLevel
    );

    function setUp() public {
        owner = makeAddr("owner");
        authorizedMinter = makeAddr("authorizedMinter");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        unauthorizedUser = makeAddr("unauthorizedUser");

        vm.startPrank(owner);
        catNFT = new CatCardNFT(
            "CatCardNFT",
            "CCN",
            "https://api.example.com/cat/"
        );

        // 设置授权铸造者
        catNFT.setAuthorizedMinter(authorizedMinter, true);
        vm.stopPrank();
    }

    // ============ 基础功能测试 ============

    function testDeployment() public {
        assertEq(catNFT.owner(), owner);
        assertEq(catNFT.name(), "CatCardNFT");
        assertEq(catNFT.symbol(), "CCN");
        assertTrue(catNFT.authorizedMinters(authorizedMinter));
        assertFalse(catNFT.authorizedMinters(unauthorizedUser));
    }

    function testSetAuthorizedMinter() public {
        vm.prank(owner);
        catNFT.setAuthorizedMinter(user1, true);
        assertTrue(catNFT.authorizedMinters(user1));

        vm.prank(owner);
        catNFT.setAuthorizedMinter(user1, false);
        assertFalse(catNFT.authorizedMinters(user1));
    }

    function testMintCatCard() public {
        vm.prank(authorizedMinter);
        uint256 tokenId = catNFT.mintCatCard(NFC_UID_1, user1);

        assertEq(tokenId, 1);
        assertEq(catNFT.ownerOf(tokenId), user1);
        assertEq(catNFT.nfcToTokenId(NFC_UID_1), tokenId);

                // 验证 NFC 映射
        assertTrue(catNFT.nfcToTokenId(NFC_UID_1) > 0);
    }

    function testInteractWithCat() public {
        vm.startPrank(authorizedMinter);
        uint256 tokenId1 = catNFT.mintCatCard(NFC_UID_1, user1);
        uint256 tokenId2 = catNFT.mintCatCard(NFC_UID_2, user2);
        vm.stopPrank();

        // user1 与 user2 的小猫交互
        vm.prank(user1);
        catNFT.interactWithCat(
            NFC_UID_1,
            NFC_UID_2,
            CatCardNFT.InteractionType.Pet,
            "Hello kitty!"
        );

        // 验证交互记录
        CatCardNFT.InteractionRecord[] memory interactions1 = catNFT
            .getCatInteractions(tokenId1);
        CatCardNFT.InteractionRecord[] memory interactions2 = catNFT
            .getCatInteractions(tokenId2);

        assertEq(interactions1.length, 1);
        assertEq(interactions2.length, 1);
        assertEq(interactions1[0].interactor, user1);
        assertEq(
            uint8(interactions1[0].interactionType),
            uint8(CatCardNFT.InteractionType.Pet)
        );
    }

    function testUnauthorizedCannotMint() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not authorized minter");
        catNFT.mintCatCard(NFC_UID_1, user1);
    }

    function testGetWalletCats() public {
        vm.startPrank(authorizedMinter);
        uint256 tokenId1 = catNFT.mintCatCard(NFC_UID_1, user1);
        uint256 tokenId2 = catNFT.mintCatCard(NFC_UID_2, user1);
        vm.stopPrank();

        uint256[] memory userCats = catNFT.getWalletCats(user1);
        assertEq(userCats.length, 2);

        // 验证返回的token ID是正确的
        assertTrue(
            (userCats[0] == tokenId1 && userCats[1] == tokenId2) ||
                (userCats[0] == tokenId2 && userCats[1] == tokenId1)
        );
    }
}
