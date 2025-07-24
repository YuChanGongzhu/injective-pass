# NFC钱包系统与Injective EVM集成方案

## 概述

本系统已完成与Injective EVM的集成，支持使用标准的ethers.js库与区块链进行交互。系统实现了空白卡自动创建账户、多卡片绑定管理、私钥签名验证、卡片社交交互等功能。

## 技术架构

### 后端技术栈
- **NestJS** - 后端框架
- **ethers.js v6.8.1** - 区块链交互
- **@injectivelabs/sdk-ts** - Injective专用功能
- **PostgreSQL + Prisma** - 数据存储
- **TypeScript** - 开发语言

### 网络配置
- **测试网RPC**: `https://k8s.testnet.json-rpc.injective.network/`
- **Chain ID**: `1439`
- **区块浏览器**: `https://testnet.blockscout.injective.network/`
- **原生代币**: INJ

## 核心功能

### 1. 空白卡自动创建账户
当用户使用空白NFC卡时，系统自动：
- 检测未绑定的NFC卡
- 生成新的以太坊兼容账户
- 将NFC与账户绑定
- 记录绑定历史

```typescript
// 后端服务示例
async detectAndBindBlankCard(nfcUID: string, newWalletAddress: string): Promise<boolean>
```

### 2. 私钥签名验证
所有关键操作都需要私钥签名验证：
- NFC解绑操作
- NFT转移操作
- NFT销毁操作

```typescript
// 签名验证逻辑
function _verifyOwnerSignature(
    address owner,
    string memory nfcUID,
    string memory action,
    bytes memory signature
) internal view returns (bool)
```

### 3. 多卡片绑定管理
- 一个账户可以绑定多张NFC卡
- 支持查询账户的所有活跃卡片
- 提供卡片统计信息

### 4. 社交交互功能
- 卡片对战系统
- 社交交流功能
- 经验值和升级机制
- 真实世界互动体验

### 5. NFT生命周期管理
- 铸造NFC卡片NFT
- 解绑时可选择转移或销毁
- 完整的所有权历史追踪

## 合约架构

### NFCWalletRegistry.sol
负责NFC卡片与钱包地址的绑定关系管理：

```solidity
// 主要功能
function detectAndBindBlankCard(string memory nfcUID, address newWalletAddress) external returns (bool)
function unbindNFCWallet(string memory nfcUID, bytes memory ownerSignature) external
function isBlankCard(string memory nfcUID) external view returns (bool)
function getWalletCardStats(address walletAddress) external view returns (uint256, uint256, uint256)
```

### NFCCardNFT.sol
负责NFC卡片NFT的生命周期管理：

```solidity
// 主要功能
function mintCardNFT(string memory nfcUID, string memory seriesId, address initialOwner) external returns (uint256)
function unbindAndTransferCard(string memory nfcUID, address newOwner, bytes memory ownerSignature) external
function unbindAndBurnCard(string memory nfcUID, bytes memory ownerSignature) external
function interactWithCard(string memory myNfcUID, string memory targetNfcUID, string memory interactionType) external
```

## 前端集成

### MetaMask连接
使用ethers.js v6连接到Injective EVM：

```javascript
import { ethers } from 'ethers';

const INJECTIVE_EVM_CONFIG = {
    chainId: '0x59f', // 1439
    chainName: 'Injective EVM Testnet',
    rpcUrls: ['https://k8s.testnet.json-rpc.injective.network/'],
    nativeCurrency: {
        name: 'Injective',
        symbol: 'INJ',
        decimals: 18,
    },
    blockExplorerUrls: ['https://testnet.blockscout.injective.network/'],
};

// 添加网络到MetaMask
await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [INJECTIVE_EVM_CONFIG],
});
```

### 合约交互示例
```javascript
// 创建签名
async function createUnbindSignature(nfcUID, action = 'unbind') {
    const address = await signer.getAddress();
    const chainId = await provider.getNetwork().then(n => n.chainId);
    
    const message = ethers.solidityPackedKeccak256(
        ['address', 'string', 'string', 'uint256'],
        [address, nfcUID, action, chainId]
    );
    
    return await signer.signMessage(ethers.getBytes(message));
}

// 卡片社交交互
await nftCardContract.interactWithCard(
    'my-nfc-uid',
    'target-nfc-uid',
    'battle'
);
```

## 环境配置

### 环境变量
```bash
# Injective EVM配置
INJECTIVE_RPC_URL="https://k8s.testnet.json-rpc.injective.network/"
INJECTIVE_CHAIN_ID="1439"

# 合约地址
NFC_REGISTRY_ADDRESS="0x..."
NFT_CARD_CONTRACT_ADDRESS="0x..."
DOMAIN_REGISTRY_ADDRESS="0x..."

# 后端服务私钥
CONTRACT_PRIVATE_KEY="0x..."

# 区块浏览器
BLOCK_EXPLORER_URL="https://testnet.blockscout.injective.network/"
```

### 依赖安装
```bash
npm install ethers@^6.8.1 @injectivelabs/sdk-ts
```

## 部署指南

### 1. 合约部署
使用Foundry部署到Injective EVM测试网：

```bash
# 编译合约
forge build

# 部署合约
forge script script/Deploy.s.sol --rpc-url https://k8s.testnet.json-rpc.injective.network/ --broadcast --verify
```

### 2. 后端配置
1. 更新环境变量中的合约地址
2. 确保私钥有足够的测试网INJ代币
3. 启动后端服务

### 3. 前端配置
1. 更新合约地址常量
2. 确保ABI与合约保持同步
3. 测试MetaMask连接

## API接口

### NFC管理
- `POST /nfc/register` - 注册NFC卡片
- `GET /nfc/status/:uid` - 查询卡片状态
- `POST /nfc/unbind` - 解绑卡片
- `GET /nfc/stats/:address` - 获取钱包统计

### NFT管理
- `POST /nft/mint` - 铸造卡片NFT
- `POST /nft/interact` - 卡片社交交互
- `POST /nft/transfer` - 转移NFT所有权
- `POST /nft/burn` - 销毁NFT

## 安全特性

### 1. 签名验证
- 所有关键操作需要私钥签名
- 防止未授权的解绑操作
- 支持链ID验证防重放攻击

### 2. 权限控制
- 合约Owner权限管理
- 授权操作者机制
- 紧急操作功能

### 3. 数据完整性
- 完整的历史记录追踪
- 状态一致性验证
- 事件日志记录

## 测试指南

### 1. 本地测试
```bash
# 启动本地Foundry节点
anvil

# 运行测试
forge test
```

### 2. 测试网测试
1. 从水龙头获取测试网INJ代币
2. 部署合约到测试网
3. 使用测试数据验证功能

## 故障排查

### 常见问题
1. **RPC连接失败**: 检查网络配置和RPC URL
2. **Gas费用不足**: 确保账户有足够的INJ代币
3. **签名验证失败**: 确认签名格式和链ID正确
4. **合约调用失败**: 检查ABI和合约地址

### 日志调试
后端服务提供详细的日志输出，包括：
- 合约初始化状态
- 交易哈希和确认状态
- 错误信息和堆栈跟踪

## 性能优化

### 1. 交易优化
- 合理设置Gas限制
- 批量操作减少交易次数
- 使用事件监听提高响应速度

### 2. 数据缓存
- 缓存常用的合约查询结果
- 使用Redis缓存用户状态
- 定期同步链上数据

## 升级路径

### 1. 合约升级
- 使用代理模式支持逻辑升级
- 保持存储布局兼容性
- 提供迁移脚本

### 2. 功能扩展
- 添加新的社交功能
- 支持跨链桥接
- 集成更多DeFi协议

---

## 参考资料

- [Injective EVM文档](https://docs.injective.network/developers-evm/)
- [ethers.js文档](https://docs.ethers.org/)
- [MetaMask开发者文档](https://docs.metamask.io/)
- [Foundry工具文档](https://book.getfoundry.sh/) 