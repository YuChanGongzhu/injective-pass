# Injective NFC钱包 - 用户手册

## 📖 目录

1. [快速开始](#快速开始)
2. [核心功能](#核心功能)
3. [API使用指南](#api使用指南)
4. [域名管理](#域名管理)
5. [钱包操作](#钱包操作)
6. [安全须知](#安全须知)
7. [故障排除](#故障排除)
8. [FAQ常见问题](#faq常见问题)

---

## 🚀 快速开始

### 系统要求
- Node.js 16+ 
- Docker & Docker Compose
- PostgreSQL 数据库
- 至少 2GB 内存

### 安装步骤

#### 1. 克隆项目
```bash
cd /path/to/your/projects
# 项目文件已在本地 nfc-wallet-backend 目录
```

#### 2. 安装依赖
```bash
cd nfc-wallet-backend
npm install
```

#### 3. 环境配置
```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量文件
vim .env
```

必需的环境变量：
```bash
DATABASE_URL="postgresql://nfc_user:secure_password_123@localhost:5432/nfc_wallet?schema=public"
AES_ENCRYPTION_KEY="your-32-byte-hex-key-here"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
NODE_ENV="development"
```

#### 4. 启动数据库
```bash
# 启动PostgreSQL容器
docker-compose up -d postgres

# 等待数据库启动（约10秒）
sleep 10
```

#### 5. 初始化数据库
```bash
# 生成Prisma客户端
npm run prisma:generate

# 推送数据库架构
npm run prisma:push
```

#### 6. 启动应用
```bash
# 开发模式启动
npm run start:dev

# 或生产模式
npm run build && npm run start:prod
```

#### 7. 验证安装
```bash
# 运行测试
node test-injective-domain.js

# 访问API文档
# 浏览器打开: http://localhost:3000/api
```

---

## 💎 核心功能

### 功能概览
- ✅ **NFC钱包注册**: 通过NFC UID自动创建Injective钱包
- ✅ **双地址支持**: 生成Injective地址 + 以太坊兼容地址
- ✅ **.inj域名系统**: 为用户分配个性化域名
- ✅ **私钥安全**: AES-256-GCM加密存储
- ✅ **钱包管理**: 查询、统计、用户管理

### 核心工作流程

#### 1. NFC钱包注册流程
```
📱 扫描NFC卡片 -> 获取UID -> 调用注册API -> 生成钱包 -> 返回地址
```

#### 2. 域名设置流程  
```
✅ 钱包已注册 -> 选择域名前缀 -> 验证可用性 -> 设置域名 -> 生成.inj域名
```

#### 3. 钱包查询流程
```
🔍 输入UID/域名 -> 调用查询API -> 返回钱包信息 -> 显示地址和域名
```

---

## 🔌 API使用指南

### API基础信息
- **基础URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: 暂无（未来可添加API Key）

### 1. NFC钱包相关API

#### 注册NFC钱包
```bash
POST /api/nfc/register
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/nfc/register \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "04:1a:2b:3c:4d:5e:6f"
  }'
```

**响应示例**:
```json
{
  "address": "inj1abc123...",
  "ethAddress": "0x742d35Cc6bb...",
  "uid": "04:1a:2b:3c:4d:5e:6f",
  "domain": null,
  "isNewWallet": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 查询钱包信息
```bash
GET /api/nfc/wallet/:uid
```

**请求示例**:
```bash
curl http://localhost:3000/api/nfc/wallet/04:1a:2b:3c:4d:5e:6f
```

#### 获取系统统计
```bash
GET /api/nfc/stats
```

**响应示例**:
```json
{
  "totalWallets": 150,
  "walletsWithDomain": 75,
  "recentRegistrations": 12
}
```

### 2. 域名管理API

#### 设置域名
```bash
PUT /api/user/domain
```

**请求示例**:
```bash
curl -X PUT http://localhost:3000/api/user/domain \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "04:1a:2b:3c:4d:5e:6f",
    "domainPrefix": "alice"
  }'
```

**响应示例**:
```json
{
  "address": "inj1abc123...",
  "uid": "04:1a:2b:3c:4d:5e:6f", 
  "domain": "alice.inj",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

#### 检查域名可用性
```bash
GET /api/user/check-domain/:domainPrefix
```

**请求示例**:
```bash
curl http://localhost:3000/api/user/check-domain/alice
```

**响应示例**:
```json
{
  "available": false  // 域名已被占用
}
```

#### 根据域名查找用户
```bash
GET /api/user/search/:domain
```

**请求示例**:
```bash
curl http://localhost:3000/api/user/search/alice.inj
```

#### 删除域名
```bash
DELETE /api/user/domain/:uid
```

**请求示例**:
```bash
curl -X DELETE http://localhost:3000/api/user/domain/04:1a:2b:3c:4d:5e:6f
```

### 3. 用户管理API

#### 获取用户资料
```bash
GET /api/user/profile/:uid
```

#### 用户列表（分页）
```bash
GET /api/user/list?page=1&limit=10
```

---

## 🏷️ 域名管理

### 域名系统说明

#### 什么是.inj域名？
.inj域名是为NFC钱包用户提供的个性化身份标识，用户可以设置简短易记的域名前缀，系统自动添加`.inj`后缀。

#### 域名格式规则
- **长度**: 3-30个字符（不含`.inj`后缀）
- **字符**: 仅限小写字母、数字、连字符
- **限制**: 不能以连字符开头或结尾
- **禁止**: 连续连字符（如：`alice--bob`）

#### 域名使用场景
1. **身份标识**: 替代复杂的钱包地址
2. **便于分享**: 告诉朋友你的域名即可转账
3. **社交网络**: 基于域名建立用户关系
4. **品牌展示**: 企业用户申请品牌域名

### 域名操作指南

#### 1. 设置域名
```typescript
// 前提：已有注册的NFC钱包
const response = await fetch('/api/user/domain', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'your-nfc-uid',
    domainPrefix: 'alice'  // 用户输入的前缀
  })
});
```

#### 2. 验证域名格式
```javascript
function validateDomainPrefix(prefix) {
  // 长度检查
  if (prefix.length < 3 || prefix.length > 30) {
    return false;
  }
  
  // 格式检查：小写字母、数字、连字符
  const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
  if (!regex.test(prefix)) {
    return false;
  }
  
  // 禁止连续连字符
  if (prefix.includes('--')) {
    return false;
  }
  
  return true;
}
```

#### 3. 检查域名可用性
```javascript
async function checkDomainAvailability(prefix) {
  const response = await fetch(`/api/user/check-domain/${prefix}`);
  const data = await response.json();
  return data.available;
}
```

### 域名最佳实践

#### ✅ 推荐的域名前缀
- `alice` - 简短个人名
- `company-2024` - 企业品牌
- `user123` - 数字组合
- `my-wallet` - 描述性名称

#### ❌ 不推荐的域名前缀
- `ab` - 太短
- `-alice` - 以连字符开头
- `alice-` - 以连字符结尾  
- `Alice` - 包含大写字母
- `alice@bob` - 包含特殊字符

---

## 💼 钱包操作

### 钱包地址格式

#### Injective地址（主要）
- **格式**: `inj1...` 开头
- **长度**: 通常42字符
- **用途**: Injective网络上的主要地址

#### 以太坊兼容地址（备用）
- **格式**: `0x...` 开头  
- **长度**: 42字符（包含0x）
- **用途**: 与以太坊生态的兼容性

### 钱包安全

#### 私钥管理
- **加密算法**: AES-256-GCM
- **存储位置**: PostgreSQL数据库
- **访问控制**: 仅服务端可访问
- **备份建议**: 定期备份数据库

#### 安全建议
1. **环境变量**: 妥善保管加密密钥
2. **服务器安全**: 确保服务器安全配置
3. **网络安全**: 使用HTTPS加密传输
4. **访问控制**: 限制API访问来源

### 钱包恢复

#### 通过UID恢复
```bash
# 如果知道NFC UID，可以查询对应钱包
curl http://localhost:3000/api/nfc/wallet/04:1a:2b:3c:4d:5e:6f
```

#### 通过域名恢复
```bash
# 如果知道.inj域名，可以查找对应用户
curl http://localhost:3000/api/user/search/alice.inj
```

---

## 🔒 安全须知

### 系统安全

#### 数据加密
- **私钥**: AES-256-GCM加密存储
- **传输**: HTTPS加密（生产环境）
- **数据库**: 连接加密 + 访问控制

#### 访问控制
- **API限制**: 可配置API访问白名单
- **防火墙**: 限制不必要的端口访问
- **容器隔离**: Docker网络隔离

### 用户安全

#### 密钥管理
⚠️ **重要提醒**: 
- 系统自动生成的私钥存储在数据库中
- 如需导出私钥，请联系系统管理员
- 私钥一旦丢失无法找回，请做好备份

#### NFC安全
- **UID唯一性**: 每个NFC卡片UID应当唯一
- **物理安全**: 保管好NFC卡片，避免丢失
- **权限控制**: 建议使用支持加密的NFC卡片

### 生产环境安全

#### 必需配置
1. **HTTPS**: 启用SSL/TLS证书
2. **防火墙**: 配置iptables或云防火墙
3. **密钥轮换**: 定期更换加密密钥
4. **监控告警**: 设置异常访问告警

#### 安全检查清单
- [ ] 更改默认密码和密钥
- [ ] 启用HTTPS加密
- [ ] 配置防火墙规则
- [ ] 设置访问日志
- [ ] 定期备份数据
- [ ] 监控异常访问

---

## 🛠️ 故障排除

### 常见问题与解决方案

#### 1. 服务无法启动

**问题**: `npm run start:dev` 失败
```bash
Error: Cannot connect to database
```

**解决方案**:
```bash
# 检查数据库是否启动
docker-compose ps

# 重启数据库
docker-compose restart postgres

# 检查数据库连接
npm run prisma:db:push
```

#### 2. API调用失败

**问题**: 调用API返回404或500错误

**解决方案**:
```bash
# 检查服务状态
curl http://localhost:3000/api/nfc/stats

# 查看应用日志
docker-compose logs -f api

# 重启应用服务
npm run start:dev
```

#### 3. 数据库连接错误

**问题**: `P1001: Can't reach database server`

**解决方案**:
```bash
# 检查.env配置
cat .env | grep DATABASE_URL

# 检查数据库容器
docker-compose logs postgres

# 重新配置数据库
docker-compose down
docker-compose up -d postgres
```

#### 4. 私钥解密失败

**问题**: `AES decryption failed`

**解决方案**:
```bash
# 检查加密密钥配置
cat .env | grep AES_ENCRYPTION_KEY

# 密钥应为64位十六进制字符串
# 重新生成密钥：
openssl rand -hex 32
```

### 性能问题

#### 响应时间慢
1. **检查数据库性能**: 查看数据库连接数和查询时间
2. **检查服务器资源**: CPU和内存使用情况
3. **优化查询**: 添加数据库索引

#### 内存占用高
1. **重启应用**: `npm run start:dev`
2. **检查内存泄漏**: 使用Node.js性能监控工具
3. **增加服务器内存**: 升级服务器配置

### 日志分析

#### 应用日志
```bash
# 查看实时日志
docker-compose logs -f api

# 查看错误日志
docker-compose logs api | grep ERROR
```

#### 数据库日志
```bash
# 查看数据库日志
docker-compose logs postgres

# 查看慢查询日志
docker exec -it nfc_wallet_postgres psql -U nfc_user -d nfc_wallet -c "SELECT * FROM pg_stat_activity;"
```

---

## ❓ FAQ常见问题

### 基础问题

#### Q: 什么是NFC钱包？
A: NFC钱包是通过NFC卡片UID关联的Injective区块链钱包，用户扫描NFC卡片即可自动创建或访问钱包。

#### Q: 为什么选择Injective网络？
A: Injective网络具有以下优势：
- 3秒快速确认
- 比以太坊低90%+的Gas费
- 与以太坊完全兼容
- 支持高级DeFi功能

#### Q: .inj域名有什么作用？
A: .inj域名让用户拥有易记的身份标识，比如`alice.inj`，朋友可以直接通过域名找到您的钱包，无需记住复杂的地址。

### 技术问题

#### Q: 如何备份我的钱包？
A: 钱包私钥由系统管理并加密存储。建议：
1. 记录好您的NFC UID
2. 记录您设置的.inj域名
3. 联系管理员进行系统级备份

#### Q: 如果NFC卡片丢失怎么办？
A: 如果您还记得UID，可以通过API查询钱包信息。如果设置了.inj域名，也可以通过域名找回。

#### Q: 可以修改已设置的域名吗？
A: 可以。您可以删除当前域名，然后设置新的域名（如果新域名可用）。

### 安全问题

#### Q: 私钥如何保证安全？
A: 系统采用AES-256-GCM军用级加密算法存储私钥，加密密钥通过环境变量安全管理。

#### Q: 系统会记录我的操作吗？
A: 系统会记录基本的API访问日志用于安全监控，但不会记录敏感的私钥信息。

#### Q: 如何确保NFC UID的唯一性？
A: 数据库层面设置了唯一性约束，同一个UID无法注册多个钱包。

### 开发问题

#### Q: 如何集成到我的应用中？
A: 您可以通过RESTful API集成：
1. 调用注册API创建钱包
2. 调用查询API获取钱包信息
3. 参考测试脚本了解具体用法

#### Q: 支持哪些开发语言？
A: API基于HTTP标准，支持任何可以发送HTTP请求的编程语言，包括：
- JavaScript/TypeScript
- Python
- Java
- Go
- PHP等

#### Q: 如何扩展功能？
A: 项目采用模块化设计，您可以：
1. 添加新的API端点
2. 扩展数据库模型
3. 集成更多区块链功能

---

## 📞 技术支持

### 获取帮助

#### 1. 查看文档
- **API文档**: http://localhost:3000/api
- **项目文档**: 查看项目根目录下的README.md
- **测试示例**: 运行 `test-injective-domain.js`

#### 2. 问题反馈
- **查看日志**: 使用`docker-compose logs`命令
- **运行测试**: 确认基础功能是否正常
- **检查配置**: 验证环境变量设置

#### 3. 社区资源
- **Injective文档**: https://docs.injective.network/
- **NestJS文档**: https://docs.nestjs.com/
- **Prisma文档**: https://www.prisma.io/docs/

---

**👨‍💻 开发团队**: 本项目采用现代化技术栈开发，具备企业级应用的稳定性和扩展性。如有技术问题，请参考本手册或查看相关技术文档。 