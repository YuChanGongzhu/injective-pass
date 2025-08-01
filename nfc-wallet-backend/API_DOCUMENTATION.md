# NFC钱包系统 API文档

## 📋 概述

NFC钱包系统是一个基于Injective Protocol的区块链应用，支持NFC卡绑定钱包、域名NFT注册和小猫NFT抽卡游戏。

**服务地址**: http://localhost:8080  
**API文档**: http://localhost:8080/api  
**部署网络**: Injective EVM Testnet (Chain ID: 1439)  

---

## 🔐 认证方式

当前版本无需认证（开发环境），生产环境将支持：
- JWT Token认证  
- API Key认证

---

## 📊 系统状态

### 核心合约地址
- **NFCWalletRegistry**: 动态部署（NFC卡片钱包绑定）
- **INJDomainNFT**: 动态部署（域名NFT系统）  
- **CatNFT_SocialDraw**: 动态部署（猫咪NFT社交抽卡系统）

> 合约地址通过环境变量配置，详见部署文档

---

## 🔗 API接口详细说明

### 1. 健康检查

#### GET /health
基础健康检查端点

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-07-30T23:39:51.000Z"
}
```

---

### 2. NFC管理服务

#### POST /api/nfc/register
注册NFC卡片并绑定钱包

**请求体**:
```json
{
  "nfcUid": "04:1a:2b:3c:4d:5e:6f"
}
```

**参数说明**:
- `nfcUid` (string, 必填): NFC卡片UID，格式为十六进制字符串，支持冒号分隔

**参数约束**:
- `nfcUid`: 1-255字符，唯一性校验

**响应示例**:
```json
{
  "walletAddress": "inj1abc...xyz",
  "ethereumAddress": "0x123...789",
  "balance": "0.100000",
  "nfcUid": "04:1a:2b:3c:4d:5e:6f",
  "isNewWallet": true,
  "initialFundSent": true,
  "transactionHash": "0xabc...123"
}
```

#### GET /api/nfc/wallet/{uid}
查询NFC绑定的钱包信息

**路径参数**:
- `uid` (string): NFC卡片UID

**响应示例**:
```json
{
  "walletAddress": "inj1abc...xyz",
  "ethereumAddress": "0x123...789",
  "balance": "1.250000",
  "nfcUid": "04:1a:2b:3c:4d:5e:6f"
}
```

#### POST /api/nfc/unbind
解绑NFC卡片

**请求体**:
```json
{
  "uid": "04:1a:2b:3c:4d:5e:6f"
}
```

**响应示例**:
```json
{
  "success": true,
  "nfcUnbound": true,
  "message": "解绑成功"
}
```

#### GET /api/nfc/stats
获取系统统计信息

**响应示例**:
```json
{
  "totalWallets": 150,
  "totalNFCs": 150,
  "totalDomains": 45,
  "totalCats": 320
}
```

#### GET /api/nfc/balance/:address
查询钱包余额

**路径参数**:
- `address` (string): 钱包地址（支持inj和0x格式）

**响应示例**:
```json
{
  "address": "inj1...",
  "balance": "1.234567",
  "currency": "INJ"
}
```

---

### 3. 域名服务

#### GET /api/nfc/domain/check
检查域名可用性

**查询参数**:
- `domain` (string): 域名前缀（不包含.inj后缀）

**参数约束**:
- 长度: 3-20字符
- 格式: 字母、数字、连字符，不能以连字符开始或结束
- 不区分大小写

**响应示例**:
```json
{
  "available": true,
  "domain": "alice.inj"
}
```

#### POST /api/nfc/domain/register
注册域名NFT

**请求体**:
```json
{
  "nfcUid": "04:1a:2b:3c:4d:5e:6f",
  "domainName": "alice"
}
```

**参数约束**:
- `nfcUid` (string, 必填): NFC卡片UID
- `domainName` (string, 必填): 域名前缀，3-20字符，仅限字母数字和连字符

**响应示例**:
```json
{
  "success": true,
  "domain": "alice.inj",
  "tokenId": "1",
  "transactionHash": "0xdef...456",
  "metadata": {
    "name": "alice.inj",
    "description": "Injective Domain NFT for alice",
    "image": "https://ipfs.io/ipfs/Qm...",
    "attributes": [
      {"trait_type": "Domain", "value": "alice"},
      {"trait_type": "TLD", "value": ".inj"}
    ]
  }
}
```

---

### 4. 猫咪NFT收藏系统

#### POST /api/nfc/cat/draw
传统付费抽取猫咪NFT

**请求体**:
```json
{
  "nfcUid": "04:1a:2b:3c:4d:5e:6f",
  "catName": "Lucky Cat"
}
```

**参数约束**:
- `nfcUid` (string, 必填): NFC卡片UID
- `catName` (string, 必填): 猫咪名称，1-100字符

**费用**: 0.1 INJ

**响应示例**:
```json
{
  "success": true,
  "tokenId": "123",
  "catName": "Lucky Cat",
  "rarity": "SR",
  "color": "绿色",
  "transactionHash": "0x789...abc",
  "drawCount": 5,
  "metadata": {
    "name": "Lucky Cat #123",
    "description": "A unique cat NFT",
    "image": "https://ipfs.io/ipfs/Qm...",
    "attributes": [
      {"trait_type": "Color", "value": "绿色"},
      {"trait_type": "Rarity", "value": "SR"}
    ]
  }
}
```

#### POST /api/nfc/social-interaction
社交互动获得抽卡券

**请求体**:
```json
{
  "myNFC": "04:1a:2b:3c:4d:5e:6f",
  "otherNFC": "04:2b:3c:4d:5e:6f:7a"
}
```

**参数约束**:
- `myNFC` (string, 必填): 自己的NFC UID
- `otherNFC` (string, 必填): 其他用户的NFC UID，必须与 myNFC 不同

**合约限制**:
- 两个NFC不能相同
- 两个NFC都必须已注册
- 每次互动奖励1张抽卡券

**响应示例**:
```json
{
  "transactionHash": "0x456...789",
  "rewardTickets": 1,
  "totalTickets": 3,
  "message": "社交互动成功，获得1张抽卡券"
}
```

#### POST /api/nfc/cat/draw-with-tickets
使用抽卡券抽取猫咪NFT

**请求体**:
```json
{
  "nfcUid": "04:1a:2b:3c:4d:5e:6f",
  "catName": "Social Cat"
}
```

**参数约束**:
- `nfcUid` (string, 必填): NFC卡片UID
- `catName` (string, 必填): 猫咪名称，1-100字符

**前提条件**:
- 拥有至少1张抽卡券

**稀有度概率**:
- R (普通): 60% - 黑色
- SR (稀有): 30% - 绿色/红色/橘色
- SSR (超稀有): 9% - 紫色/蓝色  
- UR (终极稀有): 1% - 彩虹色

**响应示例**:
```json
{
  "success": true,
  "tokenId": "124",
  "catName": "Social Cat",
  "rarity": "SSR",
  "color": "紫色",
  "transactionHash": "0xaaa...bbb",
  "drawCount": 2,
  "remainingTickets": 2
}
```

#### GET /api/nfc/cat/stats/{uid}
查询抽卡统计信息

**路径参数**:
- `uid` (string): NFC卡片UID

**响应示例**:
```json
{
  "availableDraws": 2,
  "usedDraws": 3,
  "totalDraws": 5,
  "socialBonus": 15,
  "message": "抽卡统计信息"
}
```

#### GET /api/nfc/cat/social/{uid}
查询社交互动统计

**路径参数**:
- `uid` (string): NFC卡片UID

**响应示例**:
```json
{
  "socialBonus": 15,
  "interactedNFCs": ["04:2b:3c:4d:5e:6f:7a", "04:3c:4d:5e:6f:7a:8b"],
  "totalInteractions": 2,
  "message": "社交统计信息"
}
```

#### GET /api/nfc/user-nfts/{address}
查询用户拥有的所有NFT

**路径参数**:
- `address` (string): 钱包地址（支持 Injective 或以太坊格式）

**响应示例**:
```json
{
  "domainNFTs": [
    {
      "tokenId": "1",
      "domain": "alice.inj",
      "metadata": {...}
    }
  ],
  "catNFTs": [
    {
      "tokenId": "123",
      "name": "Lucky Cat",
      "rarity": "SR",
      "color": "绿色",
      "metadata": {...}
    }
  ],
  "totalCount": 2
}
```

---

### 5. 用户管理

#### PUT /api/user/domain
更新用户域名

**请求体**:
```json
{
  "uid": "04:1a:2b:3c:4d:5e:6f",
  "domainPrefix": "newalice"
}
```

#### GET /api/user/profile/:uid
获取用户完整资料

**路径参数**:
- `uid` (string): NFC卡片UID

**响应示例**:
```json
{
  "nfcUID": "04:1a:2b:3c:4d:5e:6f",
  "wallet": {
    "address": "inj1...",
    "balance": "1.234567"
  },
  "domain": "alice.inj",
  "cats": {
    "total": 3,
    "rarities": {
      "R": 1,
      "SR": 1,
      "SSR": 1,
      "UR": 0
    }
  },
  "socialStats": {
    "drawCount": 5,
    "interactions": 2
  }
}
```

#### GET /api/user/check-domain/:domainPrefix
检查域名状态

**路径参数**:
- `domainPrefix` (string): 域名前缀

#### DELETE /api/user/domain/:uid
删除用户域名

**路径参数**:
- `uid` (string): NFC卡片UID

#### GET /api/user/search/:domain
通过域名搜索用户

**路径参数**:
- `domain` (string): 完整域名（如alice.inj）

#### GET /api/user/list
获取用户列表（分页）

**查询参数**:
- `page` (number, 可选): 页码，默认1
- `limit` (number, 可选): 每页数量，默认10，最大100

#### POST /api/user/export-private-key
导出私钥（需要特殊权限）

**请求体**:
```json
{
  "uid": "04:1a:2b:3c:4d:5e:6f",
  "password": "your_secure_password"
}
```

---

### 6. 聊天服务

#### POST /api/chat
发送聊天消息

**请求体**:
```json
{
  "message": "Hello, world!",
  "uid": "04:1a:2b:3c:4d:5e:6f"
}
```

---

## ⚠️ 错误处理

### 通用错误格式
```json
{
  "statusCode": 400,
  "message": "具体错误信息",
  "error": "Bad Request",
  "timestamp": "2025-07-31T01:30:00.000Z",
  "path": "/api/nfc/register"
}
```

### 常见错误码

| 状态码 | 错误类型              | 描述                       |
| ------ | --------------------- | -------------------------- |
| 400    | Bad Request           | 请求参数无效或格式错误     |
| 404    | Not Found             | 资源不存在                 |
| 409    | Conflict              | 资源冲突（如域名已被占用） |
| 500    | Internal Server Error | 服务器内部错误             |

### 业务错误示例

#### NFC相关错误
```json
{
  "statusCode": 409,
  "message": "该NFC UID已被注册",
  "error": "Conflict"
}
```

#### 域名相关错误
```json
{
  "statusCode": 400,
  "message": "域名已被占用",
  "error": "Bad Request"
}
```

#### 抽卡相关错误
```json
{
  "statusCode": 400,
  "message": "抽卡券不足，需要至少1张抽卡券",
  "error": "Bad Request"
}
```

#### 余额不足错误
```json
{
  "statusCode": 400,
  "message": "余额不足，需要0.1 INJ抽卡费用",
  "error": "Bad Request"
}
```

---

## 📊 数据类型定义

### 稀有度枚举
```typescript
enum CatRarity {
  R = "R",        // 普通 (黑色)
  SR = "SR",      // 稀有 (绿色/红色/橘色)  
  SSR = "SSR",    // 超稀有 (紫色/蓝色)
  UR = "UR"       // 超超稀有 (彩虹色)
}
```

### 颜色类型
```typescript
type CatColor = "黑色" | "绿色" | "红色" | "橘色" | "紫色" | "蓝色" | "彩虹色";
```

### 稀有度概率分布
- **R (普通)**: 60% - 黑色
- **SR (稀有)**: 30% - 绿色/红色/橘色
- **SSR (超稀有)**: 9% - 紫色/蓝色
- **UR (超超稀有)**: 1% - 彩虹色

---

## 🚀 使用示例

### 完整工作流程示例

1. **注册NFC卡片**
```bash
curl -X POST http://localhost:8080/api/nfc/register \
  -H "Content-Type: application/json" \
  -d '{
    "nfcUid": "04:1a:2b:3c:4d:5e:6f"
  }'
```

2. **注册域名**
```bash
curl -X POST http://localhost:8080/api/nfc/domain/register \
  -H "Content-Type: application/json" \
  -d '{
    "nfcUid": "04:1a:2b:3c:4d:5e:6f",
    "domainName": "alice"
  }'
```

3. **社交互动获得抽卡券**
```bash
curl -X POST http://localhost:8080/api/nfc/social-interaction \
  -H "Content-Type: application/json" \
  -d '{
    "myNFC": "04:1a:2b:3c:4d:5e:6f",
    "otherNFC": "04:2b:3c:4d:5e:6f:7a"
  }'
```

4. **使用抽卡券抽卡**
```bash
curl -X POST http://localhost:8080/api/nfc/cat/draw-with-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "nfcUid": "04:1a:2b:3c:4d:5e:6f",
    "catName": "Lucky Cat"
  }'
```

5. **查询抽卡统计**
```bash
curl -X GET http://localhost:8080/api/nfc/cat/stats/04:1a:2b:3c:4d:5e:6f
```

---

## 🔧 环境配置

### 必需环境变量
```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/injective_pass"

# Injective 网络配置
INJECTIVE_RPC_URL="https://k8s.testnet.json-rpc.injective.network/"
INJECTIVE_CHAIN_ID="1439"
NODE_ENV="development"

# 合约地址
NFC_REGISTRY_ADDRESS="0x..."
DOMAIN_REGISTRY_ADDRESS="0x..."
CATNFT_CONTRACT_ADDRESS="0x..."

# 主账户私钥（用于发送初始资金和合约调用）
CONTRACT_PRIVATE_KEY="0x..."

# 服务配置
PORT=8080
```

### 合约权限配置

后端钱包需要在以下合约中被授权为操作员：

1. **CatNFT 合约**: 调用 `setAuthorizedOperator(backend_address, true)`
2. **NFCWalletRegistry 合约**: 确保有足够权限进行 NFC 绑定操作

---

## 🔒 安全注意事项

1. **NFC UID 验证**: 所有 NFC UID 都经过格式验证和长度限制
2. **重复提交保护**: 防止重复注册和恶意操作
3. **智能合约权限**: 后端钱包需要被授权为合约操作员
4. **交易确认**: 所有链上操作都需要等待交易确认
5. **错误处理**: 完整的错误捕获和用户友好的错误信息

---

## 📝 更新日志

### v1.1.0 (2025-07-31)
- ✅ 更新 ABI 文件与最新合约匹配
- ✅ 修复社交互动方法参数不匹配问题
- ✅ 修复事件解析逻辑（CatDrawnWithTickets vs CatNFTMinted）
- ✅ 优化抽卡统计数据结构（getDrawStats返回tuple）
- ✅ 完善 API 文档和参数约束
- ✅ 支持猫咪名称重复（移除全局唯一性限制）

### v1.0.0 (2025-07-27)
- 🎉 初始版本发布
- ⚡ NFC 钱包注册功能
- 🌐 域名 NFT 系统
- 🐱 猫咪 NFT 收藏
- 🔄 社交互动机制

---

## 🔧 技术支持

如有问题或建议，请联系开发团队或查看：
- **API文档**: http://localhost:8080/api
- **健康检查**: http://localhost:8080/health
- **合约验证**: https://testnet.blockscout.injective.network/

---
**Injective Pass - 连接物理与数字世界的桥梁** 🌉
