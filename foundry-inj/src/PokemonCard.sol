// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PokemonCard is ERC721, Ownable {
    using Strings for uint256;

    // 卡片属性结构
    struct Card {
        string name; // 宠物名称
        uint8 rarity; // 稀有度 (1=普通, 2=稀有, 3=史诗, 4=传说)
        uint8 element; // 属性类型 (1=火, 2=水, 3=草, 4=电, 5=超能力)
        uint16 attack; // 攻击力 (50-200)
        uint16 defense; // 防御力 (30-180)
        uint16 speed; // 速度 (20-150)
        uint256 birthTime; // 诞生时间
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
    uint256 public totalSupply;
    uint256 public maxSupply = 10000;
    uint256 public mintPrice = 0.01 ether;

    // 随机数种子
    uint256 private nonce;

    // 事件
    event CardMinted(address indexed to, uint256 indexed tokenId, Card card);
    event CardRevealed(uint256 indexed tokenId, Card card);

    constructor() ERC721("Pokemon Cards", "PKMN") Ownable(msg.sender) {}

    // 主要的抽卡功能
    function drawCard() external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalSupply < maxSupply, "Max supply reached");

        uint256 tokenId = totalSupply + 1;
        totalSupply++;

        // 生成随机属性
        Card memory newCard = _generateRandomCard(tokenId);
        cards[tokenId] = newCard;

        // 铸造NFT
        _safeMint(msg.sender, tokenId);

        emit CardMinted(msg.sender, tokenId, newCard);
        return tokenId;
    }

    // 生成随机卡片属性
    function _generateRandomCard(
        uint256 tokenId
    ) private returns (Card memory) {
        // 生成伪随机数
        uint256 randomness = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    nonce++,
                    tokenId
                )
            )
        );

        // 确定稀有度 (概率: 普通60%, 稀有25%, 史诗12%, 传说3%)
        uint8 rarity = _determineRarity(randomness % 100);

        // 选择宠物名称
        string memory name = pokemonNames[randomness % pokemonNames.length];

        // 根据稀有度调整属性基础值
        uint256 baseModifier = _getRarityModifier(rarity);

        // 生成属性值
        uint8 element = uint8((randomness >> 8) % 5) + 1;
        uint16 attack = uint16(50 + ((randomness >> 16) % 100) + baseModifier);
        uint16 defense = uint16(30 + ((randomness >> 24) % 100) + baseModifier);
        uint16 speed = uint16(20 + ((randomness >> 32) % 100) + baseModifier);

        return
            Card({
                name: name,
                rarity: rarity,
                element: element,
                attack: attack,
                defense: defense,
                speed: speed,
                birthTime: block.timestamp
            });
    }

    // 确定稀有度
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

    // 获取卡片信息
    function getCard(uint256 tokenId) external view returns (Card memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");
        return cards[tokenId];
    }

    // 获取属性类型名称
    function getElementName(uint8 element) public pure returns (string memory) {
        if (element == 1) return "Fire";
        if (element == 2) return "Water";
        if (element == 3) return "Grass";
        if (element == 4) return "Electric";
        if (element == 5) return "Psychic";
        return "Unknown";
    }

    // 获取稀有度名称
    function getRarityName(uint8 rarity) public pure returns (string memory) {
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Rare";
        if (rarity == 3) return "Epic";
        if (rarity == 4) return "Legendary";
        return "Unknown";
    }

    // 计算卡片总战力
    function getCardPower(uint256 tokenId) external view returns (uint256) {
        Card memory card = cards[tokenId];
        return
            uint256(card.attack) + uint256(card.defense) + uint256(card.speed);
    }

    // Token URI for metadata
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Card does not exist");

        Card memory card = cards[tokenId];

        // 这里应该返回指向JSON元数据的URI
        // 为了演示，我们返回一个包含稀有度信息的字符串
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

    // 批量抽卡功能
    function drawMultipleCards(
        uint8 amount
    ) external payable returns (uint256[] memory) {
        require(amount > 0 && amount <= 10, "Invalid amount");
        require(msg.value >= mintPrice * amount, "Insufficient payment");
        require(totalSupply + amount <= maxSupply, "Exceeds max supply");

        uint256[] memory tokenIds = new uint256[](amount);

        for (uint8 i = 0; i < amount; i++) {
            uint256 tokenId = totalSupply + 1;
            totalSupply++;

            Card memory newCard = _generateRandomCard(tokenId);
            cards[tokenId] = newCard;

            _safeMint(msg.sender, tokenId);
            tokenIds[i] = tokenId;

            emit CardMinted(msg.sender, tokenId, newCard);
        }

        return tokenIds;
    }
}
