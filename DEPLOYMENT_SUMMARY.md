# 合约部署总结

## 部署信息

**部署时间:** 2025年7月26日
**网络:** Injective EVM 测试网
**部署者地址:** 0x1dd50ffF32Ecde6694e56C5bBfE902Fcbc8d2441

## 已部署的合约

### 1. NFCWalletRegistry
- **合约地址:** `0x3888E828947DEc728C730F6f0225b473a77C4744`
- **交易哈希:** `0xc213e59afb85479cef6080c4dc9e003942b6af3a9eb86bc4bea66c020c43dd00`
- **功能:** NFC钱包注册系统，实现账户与NFC卡片的一一对应关系

### 2. INJDomainNFT
- **合约地址:** `0x2A9681e0724B906c0634680C1C5E56a58498802E`
- **交易哈希:** `0xc5f6482860fa98b3a7b863b2757d6f468a6588fb7e6b928d7bb9509efb8539ed`
- **功能:** .inj域名NFT系统，将域名作为NFT进行铸造、转移和管理

### 3. CatNFT
- **合约地址:** `0x9a69D69c3927437b9A9A57F7D6c61C9AE0E5C011`
- **交易哈希:** `0xf585ef28bfb9cbf7a7b8dcbe21e0aaaf9912adc467f4aefbd49214a3490f32f0`
- **功能:** 小猫NFT系统，支持R、SR、SSR、UR稀有度抽卡

## 区块链浏览器链接

- **NFCWalletRegistry:** https://testnet.blockscout.injective.network/address/0x3888E828947DEc728C730F6f0225b473a77C4744
- **INJDomainNFT:** https://testnet.blockscout.injective.network/address/0x2A9681e0724B906c0634680C1C5E56a58498802E
- **CatNFT:** https://testnet.blockscout.injective.network/address/0x9a69D69c3927437b9A9A57F7D6c61C9AE0E5C011

## 合约配置

所有合约地址已添加到后端 `.env` 文件中：
```
NFC_REGISTRY_ADDRESS="0x3888E828947DEc728C730F6f0225b473a77C4744"
DOMAIN_REGISTRY_ADDRESS="0x2A9681e0724B906c0634680C1C5E56a58498802E"
CAT_NFT_ADDRESS="0x9a69D69c3927437b9A9A57F7D6c61C9AE0E5C011"
```

## 下一步

1. 修改后端服务，使其与链上合约进行实际交互
2. 更新 `mintDomainNFT` 和 `mintCatNFT` 方法，从模拟调用改为实际合约调用
3. 添加合约 ABI 并实现 ethers.js 合约交互
4. 测试后端与链上合约的集成
