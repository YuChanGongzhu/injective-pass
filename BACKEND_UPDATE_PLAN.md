# 后端合约交互逻辑更新计划

## 🚨 关键问题分析

### 1. 权限控制问题
- **问题**: 新合约添加了 `onlyAuthorizedOperator` 修饰符
- **状态**: ✅ 已解决 - 主账户在部署时已被授权为操作者
- **影响**: 无需修改

### 2. NFC所有权验证 
- **问题**: 新合约要求调用者必须拥有相关NFC
- **状态**: ❌ 需要修改 - 后端使用主账户调用，但验证要求用户账户
- **影响**: 所有涉及NFC的函数调用都会失败

### 3. 缺少NFCWalletRegistry交互
- **问题**: 后端没有调用 `detectAndBindBlankCard` 来绑定NFC
- **状态**: ❌ 需要添加 - 新用户无法获得授权
- **影响**: 新用户无法使用合约功能

### 4. 传统抽卡功能被移除
- **问题**: 合约中的 `drawCatNFT` 被注释，但后端还在调用
- **状态**: ❌ 需要修改 - 函数不存在会导致调用失败
- **影响**: `drawCatNFTTraditional` 功能无法使用

## 🔧 必需的代码修改

### A. 添加NFCWalletRegistry交互逻辑

#### 需要添加的函数：
1. `detectAndBindBlankCard(nfcUID, userWalletAddress)` - 绑定新NFC并自动授权
2. `isNFCBound(nfcUID)` - 检查NFC是否已绑定
3. `getNFCBinding(nfcUID)` - 获取NFC绑定信息

#### 修改位置：
- `src/contract/injective.service.ts` - 添加NFCRegistry交互方法
- `src/nfc/nfc.service.ts` - 在用户注册时调用绑定逻辑

### B. 修复权限验证问题

#### 方案1: 使用用户私钥调用合约（推荐）
```typescript
// 在每个需要验证NFC所有权的函数中，使用用户的私钥创建合约实例
const userWallet = new Wallet(userPrivateKey, this.evmProvider);
const userCatNFTContract = new Contract(catNFTAddress, CatNFTABI, userWallet);
```

#### 方案2: 使用主账户代理调用（需要额外授权）
```typescript
// 需要先调用合约的setAuthorizedOperator函数授权主账户代理用户操作
await this.catNFTContract.setAuthorizedOperator(mainAccountAddress, true);
```

#### 推荐方案1，因为：
- 更符合权限控制的设计理念
- 不需要额外的授权步骤
- 更加安全可控

### C. 修改受影响的函数

#### 1. `mintDomainNFT` 函数
**问题**: 需要验证调用者拥有NFC
**解决方案**: 
```typescript
async mintDomainNFT(
    userPrivateKey: string, // 新增：用户私钥
    ownerAddress: string,
    domainName: string,
    nfcUID: string,
    tokenId: string
): Promise<{ success: boolean; txHash?: string; error?: string; rawTx?: any }> {
    // 使用用户私钥创建合约实例
    const userWallet = new Wallet(userPrivateKey, this.evmProvider);
    const userDomainNFTContract = new Contract(
        this.configService.get<string>('DOMAIN_REGISTRY_ADDRESS'),
        INJDomainNFTABI,
        userWallet
    );

    // 调用合约
    const tx = await userDomainNFTContract.mintDomainNFT(...);
}
```

#### 2. `socialInteraction` 函数
**问题**: 需要验证调用者拥有myNFC
**解决方案**: 同上，使用用户私钥

#### 3. `drawCatNFTWithTickets` 函数
**问题**: 需要验证调用者拥有NFC
**解决方案**: 同上，使用用户私钥

#### 4. `drawCatNFTTraditional` 函数 
**问题**: 合约中该函数已被移除
**解决方案**: 
- 选项A: 移除此功能
- 选项B: 重新启用合约中的传统抽卡功能
- 选项C: 使用 `drawCatNFTWithTickets` 替代，但需要先给用户一些免费票券

### D. 数据库模式修改

#### 需要存储用户私钥
```sql
-- 添加字段存储用户的加密私钥
ALTER TABLE "User" ADD COLUMN "encrypted_private_key" TEXT;
```

#### 加密私钥存储
```typescript
// 使用AES加密存储用户私钥
const encryptedPrivateKey = encrypt(userPrivateKey, AES_KEY);
await this.prisma.user.update({
    where: { id: userId },
    data: { encrypted_private_key: encryptedPrivateKey }
});
```

## 🔄 修改顺序建议

### 阶段1: 添加基础设施
1. ✅ 更新ABI文件（已完成）
2. 📝 添加NFCWalletRegistry交互函数
3. 📝 修改数据库模式存储用户私钥
4. 📝 添加私钥加密/解密逻辑

### 阶段2: 修改核心功能
1. 📝 修改用户注册流程，调用 `detectAndBindBlankCard`
2. 📝 修改 `mintDomainNFT` 使用用户私钥
3. 📝 修改 `socialInteraction` 使用用户私钥
4. 📝 修改 `drawCatNFTWithTickets` 使用用户私钥

### 阶段3: 处理传统抽卡
1. 📝 移除或修改 `drawCatNFTTraditional` 函数
2. 📝 更新相关API端点

### 阶段4: 测试验证
1. 📝 测试新用户注册和授权流程
2. 📝 测试所有合约交互功能
3. 📝 验证权限控制是否正常工作

## ⚠️ 注意事项

1. **安全性**: 用户私钥必须安全加密存储
2. **向后兼容**: 考虑现有用户的迁移方案
3. **错误处理**: 增强错误处理，特别是权限相关错误
4. **Gas费用**: 用户调用需要确保有足够的INJ支付gas费用
5. **并发控制**: 用户并发操作可能导致nonce冲突

## 🚀 立即行动项

**最紧急的修改**:
1. 添加 `detectAndBindBlankCard` 调用到用户注册流程
2. 修改数据库存储用户私钥
3. 修改 `socialInteraction` 和 `drawCatNFTWithTickets` 使用用户私钥调用

这些修改完成后，基本功能就可以正常工作了。
