# NFC 钱包后端系统设置指南

## 概述

这是一个基于 NestJS 的 NFC 钱包后端系统，支持 Injective 区块链。系统提供完整的空白卡激活流程：

1. **空白卡检测** - 自动检测未绑定的 NFC 卡片
2. **账户创建** - 生成 Injective 兼容的钱包地址和密钥
3. **资金发送** - 从主账户自动发送 0.1 INJ 初始资金
4. **NFT 铸造** - 为用户铸造专属的小猫 NFT
5. **域名创建** - 支持用户创建 .inj 域名

## 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 13
- NPM >= 8.0.0

## 快速启动

### 1. 安装依赖

```bash
cd nfc-wallet-backend
npm install
```

### 2. 环境配置

复制环境变量模板并配置：

```bash
cp env.example .env
```

**重要配置项：**

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/nfc_wallet"

# AES 加密密钥（32字节十六进制）
AES_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# 主账户私钥（用于发送初始资金）
CONTRACT_PRIVATE_KEY="0xadbac67afad51760f4049e3ce2c32fcf0cb630f62f9f011290bb87a975171f67"

# Injective 网络配置
INJECTIVE_RPC_URL="https://k8s.testnet.json-rpc.injective.network/"
INJECTIVE_CHAIN_ID="1439"

# 合约地址（部署后填入）
NFC_REGISTRY_ADDRESS="0x..."
NFC_CARD_NFT_ADDRESS="0x..."
DOMAIN_REGISTRY_ADDRESS="0x..."
```

### 3. 数据库设置

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# （可选）打开 Prisma Studio 管理数据
npm run prisma:studio
```

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务将运行在 `http://localhost:3000`

## API 文档

启动服务后，访问 `http://localhost:3000/api` 查看 Swagger API 文档。

## 主要 API 端点

### NFC 卡片管理

```bash
# 注册 NFC 卡片（空白卡激活）
POST /api/nfc/register
{
  "uid": "04:1a:2b:3c:4d:5e:6f"
}

# 查询钱包信息
GET /api/nfc/wallet/{uid}

# 检查域名可用性
GET /api/nfc/domain/check?domain=alice

# 创建域名
POST /api/nfc/domain/create
{
  "uid": "04:1a:2b:3c:4d:5e:6f",
  "domainName": "alice"
}

# 解绑 NFC 卡片
POST /api/nfc/unbind
{
  "uid": "04:1a:2b:3c:4d:5e:6f",
  "resetToBlank": true
}

# 获取统计信息
GET /api/nfc/stats
```

## 空白卡激活流程

当检测到新的 NFC 卡片时，系统会自动执行以下流程：

1. **生成钱包** - 创建 Injective 兼容的钱包地址和密钥对
2. **存储信息** - 将钱包信息加密存储到数据库
3. **发送资金** - 从主账户发送 0.1 INJ 到新钱包（异步）
4. **铸造 NFT** - 为用户铸造专属小猫 NFT（异步）
5. **返回信息** - 立即返回钱包信息给前端

```javascript
// 示例响应
{
  "address": "inj1...",
  "ethAddress": "0x...",
  "publicKey": "AuY3ASbyRHfgKNkg7rumWCXzSGCvvgtpR6KKWlpuuQ9Y",
  "uid": "04:1a:2b:3c:4d:5e:6f",
  "domain": null,
  "nftTokenId": null,
  "isNewWallet": true,
  "isBlankCard": true,
  "initialFunded": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 合约部署

在使用前需要部署以下合约到 Injective 测试网：

1. **NFCWalletRegistry** - NFC 卡片注册合约
2. **CatNFT** - 小猫 NFT 合约
3. **DomainRegistry** - 域名注册合约

合约代码位于 `../foundry-inj/src/` 目录。

## 安全考虑

1. **私钥管理** - 主账户私钥应安全存储，生产环境建议使用 HSM
2. **数据加密** - 用户私钥使用 AES-256-GCM 加密存储
3. **API 安全** - 生产环境应启用 API 密钥验证
4. **网络安全** - 建议使用 HTTPS 和防火墙保护

## 监控和日志

系统提供详细的日志输出，包括：

- NFC 卡片注册日志
- 资金发送交易日志
- NFT 铸造日志
- 错误和异常日志

推荐使用日志聚合工具进行生产环境监控。

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确保 PostgreSQL 服务正在运行

2. **Injective 网络连接失败**
   - 检查 `INJECTIVE_RPC_URL` 配置
   - 确认网络连接正常

3. **主账户余额不足**
   - 检查主账户 INJ 余额
   - 确保有足够资金用于发送给新用户

4. **合约调用失败**
   - 检查合约地址配置
   - 确认合约已正确部署

### 日志查看

```bash
# 查看服务日志
npm run start:dev

# 查看特定日志
grep "空白卡" logs/app.log
grep "资金发送" logs/app.log
grep "NFT铸造" logs/app.log
```

## 开发指南

### 项目结构

```
src/
├── nfc/           # NFC 卡片管理模块
├── contract/      # 合约交互模块
├── crypto/        # 加密解密模块
├── prisma/        # 数据库模块
└── user/          # 用户管理模块
```

### 添加新功能

1. 在相应模块添加服务方法
2. 更新 DTO 和控制器
3. 添加单元测试
4. 更新 API 文档

## 支持

如有问题，请查看：

1. API 文档：`http://localhost:3000/api`
2. 项目文档：`/docs` 目录
3. 合约文档：`../foundry-inj/README.md`

## 许可证

MIT License 