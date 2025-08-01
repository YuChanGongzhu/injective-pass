# 社交抽卡系统合约部署总结

## 部署信息

**部署时间**: 2025年7月30日
**网络**: Injective EVM 测试网
**RPC URL**: https://k8s.testnet.json-rpc.injective.network/
**部署账户**: 0x1dd50ffF32Ecde6694e56C5bBfE902Fcbc8d2441 (injMain)

## 已部署合约地址

### 1. NFCWalletRegistry
- **合约地址**: `0x8295361432506D1567FEd19E005343E6367f800a`
- **交易哈希**: `0xe9fb2d5695273d67bfca8873275c0f9751b4c2f4eafb09562e16abcd88994c52`
- **功能**: NFC卡片与钱包地址绑定注册

### 2. INJDomainNFT  
- **合约地址**: `0x9c3004523A9e558A13298dc8D9a4BfB78b1f3930`
- **交易哈希**: `0x56954fb73177c46cec6571d64a007f3d210f7770543c06a540924b60778eb951`
- **功能**: Injective 域名 NFT 系统

### 3. CatNFT (社交抽卡版本 - 重新部署)
- **合约地址**: `0x10fd6cC8d9272caC010224A93e1FA00Ce291E6D8`
- **交易哈希**: `0x8fd89ca0de50e6a8e209483ef697a05271688ee72f20490e6121d5b7553f1413`
- **功能**: 社交抽卡小猫 NFT 系统（分离版本）
- **构造函数参数**: NFCWalletRegistry 地址 (0x8295361432506D1567FEd19E005343E6367f800a)
- **部署日期**: 2025年7月31日
- **重要更新**: 
  - 分离社交互动和抽卡功能
  - 移除小猫名称唯一性限制
  - 新增抽卡次数管理系统

## 社交抽卡机制特性（v2.0 更新）

### 新的工作流程
1. **社交互动阶段**: 用户通过 `socialInteraction()` 函数与其他用户的NFC进行互动，获取抽卡次数
2. **抽卡阶段**: 用户使用 `drawCatNFTWithTickets()` 函数消耗抽卡次数来获得小猫NFT

### 核心变更
1. **功能分离**: 
   - `socialInteraction()` - 仅负责社交互动和增加抽卡次数
   - `drawCatNFTWithTickets()` - 消耗抽卡次数获得NFT
   - 移除了原有的 `socialDrawCatNFT()` 合并功能

2. **名称系统优化**:
   - 移除小猫名称全局唯一性限制
   - 允许重复的小猫名称
   - 简化命名流程

3. **抽卡次数管理**:
   - `drawCounts` - 跟踪可用抽卡次数
   - `totalDrawsUsed` - 跟踪已使用抽卡次数
   - `socialInteractionReward` - 可配置的互动奖励

### 新增功能
1. **社交互动**: 用户需要贴其他已注册用户的 NFC 卡片来获取抽卡次数
2. **抽卡次数积累**: 用户可以积累多次抽卡机会，选择合适时机使用
3. **防女巫攻击**: 每对 NFC 只能互动一次，防止刷抽卡次数
4. **社交奖励**: 基于已使用抽卡次数提升高稀有度概率
5. **双向记录**: 互动记录双向存储，增强社交连接

### 管理员功能
1. **抽卡次数管理**: `addDrawTickets()` 和 `batchAddDrawTickets()`
2. **互动奖励配置**: `setSocialInteractionReward()`
3. **查询功能**: `getAvailableDrawCount()`, `getTotalDrawsUsed()`, `getDrawStats()`

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

- **NFCWalletRegistry**: https://testnet.blockscout.injective.network/address/0x8295361432506D1567FEd19E005343E6367f800a
- **INJDomainNFT**: https://testnet.blockscout.injective.network/address/0x9c3004523A9e558A13298dc8D9a4BfB78b1f3930
- **CatNFT**: https://testnet.blockscout.injective.network/address/0x18b4748eaE049Ed46988c6f9c6a782E08059ABa8

## 2025年7月30日更新

### 最新部署结果
- ✅ 所有合约已重新部署到最新版本
- ✅ 合约地址已更新到 `nfc-wallet-backend/.env` 
- ✅ ABI 文件已复制到 `nfc-wallet-backend/src/contracts/abis/`
- ✅ 创建了 `.env.example` 模板文件供开发者参考
- ✅ 配置了 `.gitignore` 文件确保敏感信息安全

### 测试验证状态
- ✅ NFCWalletRegistry 和 INJDomainNFT 测试全部通过
- ✅ MIN_DOMAIN_LENGTH 已设置为 1（支持单字符域名后缀）
- ✅ 域名自动添加 "advx-" 前缀功能正常

### 后端集成准备
- 合约 ABI 文件位置：`nfc-wallet-backend/src/contracts/abis/`
- 合约地址配置：通过环境变量 `nfc-wallet-backend/.env`
- 环境变量模板：`nfc-wallet-backend/.env.example`

### 安全配置
- ✅ `.env` 文件已添加到 `.gitignore`，不会提交到 GitHub
- ✅ 提供了 `.env.example` 模板文件，隐藏敏感信息
- ✅ 私钥和合约地址通过环境变量管理

## 重要说明

1. **社交抽卡是主要功能**: 传统的 `drawCatNFT` 方法仍然保留但主要用于测试
2. **NFC 依赖**: CatNFT 合约依赖 NFCWalletRegistry 验证 NFC 绑定状态
3. **授权机制**: 需要将后端服务地址添加为授权操作者才能调用社交抽卡
4. **费用设置**: 当前抽卡费用为 0.1 INJ，可通过管理员调整

---

**部署完成**: ✅ 所有合约已成功重新部署到 Injective EVM 测试网（2025年7月30日）
**状态**: 准备就绪，可进行后端集成和功能测试
