// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CatCardNFT - 小猫咪集卡NFT合约
 * @dev 支持NFC卡片绑定的小猫meme NFT系统，MVP版本使用伪随机数，生产版本可升级为Chainlink VRF
 */
contract CatCardNFT is ERC721, ERC721Burnable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // 小猫品种枚举
    enum CatBreed {
        Tabby, // 虎斑猫 🐅
        Persian, // 波斯猫 😻
        Siamese, // 暹罗猫 🐱
        Orange, // 橘猫 🧡
        Tuxedo, // 燕尾服猫 🤵
        Calico, // 三花猫 🌸
        Ragdoll, // 布偶猫 🧸
        Maine // 缅因猫 🦁
    }

    // 小猫心情枚举
    enum CatMood {
        Happy, // 开心 😸
        Sleepy, // 困倦 😴
        Playful, // 顽皮 😺
        Grumpy, // 生气 😾
        Hungry, // 饿了 🙀
        Curious // 好奇 😼
    }

    // 交互类型枚举
    enum InteractionType {
        Pet, // 撸猫
        Play, // 玩耍
        Feed, // 喂食
        Photo // 合照
    }

    // 小猫NFT结构
    struct CatCard {
        string nfcUID; // NFC唯一标识
        string catName; // 小猫名字
        CatBreed breed; // 品种
        CatMood mood; // 当前心情
        uint256 friendshipLevel; // 友谊等级 (1-10)
        uint256 totalInteractions; // 总交互次数
        uint256 lastInteraction; // 最后交互时间
        uint256 mintedAt; // 铸造时间
        bool isActive; // 是否激活
        address boundWallet; // 绑定钱包
        string imageURI; // 小猫图片URI
    }

    // 交互记录结构
    struct InteractionRecord {
        uint256 timestamp;
        address interactor;
        InteractionType interactionType;
        string message; // 可选的交互消息
    }

    // 状态变量
    mapping(uint256 => CatCard) public catCards;
    mapping(string => uint256) public nfcToTokenId; // NFC UID -> Token ID
    mapping(address => uint256[]) public walletCats; // 钱包 -> 小猫列表
    mapping(uint256 => InteractionRecord[]) public catInteractions; // 小猫交互历史
    mapping(address => bool) public authorizedMinters; // 授权铸造者

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    // 预设的小猫名字池
    string[] private catNames = [
        "Whiskers",
        "Mittens",
        "Shadow",
        "Luna",
        "Milo",
        "Bella",
        "Simba",
        "Nala",
        "Garfield",
        "Felix",
        "Boots",
        "Patches",
        "Smokey",
        "Tiger",
        "Princess"
    ];

    // 事件
    event CatMinted(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed owner,
        string catName,
        CatBreed breed
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
        InteractionType interactionType
    );

    event CatMoodChanged(
        uint256 indexed tokenId,
        CatMood oldMood,
        CatMood newMood
    );

    event FriendshipLevelUp(
        uint256 indexed tokenId,
        uint256 oldLevel,
        uint256 newLevel
    );

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        _tokenIdCounter = 1;
    }

    /**
     * @dev 为新用户创建小猫NFT（模拟空白卡激活）
     * @param nfcUID NFC卡片唯一标识符
     * @param initialOwner 初始拥有者（新创建的账户）
     * @return tokenId 新铸造的NFT Token ID
     */
    function mintCatCard(
        string memory nfcUID,
        address initialOwner
    ) external onlyAuthorizedMinter returns (uint256) {
        require(bytes(nfcUID).length > 0, "Invalid NFC UID");
        require(initialOwner != address(0), "Invalid owner address");
        require(nfcToTokenId[nfcUID] == 0, "NFC already has NFT");

        uint256 tokenId = _tokenIdCounter++;

        // 生成随机小猫属性
        (
            string memory catName,
            CatBreed breed,
            CatMood mood
        ) = _generateRandomCat(tokenId);

        // 铸造NFT
        _safeMint(initialOwner, tokenId);

        // 创建小猫信息
        catCards[tokenId] = CatCard({
            nfcUID: nfcUID,
            catName: catName,
            breed: breed,
            mood: mood,
            friendshipLevel: 1,
            totalInteractions: 0,
            lastInteraction: block.timestamp,
            mintedAt: block.timestamp,
            isActive: true,
            boundWallet: initialOwner,
            imageURI: _generateImageURI(breed, mood)
        });

        // 更新映射关系
        nfcToTokenId[nfcUID] = tokenId;
        walletCats[initialOwner].push(tokenId);

        emit CatMinted(tokenId, nfcUID, initialOwner, catName, breed);
        emit CatBound(tokenId, nfcUID, initialOwner);

        return tokenId;
    }

    /**
     * @dev 解绑并转移小猫NFT所有权
     * @param nfcUID NFC卡片UID
     * @param newOwner 新的所有者地址
     * @param ownerSignature 拥有者签名
     */
    function unbindAndTransferCat(
        string memory nfcUID,
        address newOwner,
        bytes memory ownerSignature
    ) external nonReentrant {
        require(newOwner != address(0), "Invalid new owner address");

        uint256 tokenId = nfcToTokenId[nfcUID];
        require(tokenId != 0, "NFC not found");
        require(_ownerOf(tokenId) != address(0), "Cat already burned");

        CatCard storage cat = catCards[tokenId];
        address catOwner = ownerOf(tokenId);

        // 验证调用者必须是小猫所有者
        require(msg.sender == catOwner, "Only cat owner can transfer");

        // 验证签名
        require(
            _verifyOwnerSignature(catOwner, nfcUID, "transfer", ownerSignature),
            "Invalid signature"
        );

        // 清除NFC映射关系（解绑）
        delete nfcToTokenId[nfcUID];

        // 更新小猫状态为非激活
        cat.isActive = false;
        cat.boundWallet = address(0);

        // 转移NFT所有权
        _transfer(catOwner, newOwner, tokenId);

        emit CatUnbound(tokenId, nfcUID, catOwner, false);
    }

    /**
     * @dev 解绑并销毁小猫NFT
     * @param nfcUID NFC卡片UID
     * @param ownerSignature 拥有者签名
     */
    function unbindAndBurnCat(
        string memory nfcUID,
        bytes memory ownerSignature
    ) external nonReentrant {
        uint256 tokenId = nfcToTokenId[nfcUID];
        require(tokenId != 0, "NFC not found");
        require(_ownerOf(tokenId) != address(0), "Cat already burned");

        CatCard storage cat = catCards[tokenId];
        address catOwner = ownerOf(tokenId);

        // 验证调用者必须是小猫所有者
        require(msg.sender == catOwner, "Only cat owner can burn");

        // 验证签名
        require(
            _verifyOwnerSignature(catOwner, nfcUID, "burn", ownerSignature),
            "Invalid signature"
        );

        // 从拥有者的小猫列表中移除
        _removeCatFromWallet(catOwner, tokenId);

        // 清除映射关系
        delete nfcToTokenId[nfcUID];

        emit CatUnbound(tokenId, nfcUID, catOwner, true);

        // 销毁NFT
        _burn(tokenId);
    }

    /**
     * @dev 小猫社交交互功能（碰卡交互）
     * @param myNfcUID 我的NFC卡片UID
     * @param targetNfcUID 目标NFC卡片UID
     * @param interactionType 交互类型
     * @param message 可选的交互消息
     */
    function interactWithCat(
        string memory myNfcUID,
        string memory targetNfcUID,
        InteractionType interactionType,
        string memory message
    ) external nonReentrant {
        uint256 myTokenId = nfcToTokenId[myNfcUID];
        uint256 targetTokenId = nfcToTokenId[targetNfcUID];

        require(myTokenId != 0, "My NFC not found");
        require(targetTokenId != 0, "Target NFC not found");
        require(myTokenId != targetTokenId, "Cannot interact with same cat");

        CatCard storage myCat = catCards[myTokenId];
        CatCard storage targetCat = catCards[targetTokenId];

        // 验证我的小猫所有权
        require(ownerOf(myTokenId) == msg.sender, "Not owner of my cat");

        // 验证两只小猫都是激活状态
        require(myCat.isActive, "My cat is not active");
        require(targetCat.isActive, "Target cat is not active");

        // 执行交互逻辑
        _processCatInteraction(myTokenId, targetTokenId, interactionType);

        // 记录交互历史
        catInteractions[myTokenId].push(
            InteractionRecord({
                timestamp: block.timestamp,
                interactor: ownerOf(targetTokenId),
                interactionType: interactionType,
                message: message
            })
        );

        catInteractions[targetTokenId].push(
            InteractionRecord({
                timestamp: block.timestamp,
                interactor: msg.sender,
                interactionType: interactionType,
                message: message
            })
        );

        emit CatsInteracted(
            myTokenId,
            targetTokenId,
            msg.sender,
            interactionType
        );
    }

    /**
     * @dev 处理小猫交互逻辑
     */
    function _processCatInteraction(
        uint256 myTokenId,
        uint256 targetTokenId,
        InteractionType interactionType
    ) internal {
        CatCard storage myCat = catCards[myTokenId];
        CatCard storage targetCat = catCards[targetTokenId];

        // 增加交互次数
        myCat.totalInteractions++;
        targetCat.totalInteractions++;

        // 更新最后交互时间
        myCat.lastInteraction = block.timestamp;
        targetCat.lastInteraction = block.timestamp;

        // 根据交互类型增加友谊值
        uint256 friendshipGain = _calculateFriendshipGain(interactionType);

        _increaseFriendship(myTokenId, friendshipGain);
        _increaseFriendship(targetTokenId, friendshipGain);

        // 随机改变心情
        _updateCatMood(myTokenId, interactionType);
        _updateCatMood(targetTokenId, interactionType);
    }

    /**
     * @dev 计算友谊值增长
     */
    function _calculateFriendshipGain(
        InteractionType interactionType
    ) internal pure returns (uint256) {
        if (interactionType == InteractionType.Pet) return 2;
        if (interactionType == InteractionType.Play) return 3;
        if (interactionType == InteractionType.Feed) return 4;
        if (interactionType == InteractionType.Photo) return 1;
        return 1;
    }

    /**
     * @dev 增加友谊等级
     */
    function _increaseFriendship(uint256 tokenId, uint256 amount) internal {
        CatCard storage cat = catCards[tokenId];
        uint256 oldLevel = cat.friendshipLevel;

        // 简单的升级逻辑：每10次交互升1级，最高10级
        uint256 newLevel = (cat.totalInteractions / 10) + 1;
        if (newLevel > 10) newLevel = 10;

        if (newLevel > oldLevel) {
            cat.friendshipLevel = newLevel;
            emit FriendshipLevelUp(tokenId, oldLevel, newLevel);
        }
    }

    /**
     * @dev 更新小猫心情
     */
    function _updateCatMood(
        uint256 tokenId,
        InteractionType interactionType
    ) internal {
        CatCard storage cat = catCards[tokenId];
        CatMood oldMood = cat.mood;
        CatMood newMood = _getNewMood(interactionType, oldMood);

        if (newMood != oldMood) {
            cat.mood = newMood;
            // 更新图片URI以反映新心情
            cat.imageURI = _generateImageURI(cat.breed, newMood);
            emit CatMoodChanged(tokenId, oldMood, newMood);
        }
    }

    /**
     * @dev 根据交互类型和当前心情确定新心情
     */
    function _getNewMood(
        InteractionType interactionType,
        CatMood currentMood
    ) internal view returns (CatMood) {
        uint256 randomness = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao))
        ) % 100;

        if (interactionType == InteractionType.Pet) {
            return randomness < 70 ? CatMood.Happy : CatMood.Sleepy;
        } else if (interactionType == InteractionType.Play) {
            return randomness < 60 ? CatMood.Playful : CatMood.Happy;
        } else if (interactionType == InteractionType.Feed) {
            return randomness < 80 ? CatMood.Happy : CatMood.Sleepy;
        } else if (interactionType == InteractionType.Photo) {
            return randomness < 50 ? CatMood.Curious : currentMood;
        }

        return currentMood;
    }

    /**
     * @dev 生成随机小猫属性（使用伪随机数，仅用于交互时的心情变化等非关键操作）
     */
    function _generateRandomCat(
        uint256 seed
    ) internal view returns (string memory, CatBreed, CatMood) {
        uint256 randomness = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, seed))
        );

        // 随机选择名字
        string memory catName = catNames[randomness % catNames.length];

        // 随机选择品种
        CatBreed breed = CatBreed(randomness % 8);

        // 随机选择初始心情
        CatMood mood = CatMood((randomness >> 8) % 6);

        return (catName, breed, mood);
    }

    /**
     * @dev 生成图片URI
     */
    function _generateImageURI(
        CatBreed breed,
        CatMood mood
    ) internal pure returns (string memory) {
        // 这里可以根据品种和心情生成不同的图片URI
        // 为了MVP，可以使用简单的格式
        return
            string(
                abi.encodePacked(
                    "https://api.catcards.fun/images/",
                    _breedToString(breed),
                    "/",
                    _moodToString(mood),
                    ".png"
                )
            );
    }

    /**
     * @dev 品种转换为字符串
     */
    function _breedToString(
        CatBreed breed
    ) internal pure returns (string memory) {
        if (breed == CatBreed.Tabby) return "tabby";
        if (breed == CatBreed.Persian) return "persian";
        if (breed == CatBreed.Siamese) return "siamese";
        if (breed == CatBreed.Orange) return "orange";
        if (breed == CatBreed.Tuxedo) return "tuxedo";
        if (breed == CatBreed.Calico) return "calico";
        if (breed == CatBreed.Ragdoll) return "ragdoll";
        if (breed == CatBreed.Maine) return "maine";
        return "tabby";
    }

    /**
     * @dev 心情转换为字符串
     */
    function _moodToString(CatMood mood) internal pure returns (string memory) {
        if (mood == CatMood.Happy) return "happy";
        if (mood == CatMood.Sleepy) return "sleepy";
        if (mood == CatMood.Playful) return "playful";
        if (mood == CatMood.Grumpy) return "grumpy";
        if (mood == CatMood.Hungry) return "hungry";
        if (mood == CatMood.Curious) return "curious";
        return "happy";
    }

    // 查询函数

    /**
     * @dev 获取小猫详细信息
     */
    function getCatInfo(
        uint256 tokenId
    ) external view returns (CatCard memory) {
        require(_ownerOf(tokenId) != address(0), "Cat does not exist");
        return catCards[tokenId];
    }

    /**
     * @dev 获取钱包的所有小猫
     */
    function getWalletCats(
        address wallet
    ) external view returns (uint256[] memory) {
        return walletCats[wallet];
    }

    /**
     * @dev 获取小猫的交互历史
     */
    function getCatInteractions(
        uint256 tokenId
    ) external view returns (InteractionRecord[] memory) {
        return catInteractions[tokenId];
    }

    /**
     * @dev 根据NFC UID获取Token ID
     */
    function getTokenIdByNFC(
        string memory nfcUID
    ) external view returns (uint256) {
        return nfcToTokenId[nfcUID];
    }

    // 内部辅助函数

    /**
     * @dev 从钱包小猫列表中移除指定小猫
     */
    function _removeCatFromWallet(address wallet, uint256 tokenId) internal {
        uint256[] storage cats = walletCats[wallet];
        for (uint256 i = 0; i < cats.length; i++) {
            if (cats[i] == tokenId) {
                cats[i] = cats[cats.length - 1];
                cats.pop();
                break;
            }
        }
    }

    /**
     * @dev 验证所有者签名
     */
    function _verifyOwnerSignature(
        address owner,
        string memory nfcUID,
        string memory action,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(
                    abi.encodePacked(owner, nfcUID, action, block.chainid)
                )
            )
        );

        address signer = _recoverSigner(messageHash, signature);
        return signer == owner;
    }

    /**
     * @dev 从签名中恢复签名者地址
     */
    function _recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature v value");

        return ecrecover(messageHash, v, r, s);
    }

    /**
     * @dev 重写转移函数以更新绑定关系
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        address previousOwner = super._update(to, tokenId, auth);

        // 如果不是铸造或销毁，更新绑定关系
        if (from != address(0) && to != address(0) && from != to) {
            catCards[tokenId].boundWallet = to;
            _removeCatFromWallet(from, tokenId);
            walletCats[to].push(tokenId);
            emit CatBound(tokenId, catCards[tokenId].nfcUID, to);
        }

        return previousOwner;
    }

    /**
     * @dev 获取Token URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "URI query for nonexistent token"
        );

        CatCard memory cat = catCards[tokenId];

        // 如果有自定义图片URI，直接返回
        if (bytes(cat.imageURI).length > 0) {
            return cat.imageURI;
        }

        // 否则使用基础URI
        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString()))
                : "";
    }

    /**
     * @dev 获取基础URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // 权限控制修饰符
    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "Not authorized minter"
        );
        _;
    }

    // 管理员函数

    /**
     * @dev 设置授权铸造者
     */
    function setAuthorizedMinter(
        address minter,
        bool authorized
    ) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }

    /**
     * @dev 设置基础URI
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    /**
     * @dev 添加新的小猫名字到名字池
     */
    function addCatNames(string[] memory newNames) external onlyOwner {
        for (uint256 i = 0; i < newNames.length; i++) {
            catNames.push(newNames[i]);
        }
    }
}
