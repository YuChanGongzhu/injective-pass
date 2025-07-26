# 社交抽卡系统备份说明

## 备份时间
2025年7月26日

## 备份原因
由于苹果用户在网页端无法使用 NFC 功能，为了保证系统的兼容性和用户体验，决定暂时回退到传统抽卡机制。社交抽卡功能留作未来移动端 APP 开发时使用。

## 备份内容

### 1. 合约文件
- **位置**: `/home/amyseer/injective/foundry-inj/src/CatNFT_SocialDraw_Backup.sol`
- **说明**: 完整的社交抽卡合约实现，包含以下特性：
  - 社交抽卡机制（需要贴其他用户 NFC 卡片）
  - 防女巫攻击（每对 NFC 只能互动一次）
  - 社交奖励系统（基于互动次数提升稀有度概率）
  - 授权操作者机制
  - 双向互动记录

### 2. 后端实现
- **位置**: `/home/amyseer/injective/nfc-wallet-backend/backup/social-draw-implementation/`
- **包含**:
  - `nfc/` - NFC 服务和控制器
  - `contract/` - 合约交互服务
  - 社交抽卡相关的 DTO 和 API 端点

### 3. 社交抽卡特性详情

#### 合约层面
- `socialDrawCatNFT()` - 社交抽卡主要方法
- `socialInteractions` - 互动记录映射
- `drawCounts` - 抽卡次数统计
- `interactedNFCs` - 已互动 NFC 列表
- `_generateSocialRarity()` - 基于社交的稀有度生成
- `getSocialBonus()` - 社交奖励查询

#### 后端层面
- 社交抽卡 API 端点
- 社交统计查询
- NFC 互动验证
- 社交奖励计算

#### 概率机制
- 基础概率: R(60%) > SR(30%) > SSR(9%) > UR(1%)
- 社交奖励: 每次互动增加 0.5% 高稀有度概率
- UR 概率提升最多 25%
- SSR 概率提升最多 50%
- SR 概率提升最多 100%

## 已部署的社交抽卡合约地址
- **NFCWalletRegistry**: `0x89E79D907712083F66F1E2926E70641D197Ce836`
- **INJDomainNFT**: `0x60d52a10a2Bd94Db6cd3e5A228816C2D4d2268AF`
- **CatNFT (社交版)**: `0xd3A7A41e62C6586e852a4792C3b8bcCCA823cac4`

## 回退计划
1. 恢复传统抽卡合约（无 NFC 依赖）
2. 简化后端实现，移除 NFC 相关逻辑
3. 重新部署传统版本合约
4. 更新前端实现

## 未来使用
当开发移动端 APP 或 NFC 技术在网页端得到更好支持时，可以使用此备份恢复社交抽卡功能。

## 技术优势
社交抽卡系统具有以下优势，值得未来重新启用：
- 增强社交互动
- 防止女巫攻击
- 提供社交奖励机制
- 真实的物理互动验证
- 独特的游戏体验

---
*备份创建者: GitHub Copilot*
*备份日期: 2025年7月26日*
