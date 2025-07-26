#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testNFCRegistration() {
    console.log('🧪 测试 NFC 注册 - 应返回初始资金交易哈希');
    
    try {
        const response = await axios.post(`${BASE_URL}/nfc/register`, {
            uid: "04:aa:bb:cc:dd:ee:ff",
            nickname: "链交互测试卡片"
        });
        
        console.log('✅ NFC注册响应:');
        console.log('- 地址:', response.data.address);
        console.log('- 初始资金状态:', response.data.initialFunded);
        console.log('- 初始资金交易哈希:', response.data.initialFundTxHash || '❌ 未返回');
        console.log('- 是否新钱包:', response.data.isNewWallet);
        
        return response.data;
    } catch (error) {
        console.error('❌ NFC注册失败:', error.response?.data || error.message);
        return null;
    }
}

async function testDomainRegistration(uid) {
    console.log('\n🧪 测试域名注册 - 应返回域名NFT交易哈希');
    
    try {
        const response = await axios.post(`${BASE_URL}/nfc/domain/register`, {
            uid: uid,
            domainPrefix: "testuser" + Date.now()
        });
        
        console.log('✅ 域名注册响应:');
        console.log('- 域名:', response.data.domain);
        console.log('- Token ID:', response.data.tokenId);
        console.log('- 交易哈希:', response.data.txHash);
        console.log('- 注册时间:', response.data.registeredAt);
        
        return response.data;
    } catch (error) {
        console.error('❌ 域名注册失败:', error.response?.data || error.message);
        return null;
    }
}

async function testCatNFTDraw(uid) {
    console.log('\n🧪 测试小猫NFT抽卡 - 应返回抽卡交易哈希');
    
    try {
        const response = await axios.post(`${BASE_URL}/nfc/cat/draw`, {
            nfcUID: uid,
            catName: "链交互测试猫" + Date.now()
        });
        
        console.log('✅ 抽卡响应:');
        console.log('- Token ID:', response.data.tokenId);
        console.log('- 小猫名称:', response.data.name);
        console.log('- 稀有度:', response.data.rarity);
        console.log('- 颜色:', response.data.color);
        console.log('- 交易哈希:', response.data.txHash);
        console.log('- 铸造时间:', response.data.mintedAt);
        
        return response.data;
    } catch (error) {
        console.error('❌ 抽卡失败:', error.response?.data || error.message);
        return null;
    }
}

async function testContractStatus() {
    console.log('\n🧪 测试合约状态检查');
    
    try {
        const response = await axios.get(`${BASE_URL}/contract/status`);
        
        console.log('✅ 合约状态:');
        console.log('- NFC Registry:', response.data.nfcRegistry ? '✅' : '❌');
        console.log('- Domain NFT:', response.data.domainNFT ? '✅' : '❌');
        console.log('- Cat NFT:', response.data.catNFT ? '✅' : '❌');
        console.log('- 网络:', response.data.networkInfo.network);
        console.log('- Chain ID:', response.data.networkInfo.chainId);
        
        return response.data;
    } catch (error) {
        console.error('❌ 合约状态检查失败:', error.response?.data || error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 开始链交互测试...\n');
    
    // 1. 检查合约状态
    await testContractStatus();
    
    // 2. 测试NFC注册（包含初始资金发放）
    const nfcResult = await testNFCRegistration();
    if (!nfcResult) return;
    
    // 等待初始资金到账
    console.log('\n⏳ 等待初始资金交易确认...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. 测试域名注册
    await testDomainRegistration(nfcResult.nfcCard.uid);
    
    // 4. 测试小猫NFT抽卡
    await testCatNFTDraw(nfcResult.nfcCard.uid);
    
    console.log('\n🎉 链交互测试完成！');
}

main().catch(console.error);
