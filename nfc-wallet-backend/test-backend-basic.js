#!/usr/bin/env node

/**
 * 基础测试脚本：验证后端服务和合约状态
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// HTTP请求工具函数
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonBody });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 检查服务是否运行
async function checkServiceRunning() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET'
        });
        return response.status === 200;
    } catch {
        return false;
    }
}

// 检查合约状态
async function checkContractStatus() {
    console.log('🔍 检查合约状态...');

    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/contract/status',
            method: 'GET'
        });

        console.log('合约状态响应:', JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            const { nfcRegistry, domainNFT, catNFT, networkInfo } = response.data;

            console.log(`✅ NFC Registry: ${nfcRegistry ? '已连接' : '未连接'}`);
            console.log(`✅ Domain NFT: ${domainNFT ? '已连接' : '未连接'}`);
            console.log(`✅ Cat NFT: ${catNFT ? '已连接' : '未连接'}`);
            console.log('✅ Network Info:', networkInfo);

            return nfcRegistry && domainNFT && catNFT;
        } else {
            console.log('❌ 合约状态检查失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 合约状态检查错误:', error.message);
        return false;
    }
}

// 测试钱包生成
async function testWalletGeneration() {
    console.log('\n💰 测试钱包生成...');

    try {
        const testUID = '04:1a:2b:3c:4d:5e:6f:' + Date.now().toString(16);

        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/create-account',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { uid: testUID });

        console.log('钱包生成响应:', JSON.stringify(response.data, null, 2));

        if (response.status === 201) {
            console.log('✅ 钱包生成成功');
            return response.data;
        } else {
            console.log('❌ 钱包生成失败');
            return null;
        }
    } catch (error) {
        console.error('❌ 钱包生成错误:', error.message);
        return null;
    }
}

// 测试余额查询
async function testBalanceQuery(address) {
    console.log('\n💳 测试余额查询...');

    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/nfc/balance/${address}`,
            method: 'GET'
        });

        console.log('余额查询响应:', JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            console.log('✅ 余额查询成功');
            return response.data;
        } else {
            console.log('❌ 余额查询失败');
            return null;
        }
    } catch (error) {
        console.error('❌ 余额查询错误:', error.message);
        return null;
    }
}

// 主测试函数
async function runBasicTests() {
    console.log('🚀 开始基础后端测试...\n');

    // 1. 检查服务状态
    console.log('1️⃣ 检查后端服务状态...');
    const isRunning = await checkServiceRunning();
    if (!isRunning) {
        console.log('❌ 后端服务未运行，请先启动服务:');
        console.log('   cd /home/amyseer/injective/nfc-wallet-backend');
        console.log('   npm run start:dev');
        return;
    }
    console.log('✅ 后端服务正在运行');

    // 2. 检查合约状态
    const contractsOk = await checkContractStatus();
    if (!contractsOk) {
        console.log('❌ 合约未正确初始化，请检查配置');
        return;
    }

    // 3. 测试钱包生成
    const walletData = await testWalletGeneration();
    if (!walletData) {
        console.log('❌ 钱包生成测试失败');
        return;
    }

    // 4. 测试余额查询
    const balanceData = await testBalanceQuery(walletData.address);

    console.log('\n🎉 基础测试完成！');
    console.log('总结:');
    console.log('✅ 后端服务运行正常');
    console.log('✅ 合约连接正常');
    console.log('✅ 钱包生成功能正常');
    console.log(`✅ 余额查询功能${balanceData ? '正常' : '可能有问题'}`);
}

// 启动测试
runBasicTests().catch(console.error);
