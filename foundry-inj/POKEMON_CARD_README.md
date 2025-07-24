# 宝可梦抽卡NFT合约

这是一个基于以太坊的宝可梦风格抽卡NFT合约，实现了随机属性生成和稀有度系统。用户可以通过支付ETH来抽取具有不同属性和稀有度的数字宠物卡片。

## 功能特点

### 🎮 核心游戏机制
- **随机抽卡**: 用户支付0.01 ETH即可抽取一张随机属性的宠物卡片
- **批量抽卡**: 支持一次性抽取多张卡片（最多10张）
- **稀有度系统**: 四种稀有度等级，不同概率出现
- **属性系统**: 五种元素属性和三种战斗属性

### 📊 稀有度分布
- **普通 (Common)**: 60% 概率，基础属性值
- **稀有 (Rare)**: 25% 概率，属性值 +20
- **史诗 (Epic)**: 12% 概率，属性值 +50  
- **传说 (Legendary)**: 3% 概率，属性值 +100

### ⚡ 属性类型
- **元素属性**: 火、水、草、电、超能力
- **战斗属性**: 攻击力(50-300)、防御力(30-280)、速度(20-250)

### 🎯 宠物名称
包含15种经典宝可梦名称：Pikachu、Charizard、Blastoise、Venusaur、Gengar、Alakazam、Machamp、Golem、Lapras、Snorlax、Dragonite、Mewtwo、Mew、Lucario、Garchomp

## 智能合约功能

### 用户功能
```solidity
// 抽取单张卡片
function drawCard() external payable returns (uint256)

// 批量抽卡
function drawMultipleCards(uint8 amount) external payable returns (uint256[] memory)

// 查看卡片信息
function getCard(uint256 tokenId) external view returns (Card memory)

// 计算卡片总战力
function getCardPower(uint256 tokenId) external view returns (uint256)
```

### 管理员功能
```solidity
// 设置抽卡价格
function setMintPrice(uint256 _newPrice) external onlyOwner

// 设置最大供应量
function setMaxSupply(uint256 _newMaxSupply) external onlyOwner

// 提取合约资金
function withdraw() external onlyOwner
```

## 部署和使用

### 1. 安装依赖
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. 编译合约
```bash
forge build
```

### 3. 运行测试
```bash
forge test
```

### 4. 部署合约
```bash
# 设置环境变量
export PRIVATE_KEY=your_private_key_here

# 部署到Injective EVM测试网
forge script script/DeployPokemonCard.s.sol --rpc-url https://k8s.testnet.json-rpc.injective.network/ --broadcast
```

## 前端集成示例

### Web3.js 示例
```javascript
// 抽卡函数
async function drawCard() {
    const contract = new web3.eth.Contract(abi, contractAddress);
    const accounts = await web3.eth.getAccounts();
    
    try {
        const result = await contract.methods.drawCard().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        });
        
        console.log('抽到卡片ID:', result.events.CardMinted.returnValues.tokenId);
        return result.events.CardMinted.returnValues;
    } catch (error) {
        console.error('抽卡失败:', error);
    }
}

// 获取卡片信息
async function getCardInfo(tokenId) {
    const contract = new web3.eth.Contract(abi, contractAddress);
    const card = await contract.methods.getCard(tokenId).call();
    
    return {
        name: card.name,
        rarity: card.rarity,
        element: card.element,
        attack: card.attack,
        defense: card.defense,
        speed: card.speed,
        power: parseInt(card.attack) + parseInt(card.defense) + parseInt(card.speed)
    };
}
```

### React组件示例
```jsx
import React, { useState } from 'react';
import Web3 from 'web3';

function PokemonCardGame() {
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState([]);

    const drawCard = async () => {
        setLoading(true);
        try {
            // 调用抽卡函数
            const result = await drawCard();
            const cardInfo = await getCardInfo(result.tokenId);
            setCards([...cards, cardInfo]);
        } catch (error) {
            alert('抽卡失败: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="pokemon-game">
            <h1>宝可梦抽卡游戏</h1>
            <button 
                onClick={drawCard} 
                disabled={loading}
                className="draw-button"
            >
                {loading ? '抽卡中...' : '抽卡 (0.01 ETH)'}
            </button>
            
            <div className="cards-grid">
                {cards.map((card, index) => (
                    <div key={index} className={`card rarity-${card.rarity}`}>
                        <h3>{card.name}</h3>
                        <p>稀有度: {['', '普通', '稀有', '史诗', '传说'][card.rarity]}</p>
                        <p>属性: {['', '火', '水', '草', '电', '超能力'][card.element]}</p>
                        <p>攻击力: {card.attack}</p>
                        <p>防御力: {card.defense}</p>
                        <p>速度: {card.speed}</p>
                        <p>总战力: {card.power}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

## 安全考虑

### 随机数生成
当前实现使用伪随机数生成，在生产环境中建议使用Chainlink VRF等更安全的随机数源。

### 访问控制
合约使用OpenZeppelin的Ownable模式保护管理员功能。

### 重入攻击防护
使用checks-effects-interactions模式防止重入攻击。

## 扩展功能建议

1. **交易系统**: 添加卡片交易功能
2. **战斗系统**: 实现卡片对战机制
3. **升级系统**: 允许合成和升级卡片
4. **公会系统**: 添加团队合作功能
5. **元数据服务**: 建立IPFS元数据存储
6. **稀有卡片**: 添加更多稀有度等级和特殊卡片

## Gas费用优化

- 批量抽卡比单独抽卡更节省gas费用
- 使用struct packing优化存储布局
- 合理使用view函数减少状态读取

## 许可证

MIT License - 详见LICENSE文件

## 联系信息

如有问题或建议，请通过GitHub Issues联系我们。 