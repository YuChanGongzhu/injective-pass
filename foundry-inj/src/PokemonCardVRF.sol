// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract PokemonCardVRF is ERC721, Ownable, VRFConsumerBaseV2Plus {
    using Strings for uint256;

    // Chainlink VRF 配置
    IVRFCoordinatorV2Plus private immutable i_vrfCoordinator;
    uint256 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;
    uint16 private immutable i_requestConfirmations;

    // 卡片属性结构
    struct Card {
        string name; // 宠物名称
        uint8 rarity; // 稀有度 (1=普通, 2=稀有, 3=史诗, 4=传说)
        uint8 element; // 属性类型 (1=火, 2=水, 3=草, 4=电, 5=超能力)
        uint16 attack; // 攻击力 (50-200)
        uint16 defense; // 防御力 (30-180)
        uint16 speed; // 速度 (20-150)
        uint256 birthTime; // 诞生时间
        bool revealed; // 是否已揭示
    }

    // 抽卡请求结构
    struct DrawRequest {
        address requester;
        uint8 numCards;
        bool fulfilled;
        uint256[] tokenIds;
    }

    // 宠物名称数组
    string[] private pokemonNames = [
        "Pikachu",
        "Charizard",
        "Blastoise",
        "Venusaur",
        "Gengar",
        "Alakazam",
        "Machamp",
        "Golem",
        "Lapras",
        "Snorlax",
        "Dragonite",
        "Mewtwo",
        "Mew",
        "Lucario",
        "Garchomp"
    ];

    // 状态变量
    mapping(uint256 => Card) public cards;
    mapping(uint256 => DrawRequest) public drawRequests; // requestId => DrawRequest
    mapping(address => uint256[]) public userPendingRequests; // 用户待处理的请求

    uint256 public totalSupply;
    uint256 public maxSupply = 10000;
    uint256 public mintPrice = 0.01 ether;

    // 事件
    event DrawRequested(
        address indexed requester,
        uint256 indexed requestId,
        uint8 numCards
    );
    event CardsDrawn(
        address indexed to,
        uint256 indexed requestId,
        uint256[] tokenIds
    );
    event CardRevealed(uint256 indexed tokenId, Card card);

    constructor(
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    )
        ERC721("Pokemon Cards VRF", "PKMN-VRF")
        Ownable(msg.sender)
        VRFConsumerBaseV2Plus(vrfCoordinator)
    {
        i_vrfCoordinator = IVRFCoordinatorV2Plus(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        i_requestConfirmations = requestConfirmations;
    }

    // 请求抽卡 - 异步操作
    function requestDrawCard() external payable returns (uint256 requestId) {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalSupply < maxSupply, "Max supply reached");

        // 请求随机数
        requestId = i_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyHash,
                subId: i_subscriptionId,
                requestConfirmations: i_requestConfirmations,
                callbackGasLimit: i_callbackGasLimit,
                numWords: 1, // 单张卡片需要1个随机数
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        // 记录抽卡请求
        drawRequests[requestId] = DrawRequest({
            requester: msg.sender,
            numCards: 1,
            fulfilled: false,
            tokenIds: new uint256[](0)
        });

        userPendingRequests[msg.sender].push(requestId);

        emit DrawRequested(msg.sender, requestId, 1);
        return requestId;
    }

    // 批量抽卡请求
    function requestDrawMultipleCards(
        uint8 numCards
    ) external payable returns (uint256 requestId) {
        require(numCards > 0 && numCards <= 10, "Invalid number of cards");
        require(msg.value >= mintPrice * numCards, "Insufficient payment");
        require(totalSupply + numCards <= maxSupply, "Exceeds max supply");

        // 请求随机数 - 每张卡片需要1个随机数
        requestId = i_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyHash,
                subId: i_subscriptionId,
                requestConfirmations: i_requestConfirmations,
                callbackGasLimit: i_callbackGasLimit,
                numWords: numCards,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        // 记录抽卡请求
        drawRequests[requestId] = DrawRequest({
            requester: msg.sender,
            numCards: numCards,
            fulfilled: false,
            tokenIds: new uint256[](0)
        });

        userPendingRequests[msg.sender].push(requestId);

        emit DrawRequested(msg.sender, requestId, numCards);
        return requestId;
    }

    // Chainlink VRF 回调函数
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        DrawRequest storage request = drawRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        require(request.requester != address(0), "Request not found");

        uint256[] memory tokenIds = new uint256[](request.numCards);

        // 为每张卡片生成属性并铸造
        for (uint8 i = 0; i < request.numCards; i++) {
            uint256 tokenId = totalSupply + 1;
            totalSupply++;

            // 使用VRF返回的随机数生成卡片属性
            Card memory newCard = _generateCardFromRandomness(randomWords[i]);
            cards[tokenId] = newCard;

            // 铸造NFT给请求者
            _safeMint(request.requester, tokenId);
            tokenIds[i] = tokenId;

            emit CardRevealed(tokenId, newCard);
        }

        // 更新请求状态
        request.fulfilled = true;
        request.tokenIds = tokenIds;

        // 从用户待处理请求中移除
        _removeUserPendingRequest(request.requester, requestId);

        emit CardsDrawn(request.requester, requestId, tokenIds);
    }

    // 使用真正的随机数生成卡片属性
    function _generateCardFromRandomness(
        uint256 randomness
    ) private view returns (Card memory) {
        // 使用随机数的不同部分来生成不同属性
        uint256 rarityRoll = (randomness >> 0) % 100;
        uint256 nameIndex = (randomness >> 8) % pokemonNames.length;
        uint256 elementSeed = (randomness >> 16) % 5;
        uint256 attackSeed = (randomness >> 24) % 100;
        uint256 defenseSeed = (randomness >> 32) % 100;
        uint256 speedSeed = (randomness >> 40) % 100;

        // 确定稀有度
        uint8 rarity = _determineRarity(rarityRoll);

        // 选择宠物名称
        string memory name = pokemonNames[nameIndex];

        // 根据稀有度调整属性基础值
        uint256 baseModifier = _getRarityModifier(rarity);

        // 生成属性值
        uint8 element = uint8(elementSeed + 1);
        uint16 attack = uint16(50 + attackSeed + baseModifier);
        uint16 defense = uint16(30 + defenseSeed + baseModifier);
        uint16 speed = uint16(20 + speedSeed + baseModifier);

        return
            Card({
                name: name,
                rarity: rarity,
                element: element,
                attack: attack,
                defense: defense,
                speed: speed,
                birthTime: block.timestamp,
                revealed: true
            });
    }

    // 确定稀有度 - 与之前相同的概率分布
    function _determineRarity(uint256 roll) private pure returns (uint8) {
        if (roll < 60) return 1; // 普通 60%
        if (roll < 85) return 2; // 稀有 25%
        if (roll < 97) return 3; // 史诗 12%
        return 4; // 传说 3%
    }

    // 获取稀有度加成
    function _getRarityModifier(uint8 rarity) private pure returns (uint256) {
        if (rarity == 1) return 0; // 普通
        if (rarity == 2) return 20; // 稀有
        if (rarity == 3) return 50; // 史诗
        return 100; // 传说
    }

    // 移除用户待处理请求
    function _removeUserPendingRequest(
        address user,
        uint256 requestId
    ) private {
        uint256[] storage requests = userPendingRequests[user];
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i] == requestId) {
                requests[i] = requests[requests.length - 1];
                requests.pop();
                break;
            }
        }
    }

    // 查询函数
    function getCard(uint256 tokenId) external view returns (Card memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        return cards[tokenId];
    }

    function getDrawRequest(
        uint256 requestId
    ) external view returns (DrawRequest memory) {
        return drawRequests[requestId];
    }

    function getUserPendingRequests(
        address user
    ) external view returns (uint256[] memory) {
        return userPendingRequests[user];
    }

    function getElementName(uint8 element) public pure returns (string memory) {
        if (element == 1) return "Fire";
        if (element == 2) return "Water";
        if (element == 3) return "Grass";
        if (element == 4) return "Electric";
        if (element == 5) return "Psychic";
        return "Unknown";
    }

    function getRarityName(uint8 rarity) public pure returns (string memory) {
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Rare";
        if (rarity == 3) return "Epic";
        if (rarity == 4) return "Legendary";
        return "Unknown";
    }

    function getCardPower(uint256 tokenId) external view returns (uint256) {
        Card memory card = cards[tokenId];
        return
            uint256(card.attack) + uint256(card.defense) + uint256(card.speed);
    }

    // Token URI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");

        Card memory card = cards[tokenId];

        return
            string(
                abi.encodePacked(
                    "https://api.pokemoncards.com/metadata/",
                    tokenId.toString(),
                    "_rarity_",
                    uint256(card.rarity).toString(),
                    ".json"
                )
            );
    }

    // 管理员功能
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
    }

    function setMaxSupply(uint256 _newMaxSupply) external onlyOwner {
        require(
            _newMaxSupply >= totalSupply,
            "Cannot set below current supply"
        );
        maxSupply = _newMaxSupply;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // 紧急情况下取消未完成的请求（需要谨慎使用）
    function emergencyCancelRequest(uint256 requestId) external onlyOwner {
        DrawRequest storage request = drawRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        require(request.requester != address(0), "Request not found");

        // 退款给用户
        uint256 refundAmount = mintPrice * request.numCards;
        payable(request.requester).transfer(refundAmount);

        // 清理请求数据
        delete drawRequests[requestId];
        _removeUserPendingRequest(request.requester, requestId);
    }

    // VRF 配置查询函数
    function getVRFConfig()
        external
        view
        returns (
            address vrfCoordinator,
            uint256 subscriptionId,
            bytes32 keyHash,
            uint32 callbackGasLimit,
            uint16 requestConfirmations
        )
    {
        return (
            address(i_vrfCoordinator),
            i_subscriptionId,
            i_keyHash,
            i_callbackGasLimit,
            i_requestConfirmations
        );
    }
}
