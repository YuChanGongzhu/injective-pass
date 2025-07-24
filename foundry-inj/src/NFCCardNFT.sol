// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFCCardNFT
 * @dev 支持NFC卡片绑定和解绑的NFT合约
 * 当用户解绑NFC卡片时，对应的NFT将被销毁
 */
contract NFCCardNFT is ERC721, ERC721Burnable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // 卡片NFT信息结构
    struct CardNFT {
        string nfcUID; // 对应的NFC UID
        string seriesId; // 系列标识
        string artwork; // 艺术作品标识
        uint256 level; // 卡片等级
        uint256 experience; // 经验值
        uint256 battleCount; // 对战次数
        uint256 winCount; // 胜利次数
        uint256 mintedAt; // 铸造时间
        bool isActive; // 是否激活状态
        address boundWallet; // 绑定的钱包地址
        string metadata; // 元数据URI
    }

    // 卡片稀有度枚举
    enum Rarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    // 卡片模板结构
    struct CardTemplate {
        string seriesId;
        string artwork;
        Rarity rarity;
        uint256 baseAttack;
        uint256 baseDefense;
        uint256 baseSpeed;
        bool isActive;
    }

    // 状态变量
    mapping(uint256 => CardNFT) public cardNFTs;
    mapping(string => uint256) public nfcToTokenId; // NFC UID -> Token ID
    mapping(address => uint256[]) public walletCards; // 钱包 -> 卡片列表
    mapping(string => CardTemplate) public cardTemplates; // 卡片模板
    mapping(string => bool) public authorizedMinters; // 授权铸造者
    mapping(uint256 => bool) public frozenCards; // 冻结的卡片

    // 历史所有者追踪
    mapping(uint256 => OwnershipRecord[]) public cardOwnershipHistory; // Token ID -> 历史所有者记录
    mapping(uint256 => uint256) public cardOwnershipCount; // Token ID -> 历史所有者数量

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    // 事件
    event CardMinted(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed owner,
        string seriesId
    );

    event CardBound(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed wallet
    );

    event CardUnbound(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed wallet,
        bool burned
    );

    event CardLevelUp(
        uint256 indexed tokenId,
        uint256 oldLevel,
        uint256 newLevel
    );

    event CardFrozen(
        uint256 indexed tokenId,
        string indexed nfcUID,
        bool frozen
    );

    event CardTransferred(
        uint256 indexed tokenId,
        string indexed nfcUID,
        address indexed fromOwner,
        address indexed toOwner
    );

    event CardsInteracted(
        uint256 indexed tokenId1,
        uint256 indexed tokenId2,
        address indexed initiator,
        string interactionType
    );

    event BattleResult(
        uint256 indexed tokenId,
        bool won,
        uint256 experienceGained
    );

    event OwnershipTransferred(
        uint256 indexed tokenId,
        address indexed previousOwner,
        address indexed newOwner,
        string reason
    );

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        _tokenIdCounter = 1; // 从1开始，避免0值混淆
    }

    /**
     * @dev 为NFC卡片铸造NFT
     * @param nfcUID NFC卡片唯一标识符
     * @param seriesId 卡片系列标识
     * @param initialOwner 初始拥有者
     * @return tokenId 新铸造的NFT Token ID
     */
    function mintCardNFT(
        string memory nfcUID,
        string memory seriesId,
        address initialOwner
    ) external onlyAuthorizedMinter returns (uint256) {
        require(bytes(nfcUID).length > 0, "Invalid NFC UID");
        require(initialOwner != address(0), "Invalid owner address");
        require(nfcToTokenId[nfcUID] == 0, "NFC already has NFT");
        require(cardTemplates[seriesId].isActive, "Series not active");

        uint256 tokenId = _tokenIdCounter++;

        // 铸造NFT
        _safeMint(initialOwner, tokenId);

        // 创建卡片信息
        cardNFTs[tokenId] = CardNFT({
            nfcUID: nfcUID,
            seriesId: seriesId,
            artwork: cardTemplates[seriesId].artwork,
            level: 1,
            experience: 0,
            battleCount: 0,
            winCount: 0,
            mintedAt: block.timestamp,
            isActive: true,
            boundWallet: initialOwner,
            metadata: ""
        });

        // 更新映射关系
        nfcToTokenId[nfcUID] = tokenId;
        walletCards[initialOwner].push(tokenId);

        // 记录初始所有者
        _recordOwnershipChange(tokenId, address(0), initialOwner, "mint");

        emit CardMinted(tokenId, nfcUID, initialOwner, seriesId);
        emit CardBound(tokenId, nfcUID, initialOwner);

        return tokenId;
    }

    /**
     * @dev 解绑并转移NFC卡片NFT所有权
     * @param nfcUID NFC卡片UID
     * @param newOwner 新的所有者地址
     * @param ownerSignature 拥有者签名 (用于验证授权)
     */
    function unbindAndTransferCard(
        string memory nfcUID,
        address newOwner,
        bytes memory ownerSignature
    ) external nonReentrant {
        require(newOwner != address(0), "Invalid new owner address");

        uint256 tokenId = nfcToTokenId[nfcUID];
        require(tokenId != 0, "NFC not found");
        require(_ownerOf(tokenId) != address(0), "Card already burned");

        CardNFT storage card = cardNFTs[tokenId];
        address cardOwner = ownerOf(tokenId);

        // 验证调用者必须是卡片所有者
        require(msg.sender == cardOwner, "Only card owner can transfer");

        // 验证签名 (确保是私钥所有者授权)
        require(
            _verifyOwnerSignature(
                cardOwner,
                nfcUID,
                "transfer",
                ownerSignature
            ),
            "Invalid signature"
        );

        // 清除NFC映射关系 (解绑)
        delete nfcToTokenId[nfcUID];

        // 更新卡片状态为非激活
        card.isActive = false;
        card.boundWallet = address(0);

        // 转移NFT所有权
        _transfer(cardOwner, newOwner, tokenId);

        // 记录所有权变更
        _recordOwnershipChange(
            tokenId,
            cardOwner,
            newOwner,
            "transfer_after_unbind"
        );

        emit CardUnbound(tokenId, nfcUID, cardOwner, false);
        emit CardTransferred(tokenId, nfcUID, cardOwner, newOwner);
    }

    /**
     * @dev 解绑并销毁NFC卡片NFT
     * @param nfcUID NFC卡片UID
     * @param ownerSignature 拥有者签名 (用于验证授权)
     */
    function unbindAndBurnCard(
        string memory nfcUID,
        bytes memory ownerSignature
    ) external nonReentrant {
        uint256 tokenId = nfcToTokenId[nfcUID];
        require(tokenId != 0, "NFC not found");
        require(_ownerOf(tokenId) != address(0), "Card already burned");

        CardNFT storage card = cardNFTs[tokenId];
        address cardOwner = ownerOf(tokenId);

        // 验证调用者必须是卡片所有者
        require(msg.sender == cardOwner, "Only card owner can burn");

        // 验证签名 (确保是私钥所有者授权)
        require(
            _verifyOwnerSignature(cardOwner, nfcUID, "burn", ownerSignature),
            "Invalid signature"
        );

        // 从拥有者的卡片列表中移除
        _removeCardFromWallet(cardOwner, tokenId);

        // 记录所有权结束
        _recordOwnershipChange(
            tokenId,
            cardOwner,
            address(0),
            "burn_after_unbind"
        );

        // 清除映射关系
        delete nfcToTokenId[nfcUID];

        emit CardUnbound(tokenId, nfcUID, cardOwner, true);

        // 销毁NFT
        _burn(tokenId);
    }

    /**
     * @dev 卡片社交交互功能
     * @param myNfcUID 我的NFC卡片UID
     * @param targetNfcUID 目标NFC卡片UID
     * @param interactionType 交互类型 ("battle", "trade", "social")
     */
    function interactWithCard(
        string memory myNfcUID,
        string memory targetNfcUID,
        string memory interactionType
    ) external nonReentrant {
        uint256 myTokenId = nfcToTokenId[myNfcUID];
        uint256 targetTokenId = nfcToTokenId[targetNfcUID];

        require(myTokenId != 0, "My NFC not found");
        require(targetTokenId != 0, "Target NFC not found");
        require(myTokenId != targetTokenId, "Cannot interact with same card");

        CardNFT storage myCard = cardNFTs[myTokenId];
        CardNFT storage targetCard = cardNFTs[targetTokenId];

        // 验证我的卡片所有权
        require(ownerOf(myTokenId) == msg.sender, "Not owner of my card");

        // 验证两张卡片都是激活状态
        require(myCard.isActive, "My card is not active");
        require(targetCard.isActive, "Target card is not active");

        // 根据交互类型执行不同逻辑
        if (keccak256(bytes(interactionType)) == keccak256(bytes("battle"))) {
            _handleBattleInteraction(myTokenId, targetTokenId);
        } else if (
            keccak256(bytes(interactionType)) == keccak256(bytes("social"))
        ) {
            _handleSocialInteraction(myTokenId, targetTokenId);
        }

        emit CardsInteracted(
            myTokenId,
            targetTokenId,
            msg.sender,
            interactionType
        );
    }

    /**
     * @dev 处理对战交互
     */
    function _handleBattleInteraction(
        uint256 myTokenId,
        uint256 targetTokenId
    ) internal {
        CardNFT storage myCard = cardNFTs[myTokenId];
        CardNFT storage targetCard = cardNFTs[targetTokenId];

        // 增加对战次数
        myCard.battleCount++;
        targetCard.battleCount++;

        // 简单的对战逻辑 (基于等级和随机数)
        uint256 randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    myTokenId,
                    targetTokenId
                )
            )
        );

        bool myCardWins = (myCard.level + (randomSeed % 10)) >
            (targetCard.level + ((randomSeed >> 8) % 10));

        if (myCardWins) {
            myCard.winCount++;
            myCard.experience += 10;
            targetCard.experience += 3; // 失败者也获得少量经验
        } else {
            targetCard.winCount++;
            targetCard.experience += 10;
            myCard.experience += 3;
        }

        // 检查是否可以升级
        _checkLevelUp(myTokenId);
        _checkLevelUp(targetTokenId);
    }

    /**
     * @dev 处理社交交互
     */
    function _handleSocialInteraction(
        uint256 myTokenId,
        uint256 targetTokenId
    ) internal {
        CardNFT storage myCard = cardNFTs[myTokenId];
        CardNFT storage targetCard = cardNFTs[targetTokenId];

        // 社交交互给予少量经验值
        myCard.experience += 1;
        targetCard.experience += 1;

        // 检查是否可以升级
        _checkLevelUp(myTokenId);
        _checkLevelUp(targetTokenId);
    }

    /**
     * @dev 检查并处理卡片升级
     */
    function _checkLevelUp(uint256 tokenId) internal {
        CardNFT storage card = cardNFTs[tokenId];
        uint256 requiredExp = (card.level + 1) * 100; // 每级需要更多经验

        if (card.experience >= requiredExp) {
            uint256 oldLevel = card.level;
            card.level++;
            card.experience -= requiredExp; // 扣除升级所需经验

            emit CardLevelUp(tokenId, oldLevel, card.level);
        }
    }

    /**
     * @dev 绑定卡片到新钱包 (转移时调用)
     * @param tokenId NFT Token ID
     * @param newWallet 新钱包地址
     */
    function bindCardToWallet(uint256 tokenId, address newWallet) external {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        require(newWallet != address(0), "Invalid wallet address");
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "Unauthorized to bind"
        );

        CardNFT storage card = cardNFTs[tokenId];
        address oldWallet = card.boundWallet;

        // 更新绑定钱包
        card.boundWallet = newWallet;

        // 更新钱包卡片列表
        if (oldWallet != newWallet) {
            _removeCardFromWallet(oldWallet, tokenId);
            walletCards[newWallet].push(tokenId);
        }

        emit CardBound(tokenId, card.nfcUID, newWallet);
    }

    /**
     * @dev 记录对战结果并更新经验值
     * @param tokenId NFT Token ID
     * @param won 是否胜利
     * @param experienceGained 获得的经验值
     */
    function recordBattleResult(
        uint256 tokenId,
        bool won,
        uint256 experienceGained
    ) external onlyAuthorizedMinter {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        require(!frozenCards[tokenId], "Card is frozen");

        CardNFT storage card = cardNFTs[tokenId];

        // 更新战斗统计
        card.battleCount++;
        if (won) {
            card.winCount++;
        }

        // 增加经验值
        uint256 oldLevel = card.level;
        card.experience += experienceGained;

        // 检查是否升级 (每100经验值升1级)
        uint256 newLevel = (card.experience / 100) + 1;
        if (newLevel > card.level) {
            card.level = newLevel;
            emit CardLevelUp(tokenId, oldLevel, newLevel);
        }

        emit BattleResult(tokenId, won, experienceGained);
    }

    /**
     * @dev 冻结/解冻卡片
     * @param tokenId NFT Token ID
     * @param freeze 是否冻结
     */
    function freezeCard(uint256 tokenId, bool freeze) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");

        frozenCards[tokenId] = freeze;
        cardNFTs[tokenId].isActive = !freeze;

        emit CardFrozen(tokenId, cardNFTs[tokenId].nfcUID, freeze);
    }

    /**
     * @dev 获取卡片详细信息
     * @param tokenId NFT Token ID
     * @return 卡片信息结构
     */
    function getCardInfo(
        uint256 tokenId
    ) external view returns (CardNFT memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        return cardNFTs[tokenId];
    }

    /**
     * @dev 获取钱包的所有卡片
     * @param wallet 钱包地址
     * @return 卡片Token ID数组
     */
    function getWalletCards(
        address wallet
    ) external view returns (uint256[] memory) {
        return walletCards[wallet];
    }

    /**
     * @dev 根据NFC UID获取Token ID
     * @param nfcUID NFC UID
     * @return Token ID (0表示不存在)
     */
    function getTokenIdByNFC(
        string memory nfcUID
    ) external view returns (uint256) {
        return nfcToTokenId[nfcUID];
    }

    /**
     * @dev 检查卡片是否可以进行战斗
     * @param tokenId NFT Token ID
     * @return 是否可以战斗
     */
    function isCardBattleReady(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        if (frozenCards[tokenId]) return false;
        return cardNFTs[tokenId].isActive;
    }

    /**
     * @dev 获取卡片历史所有者
     * @param tokenId NFT Token ID
     * @return 历史所有者记录数组
     */
    function getCardOwnershipHistory(
        uint256 tokenId
    ) external view returns (OwnershipRecord[] memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        return cardOwnershipHistory[tokenId];
    }

    /**
     * @dev 获取卡片所有者数量
     * @param tokenId NFT Token ID
     * @return 历史所有者数量
     */
    function getCardOwnershipCount(
        uint256 tokenId
    ) external view returns (uint256) {
        return cardOwnershipCount[tokenId];
    }

    /**
     * @dev 获取卡片当前所有者信息
     * @param tokenId NFT Token ID
     * @return 当前所有者记录
     */
    function getCurrentOwnershipInfo(
        uint256 tokenId
    ) external view returns (OwnershipRecord memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        OwnershipRecord[] memory history = cardOwnershipHistory[tokenId];
        require(history.length > 0, "No ownership history");

        // 返回最后一条记录（当前所有者）
        return history[history.length - 1];
    }

    /**
     * @dev 检查地址是否曾经拥有过该卡片
     * @param tokenId NFT Token ID
     * @param owner 要检查的地址
     * @return 是否曾经拥有过
     */
    function hasOwnedCard(
        uint256 tokenId,
        address owner
    ) external view returns (bool) {
        OwnershipRecord[] memory history = cardOwnershipHistory[tokenId];

        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].owner == owner) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev 获取地址拥有某卡片的总时长（秒）
     * @param tokenId NFT Token ID
     * @param owner 所有者地址
     * @return 总拥有时长
     */
    function getOwnershipDuration(
        uint256 tokenId,
        address owner
    ) external view returns (uint256) {
        OwnershipRecord[] memory history = cardOwnershipHistory[tokenId];
        uint256 totalDuration = 0;

        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].owner == owner) {
                uint256 endTime = history[i].toTimestamp == 0
                    ? block.timestamp
                    : history[i].toTimestamp;
                totalDuration += endTime - history[i].fromTimestamp;
            }
        }

        return totalDuration;
    }

    /**
     * @dev 批量获取多个卡片的当前所有者
     * @param tokenIds Token ID数组
     * @return 对应的所有者地址数组
     */
    function batchGetCurrentOwners(
        uint256[] memory tokenIds
    ) external view returns (address[] memory) {
        address[] memory owners = new address[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            owners[i] = _ownerOf(tokenIds[i]);
        }

        return owners;
    }

    // 内部函数

    /**
     * @dev 记录所有权变更
     * @param tokenId Token ID
     * @param from 原所有者 (address(0) 表示铸造)
     * @param to 新所有者 (address(0) 表示销毁)
     * @param reason 转移原因
     */
    function _recordOwnershipChange(
        uint256 tokenId,
        address from,
        address to,
        string memory reason
    ) internal {
        // 如果不是铸造，需要结束上一个所有者的记录
        if (from != address(0) && cardOwnershipHistory[tokenId].length > 0) {
            uint256 lastIndex = cardOwnershipHistory[tokenId].length - 1;
            cardOwnershipHistory[tokenId][lastIndex].toTimestamp = block
                .timestamp;
        }

        // 如果不是销毁，需要添加新的所有者记录
        if (to != address(0)) {
            cardOwnershipHistory[tokenId].push(
                OwnershipRecord({
                    owner: to,
                    fromTimestamp: block.timestamp,
                    toTimestamp: 0, // 0表示当前所有者
                    transferReason: reason
                })
            );

            cardOwnershipCount[tokenId]++;
        }

        emit OwnershipTransferred(tokenId, from, to, reason);
    }

    /**
     * @dev 从钱包卡片列表中移除指定卡片
     */
    function _removeCardFromWallet(address wallet, uint256 tokenId) internal {
        uint256[] storage cards = walletCards[wallet];
        for (uint256 i = 0; i < cards.length; i++) {
            if (cards[i] == tokenId) {
                cards[i] = cards[cards.length - 1];
                cards.pop();
                break;
            }
        }
    }

    /**
     * @dev 检查是否为授权铸造者
     */
    function _isAuthorizedMinter(address minter) internal view returns (bool) {
        return
            authorizedMinters[Strings.toHexString(uint160(minter), 20)] ||
            minter == owner();
    }

    /**
     * @dev 验证所有者签名
     * @param owner 卡片所有者地址
     * @param nfcUID NFC卡片UID
     * @param action 操作类型 ("transfer" 或 "burn")
     * @param signature 签名数据
     * @return 签名是否有效
     */
    function _verifyOwnerSignature(
        address owner,
        string memory nfcUID,
        string memory action,
        bytes memory signature
    ) internal view returns (bool) {
        // 构造签名消息
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                "32",
                keccak256(
                    abi.encodePacked(owner, nfcUID, action, block.chainid)
                )
            )
        );

        // 恢复签名者地址
        address signer = _recoverSigner(messageHash, signature);

        return signer == owner;
    }

    /**
     * @dev 从签名中恢复签名者地址
     * @param messageHash 消息哈希
     * @param signature 签名数据
     * @return 签名者地址
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

        if (v < 27) {
            v += 27;
        }

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
            cardNFTs[tokenId].boundWallet = to;
            _removeCardFromWallet(from, tokenId);
            walletCards[to].push(tokenId);
            emit CardBound(tokenId, cardNFTs[tokenId].nfcUID, to);
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

        string memory baseURI = _baseURI();
        if (bytes(cardNFTs[tokenId].metadata).length > 0) {
            return cardNFTs[tokenId].metadata;
        }

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
        require(_isAuthorizedMinter(msg.sender), "Not authorized minter");
        _;
    }

    // 管理员函数

    /**
     * @dev 设置卡片模板
     */
    function setCardTemplate(
        string memory seriesId,
        string memory artwork,
        Rarity rarity,
        uint256 baseAttack,
        uint256 baseDefense,
        uint256 baseSpeed
    ) external onlyOwner {
        cardTemplates[seriesId] = CardTemplate({
            seriesId: seriesId,
            artwork: artwork,
            rarity: rarity,
            baseAttack: baseAttack,
            baseDefense: baseDefense,
            baseSpeed: baseSpeed,
            isActive: true
        });
    }

    /**
     * @dev 设置授权铸造者
     */
    function setAuthorizedMinter(
        string memory minterAddress,
        bool authorized
    ) external onlyOwner {
        authorizedMinters[minterAddress] = authorized;
    }

    /**
     * @dev 设置基础URI
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    /**
     * @dev 紧急暂停卡片系列
     */
    function pauseCardSeries(string memory seriesId) external onlyOwner {
        cardTemplates[seriesId].isActive = false;
    }

    /**
     * @dev 启用卡片系列
     */
    function unpauseCardSeries(string memory seriesId) external onlyOwner {
        cardTemplates[seriesId].isActive = true;
    }
}
