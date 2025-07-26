# 🧪 NFC 钱包系统测试计划

## 📋 测试环境配置
- **区块链网络**: Injective EVM Testnet
- **后端服务**: http://localhost:3000
- **数据库**: PostgreSQL
- **合约地址**: 
  - NFCWalletRegistry: 0x775D0D30dc990b8068768CCE58ad47ff167700cf
  - INJDomainNFT: 0xf978481B334ba5572717c528ba730EF4A12DA191
  - CatNFT: 0x049B99fc53a39e8eF6DC725EBA32f0FCd7053c22

## 🔄 完整业务流程测试

### 1️⃣ NFC 钱包注册测试
**目标**: 测试新钱包创建和初始资金发送
```bash
# 测试请求
POST /nfc/register
{
  "uid": "TEST001"
}

# 预期响应
{
  "success": true,
  "address": "0x...",
  "privateKey": "0x...",
  "initialFundTxHash": "0x...",  # ⭐ 新增：初始资金交易哈希
  "funded": true,
  "message": "NFC注册成功"
}
```

### 2️⃣ 域名注册测试  
**目标**: 测试域名NFT铸造和链交互
```bash
# 测试请求
POST /nfc/register-domain
{
  "uid": "TEST001",
  "domainPrefix": "testuser001"
}

# 预期响应
{
  "domain": "testuser001.inj",
  "tokenId": "domain_...",
  "txHash": "0x...",  # ⭐ 链交互交易哈希
  "registeredAt": "2024-01-01T00:00:00.000Z"
}
```

### 3️⃣ 小猫NFT抽卡测试
**目标**: 测试小猫NFT抽卡和随机属性生成
```bash
# 测试请求
POST /nfc/draw-cat
{
  "nfcUID": "TEST001",
  "catName": "Fluffy"
}

# 预期响应
{
  "name": "Fluffy",
  "rarity": "SR",
  "color": "orange",
  "imageUrl": "https://...",
  "txHash": "0x...",  # ⭐ 链交互交易哈希
  "mintedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4️⃣ NFC解绑测试
**目标**: 测试NFC解绑和链状态清理
```bash
# 测试请求
POST /nfc/unbind
{
  "uid": "TEST001"
}

# 预期响应
{
  "success": true,
  "message": "NFC卡片解绑成功",
  "txHash": "0x..."  # ⭐ 新增：解绑交易哈希
}
```

## 🔍 系统状态检查测试

### 5️⃣ 合约状态检查
```bash
GET /contract/status
# 预期所有合约状态为 true
```

### 6️⃣ 钱包余额查询
```bash
GET /nfc/wallet/balance/{address}
```

### 7️⃣ 域名可用性检查
```bash
GET /nfc/domain/availability/{domainPrefix}
```

### 8️⃣ 用户小猫列表
```bash
POST /nfc/cats/list
{
  "nfcUID": "TEST001"
}
```

## ⚠️ 错误处理测试

### 9️⃣ 重复注册测试
- 使用相同UID重复注册
- 预期: 409 Conflict

### 🔟 无效UID测试
- 使用无效格式UID
- 预期: 400 Bad Request

### 1️⃣1️⃣ 链交互失败测试
- 测试网络中断时的处理
- 预期: 返回错误信息和失败状态

## 📊 性能测试

### 1️⃣2️⃣ 并发注册测试
- 同时注册多个NFC卡片
- 验证交易哈希唯一性

### 1️⃣3️⃣ 大量抽卡测试
- 连续抽取多个小猫NFT
- 验证随机性和交易确认

## 🎯 测试执行顺序

1. **启动服务和合约状态检查** (5️⃣)
2. **NFC钱包注册** (1️⃣)
3. **域名注册** (2️⃣)
4. **小猫抽卡** (3️⃣)
5. **状态查询测试** (6️⃣-8️⃣)
6. **错误处理测试** (9️⃣-1️⃣1️⃣)
7. **NFC解绑** (4️⃣)
8. **性能测试** (1️⃣2️⃣-1️⃣3️⃣)

## ✅ 成功标准

- ✅ 所有API返回正确的HTTP状态码
- ✅ 所有链交互操作返回有效的交易哈希
- ✅ 数据库状态与链上状态一致
- ✅ 错误处理符合预期
- ✅ 无内存泄漏或资源占用问题

---
**注意**: 测试前请确保：
1. 后端服务已启动 (`npm run start:dev`)
2. 数据库连接正常
3. 合约已正确部署和初始化
4. 测试网络连接稳定
