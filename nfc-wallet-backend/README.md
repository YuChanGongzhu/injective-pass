# Injective NFC Wallet Backend

基于 Injective EVM 的 NFC 钱包后端服务，支持 NFC 卡片绑定、域名注册和 NFT 铸造功能。

## 🎯 功能特性

### 核心功能
- **NFC 钱包注册**: 支持物理 NFC 卡片与数字钱包绑定
- **域名管理**: 注册和管理 `.inj` 域名 NFT
- **猫咪 NFT**: 铸造和管理独特的猫咪 NFT（7种颜色）
- **实际 IPFS 图片**: 所有 NFT 都有真实的 IPFS 托管图片

### 技术特性
- **Injective EVM 集成**: 完整的智能合约交互
- **生产级加密**: AES-256 加密和 JWT 认证
- **Docker 容器化**: 完整的 Docker Compose 部署
- **健康检查**: 完善的服务监控和错误处理
- **CORS 支持**: 跨域请求处理

## 🚀 快速开始

### 系统要求
- Docker 和 Docker Compose
- Node.js 18+ (开发环境)
- 至少 2GB RAM

### 生产部署 (推荐)

1. **克隆项目**
```bash
git clone <repository-url>
cd nfc-wallet-backend
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件配置必要参数
```

3. **启动服务**
```bash
# 构建并启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f api
```

4. **验证部署**
```bash
# 测试 API 健康状态
curl http://localhost:8080/api/nfc/stats

# 测试 Nginx 代理
curl http://localhost:8001/api/nfc/stats
```

### 开发环境

1. **安装依赖**
```bash
npm install
```

2. **数据库设置**
```bash
# 启动数据库服务
docker compose up -d postgres redis

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push
```

3. **启动开发服务器**
```bash
npm run start:dev
```

## 🏗️ 架构概览

### 服务架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx Proxy   │    │   API Server    │
│   (Port 3000)   │───▶│   (Port 8001)   │───▶│   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │     Redis       │
                       │   (Port 5432)   │    │   (Port 6379)   │
                       └─────────────────┘    └─────────────────┘
```

### 智能合约
- **NFCWalletRegistry**: `0x775D0D30dc990b8068768CCE58ad47ff167700cf`
- **INJDomainNFT**: `0xf978481B334ba5572717c528ba730EF4A12DA191`
- **CatNFT**: `0x049B99fc53a39e8eF6DC725EBA32f0FCd7053c22`

## 📡 API 文档

### 基础信息
- **Base URL**: `http://localhost:8080/api`
- **认证**: Bearer Token (JWT)
- **Content-Type**: `application/json`

### 核心端点

#### NFC 管理
```http
POST /nfc/register
Content-Type: application/json

{
  "uid": "04:ab:cd:ef:12:34:56",
  "walletAddress": "0x742d35Cc6434C0532925a3b8D7CbAF2d",
  "signature": "0x..."
}
```

#### 域名管理
```http
POST /nfc/register-domain
Content-Type: application/json

{
  "nfcUid": "04:ab:cd:ef:12:34:56",
  "domainName": "alice"
}
```

#### NFT 管理
```http
POST /nfc/draw-cat
Content-Type: application/json

{
  "nfcUid": "04:ab:cd:ef:12:34:56"
}
```

#### 查询接口
```http
GET /nfc/stats
GET /nfc/user-nfts/{walletAddress}
GET /nfc/user-domain-nft/{walletAddress}
GET /nfc/user-cat-nfts/{walletAddress}
```

### 响应格式
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "tokenId": "123",
    "imageUrl": "https://ipfs.io/ipfs/..."
  },
  "message": "操作成功"
}
```

## 🎨 NFT 图片系统

### 域名 NFT
- **统一图片**: 所有域名 NFT 使用统一的 fir.png 图片
- **IPFS URL**: `https://tan-academic-booby-265.mypinata.cloud/ipfs/QmSKhPCqxqJk8XgLeTvCNBbbE3n3wqZUb6xJfkGr4A3Hxs/fir.png`

### 猫咪 NFT (7种颜色)
1. **黑猫**: `QmPNjcjhkZCBdqcUzqCfcP5Mj3HdmZzZs9uEHfhV4qsJ8m/cat_black.png`
2. **绿猫**: `QmT8hQs4YZwL2B3dVsEfKcVjMz8CdRz4pXgY7QvT6nW9k4/cat_green.png`
3. **红猫**: `QmR7vN8gL3FsV2jZ6PcXtWnK4dT9z5eQm1BxY2MpS8uL9k/cat_red.png`
4. **橙猫**: `QmW5vB4dT8YzN3jF7LqV5rX2cK9gE6bR8tN4mZ3hU1sQ7w/cat_orange.png`
5. **紫猫**: `QmY3kJ7mZ2TvF8dE5BqX4wL6pR9cU2nV8zG1sK4hM7tQ9x/cat_purple.png`
6. **蓝猫**: `QmF7kT6nR8BzD2jU3HsK4vE9mY1cW5pQ8gL7xV2tN4zM6k/cat_blue.png`
7. **彩虹猫**: `QmN2bV8wK9TzU3jR7LsE4mD6cY1qX5pF8nK2vW9hR7tL4z/cat_rainbow.png`

## 🔧 配置参数

### 环境变量 (.env)
```env
# 数据库配置
DATABASE_URL="postgresql://nfc_user:secure_password_123@localhost:5432/nfc_wallet?schema=public"

# 加密密钥 (32字节十六进制)
AES_ENCRYPTION_KEY="8ae40a4aa398d775f6b3ff48079003f45d1c90369f331defa1ea9f79ab85b759"

# JWT 密钥
JWT_SECRET="DeF9z3wcr88RtKI8bSVhs8wZWNYZPK7OL6/sx2WhSxU="

# 服务配置
PORT=3000
NODE_ENV="production"

# Injective 配置
INJECTIVE_RPC_URL="https://k8s.testnet.json-rpc.injective.network/"
INJECTIVE_CHAIN_ID="1439"
CONTRACT_PRIVATE_KEY="your-private-key-here"

# 合约地址
NFC_REGISTRY_ADDRESS="0x775D0D30dc990b8068768CCE58ad47ff167700cf"
DOMAIN_REGISTRY_ADDRESS="0xf978481B334ba5572717c528ba730EF4A12DA191"
CAT_NFT_ADDRESS="0x049B99fc53a39e8eF6DC725EBA32f0FCd7053c22"
```

### Docker Compose 端口配置
- **API 服务**: `localhost:8080` → `container:3000`
- **Nginx 代理**: `localhost:8001` → `container:80`
- **PostgreSQL**: `localhost:5432` → `container:5432`
- **Redis**: `localhost:6379` → `container:6379`

## 🛠️ 开发指南

### 项目结构
```
nfc-wallet-backend/
├── src/                     # 源代码
│   ├── nfc/                # NFC 服务模块
│   ├── user/               # 用户管理模块
│   ├── crypto/             # 加密服务
│   ├── contract/           # 智能合约集成
│   └── prisma/             # 数据库服务
├── prisma/                 # 数据库模式
├── docker-compose.yml      # Docker 编排
├── Dockerfile             # 容器构建
├── nginx.conf             # Nginx 配置
└── .env                   # 环境变量
```

### 常用命令
```bash
# 开发
npm run start:dev          # 启动开发服务器
npm run build              # 构建生产版本
npm run test               # 运行测试

# Docker
docker compose up -d       # 启动所有服务
docker compose down        # 停止所有服务
docker compose logs api    # 查看 API 日志
docker compose restart api # 重启 API 服务

# 数据库
npx prisma studio          # 打开数据库管理界面
npx prisma db push         # 推送模式变更
npx prisma generate        # 生成客户端代码
```

### 添加新功能
1. 在 `src/` 目录下创建新模块
2. 更新数据库模式 (`prisma/schema.prisma`)
3. 添加相应的 API 端点
4. 更新 Docker 配置（如需要）
5. 编写测试用例

## 🧪 测试

### API 测试
```bash
# 健康检查
curl http://localhost:8080/api/nfc/stats

# NFC 注册测试
curl -X POST http://localhost:8080/api/nfc/register \
  -H "Content-Type: application/json" \
  -d '{"uid":"04:ab:cd:ef:12:34:56","walletAddress":"0x742d35Cc6434C0532925a3b8D7CbAF2d","signature":"0x..."}'

# 域名注册测试
curl -X POST http://localhost:8080/api/nfc/register-domain \
  -H "Content-Type: application/json" \
  -d '{"nfcUid":"04:ab:cd:ef:12:34:56","domainName":"test"}'

# 猫咪 NFT 测试
curl -X POST http://localhost:8080/api/nfc/draw-cat \
  -H "Content-Type: application/json" \
  -d '{"nfcUid":"04:ab:cd:ef:12:34:56"}'
```

### 容器健康检查
```bash
# 检查所有容器状态
docker compose ps

# 检查 API 健康状态
docker compose exec api curl -f http://localhost:3000/api/nfc/stats

# 检查数据库连接
docker compose exec postgres pg_isready -U nfc_user -d nfc_wallet
```

## 🐛 故障排除

### 常见问题

#### API 无法启动
```bash
# 检查日志
docker compose logs api

# 检查环境变量
docker compose exec api env | grep -E "(DATABASE_URL|AES_ENCRYPTION_KEY)"

# 重启服务
docker compose restart api
```

#### 数据库连接失败
```bash
# 检查数据库状态
docker compose ps postgres

# 测试连接
docker compose exec postgres psql -U nfc_user -d nfc_wallet -c "SELECT 1;"

# 重新初始化
docker compose down
docker volume rm nfc-wallet-backend_postgres_data
docker compose up -d
```

#### 端口冲突
```bash
# 检查端口占用
lsof -i :8080
lsof -i :8001

# 修改 docker-compose.yml 中的端口映射
# 重启服务
docker compose down && docker compose up -d
```

#### NFT 图片无法加载
- 检查 IPFS 链接是否可访问
- 验证 `generateCatImageUrl` 和 `generateDomainImageUrl` 函数
- 确认网络连接正常

### 日志分析
```bash
# API 服务日志
docker compose logs -f api

# Nginx 访问日志
docker compose logs -f nginx

# 数据库日志
docker compose logs -f postgres

# 实时监控所有服务
docker compose logs -f
```

## 🔒 安全注意事项

1. **私钥安全**: 生产环境中更换 `CONTRACT_PRIVATE_KEY`
2. **JWT 密钥**: 使用强随机 `JWT_SECRET`
3. **数据库密码**: 更改默认的数据库密码
4. **HTTPS**: 生产环境启用 SSL/TLS
5. **防火墙**: 限制不必要的端口访问

## 📈 监控和维护

### 性能监控
- API 响应时间
- 数据库连接池状态
- 内存和 CPU 使用率
- 容器健康状态

### 备份策略
```bash
# 数据库备份
docker compose exec postgres pg_dump -U nfc_user nfc_wallet > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T postgres psql -U nfc_user -d nfc_wallet
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker compose build api
docker compose up -d

# 验证更新
curl http://localhost:8080/api/nfc/stats
```

## 📞 支持

如有问题或建议，请：
1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 联系开发团队

---

**版本**: 1.0.0  
**最后更新**: 2025年7月27日  
**开发团队**: Injective Pass Labs