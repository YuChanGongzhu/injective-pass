# 社交抽卡系统合约部署总结

## 部署信息

**部署时间**: 2025年7月26日
**网络**: Injective EVM 测试网
**RPC URL**: https://k8s.testnet.json-rpc.injective.network/
**部署账户**: 0x1dd50ffF32Ecde6694e56C5bBfE902Fcbc8d2441 (injMain)

## 已部署合约地址

### 1. NFCWalletRegistry
- **合约地址**: `0x89E79D907712083F66F1E2926E70641D197Ce836`
- **交易哈希**: `0x8a846d53401424e4affcfa80c5bc670c52e30d49a1cca7574c503d93ca5e8434`
- **功能**: NFC卡片与钱包地址绑定注册

### 2. INJDomainNFT
- **合约地址**: `0x60d52a10a2Bd94Db6cd3e5A228816C2D4d2268AF`
- **交易哈希**: `0x8e08b9509160b437efe6104eb5eeeef9b875cad27addfa73a0736c4855975b25`
- **功能**: Injective 域名 NFT 系统

### 3. CatNFT (社交抽卡版本)
- **合约地址**: `0xd3A7A41e62C6586e852a4792C3b8bcCCA823cac4`
- **交易哈希**: `0x083cf0a0fdd060c5acf36c513b14ca1de069bcf62e87b04c3fc7cf333763ec4a`
- **功能**: 社交抽卡小猫 NFT 系统
- **构造函数参数**: NFCWalletRegistry 地址 (0x89E79D907712083F66F1E2926E70641D197Ce836)

## 社交抽卡机制特性

### 新增功能
1. **社交抽卡**: 用户需要贴其他已注册用户的 NFC 卡片才能抽卡
2. **防女巫攻击**: 每对 NFC 只能互动一次，防止刷抽卡次数
3. **社交奖励**: 基于互动次数提升高稀有度概率
4. **双向记录**: 互动记录双向存储，增强社交连接

### 概率机制
- **基础概率**: R(60%) > SR(30%) > SSR(9%) > UR(1%)
- **社交奖励**: 每次互动增加 0.5% 高稀有度概率
- **UR 概率**: 最大提升 25%
- **SSR 概率**: 最大提升 50%
- **SR 概率**: 最大提升 100%

### 安全特性
1. **授权操作者**: 只有授权地址可以调用社交抽卡
2. **重入保护**: 使用 ReentrancyGuard 防止重入攻击
3. **参数验证**: 严格验证 NFC UID 和用户输入
4. **互动限制**: 防止自己与自己互动

## 部署配置

### Gas 设置
- **Gas Price**: 160,000,000 wei
- **Gas Limit**: 
  - NFCWalletRegistry: 2,000,000
  - INJDomainNFT: 2,000,000
  - CatNFT: 3,000,000 (更大因为包含更多逻辑)

### 网络设置
- **Legacy 模式**: 启用 (--legacy)
- **广播**: 启用 (--broadcast)
- **账户**: injMain 密钥库账户

## 后续步骤

### 1. 后端集成
- [x] 更新 .env 文件中的合约地址
- [ ] 重新生成合约 ABI 文件
- [ ] 测试后端合约交互功能
- [ ] 验证社交抽卡 API 端点

### 2. 合约验证
- [ ] 在区块浏览器上验证合约源码
- [ ] 测试合约功能完整性
- [ ] 验证社交抽卡逻辑

### 3. 系统测试
- [ ] 端到端功能测试
- [ ] 社交抽卡流程测试
- [ ] 性能和安全测试

## 区块链浏览器链接

- **NFCWalletRegistry**: https://testnet.blockscout.injective.network/address/0x89E79D907712083F66F1E2926E70641D197Ce836
- **INJDomainNFT**: https://testnet.blockscout.injective.network/address/0x60d52a10a2Bd94Db6cd3e5A228816C2D4d2268AF
- **CatNFT**: https://testnet.blockscout.injective.network/address/0xd3A7A41e62C6586e852a4792C3b8bcCCA823cac4

## 重要说明

1. **社交抽卡是主要功能**: 传统的 `drawCatNFT` 方法仍然保留但主要用于测试
2. **NFC 依赖**: CatNFT 合约依赖 NFCWalletRegistry 验证 NFC 绑定状态
3. **授权机制**: 需要将后端服务地址添加为授权操作者才能调用社交抽卡
4. **费用设置**: 当前抽卡费用为 0.1 INJ，可通过管理员调整

---

**部署完成**: ✅ 所有合约已成功部署到 Injective EVM 测试网
**状态**: 等待后端集成和功能测试
