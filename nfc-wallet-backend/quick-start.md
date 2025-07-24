# NFC钱包后端 - 快速开始指南

## ✅ 项目设置完成

您的NFC钱包后端API已经成功创建并配置完成！

## 🚀 启动步骤

### 1. 启动开发服务器
```bash
npm run start:dev
```

### 2. 验证服务运行
等待看到以下消息：
```
🚀 NFC钱包API服务运行在 http://localhost:3000
📚 API文档地址: http://localhost:3000/api
✅ 数据库连接成功
```

### 3. 查看API文档
在浏览器中访问: http://localhost:3000/api

### 4. 运行API测试
```bash
# 测试.inj域名功能（推荐）
node test-injective-domain.js

# 测试基础Injective钱包功能
node test-injective-api.js

# 或使用原始测试脚本
node test-api.js
```

## 📡 主要API端点

### NFC钱包注册
```bash
curl -X POST http://localhost:3000/api/nfc/register \
  -H "Content-Type: application/json" \
  -d '{"uid": "04:1a:2b:3c:4d:5e:6f"}'
```

### 设置.inj域名
```bash
curl -X PUT http://localhost:3000/api/user/domain \
  -H "Content-Type: application/json" \
  -d '{"uid": "04:1a:2b:3c:4d:5e:6f", "domainPrefix": "alice"}'
```

### 检查.inj域名可用性
```bash
curl http://localhost:3000/api/user/check-domain/alice
```

### 根据域名查找用户
```bash
curl http://localhost:3000/api/user/search/alice.inj
```

## 🗄️ 数据库设置

如果需要使用真实数据库而不是内存数据库：

### 使用Docker启动PostgreSQL
```bash
docker compose up -d postgres
```

### 运行数据库迁移
```bash
npm run prisma:push
```

### 查看数据库
```bash
npm run prisma:studio
```

## 🐳 Docker部署

### 启动完整环境
```bash
docker-compose up -d
```

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
docker-compose logs -f api
```

## 🔐 环境变量

重要的环境变量已经配置：
- ✅ AES_ENCRYPTION_KEY: 私钥加密密钥
- ✅ JWT_SECRET: JWT签名密钥
- ✅ DATABASE_URL: 数据库连接字符串

## 📊 项目特性

✅ **NFC钱包注册** - 通过UID自动生成Injective钱包  
✅ **Injective网络支持** - Cosmos格式地址 (inj...)  
✅ **以太坊兼容** - 保留ETH地址格式兼容性  
✅ **.inj域名系统** - 为用户分配自定义.inj域名  
✅ **域名唯一性保证** - 防止重复域名冲突  
✅ **DNS规范验证** - 符合域名格式标准  
✅ **私钥加密存储** - AES-256-GCM加密算法  
✅ **API文档** - 自动生成的Swagger文档  
✅ **Docker支持** - 容器化部署  
✅ **安全配置** - 完整的安全措施  

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm run start:dev

# 构建项目
npm run build

# 运行测试
npm run test

# 格式化代码
npm run format

# 代码检查
npm run lint

# 数据库相关
npm run prisma:generate  # 生成客户端
npm run prisma:push      # 推送架构
npm run prisma:studio    # 打开数据库管理界面
```

## 📞 下一步

1. **测试API**: 运行 `node test-api.js`
2. **查看文档**: 访问 http://localhost:3000/api
3. **集成前端**: 使用API端点集成到您的前端应用
4. **生产部署**: 使用 `docker-compose up -d` 进行生产部署

## 🆘 需要帮助？

- 查看完整文档: [README.md](./README.md)
- 运行设置脚本: `./scripts/setup.sh`
- 检查服务状态: `docker-compose ps`

---

🎉 **恭喜！您的NFC钱包后端API已经准备就绪！** 