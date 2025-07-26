#!/usr/bin/env node

/**
 * 测试脚本：验证后端与链上合约的集成
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 测试数据
const testUID = '04:1a:2b:3c:4d:5e:6f:' + Date.now().toString(16);
const testDomainPrefix = 'test' + Date.now().toString().slice(-4);
const testCatName = 'TestCat' + Date.now().toString().slice(-4);

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

// 主测试函数
async function testContractIntegration() {
    console.log('🚀 开始测试后端与链上合约的集成...\n');

    try {
        // 1. 检查合约状态
        console.log('1️⃣ 检查合约状态...');
        const statusOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/contract/status',
            method: 'GET'
        };

        const statusResult = await makeRequest(statusOptions);
        console.log('合约状态:', JSON.stringify(statusResult.data, null, 2));

        if (!statusResult.data.nfcRegistry || !statusResult.data.domainNFT || !statusResult.data.catNFT) {
            console.log('❌ 合约初始化失败，请检查配置');
            return;
        }

        // 2. 测试创建空白卡账户
        console.log('\n2️⃣ 测试创建空白卡账户...');
        const createOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/create-account',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const createResult = await makeRequest(createOptions, { uid: testUID });
        console.log('创建账户结果:', JSON.stringify(createResult.data, null, 2));

        if (createResult.status !== 201) {
            console.log('❌ 创建账户失败');
            return;
        }

        const userAddress = createResult.data.address;

        // 3. 等待初始资金到账
        console.log('\n3️⃣ 等待初始资金到账...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. 测试域名NFT铸造
        console.log('\n4️⃣ 测试域名NFT铸造...');
        const domainOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/domain/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const domainResult = await makeRequest(domainOptions, {
            uid: testUID,
            domainPrefix: testDomainPrefix
        });
        console.log('域名NFT铸造结果:', JSON.stringify(domainResult.data, null, 2));

        // 5. 测试小猫NFT抽卡
        console.log('\n5️⃣ 测试小猫NFT抽卡...');
        const catOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/cat/draw',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const catResult = await makeRequest(catOptions, {
            uid: testUID,
            catName: testCatName
        });
        console.log('小猫NFT抽卡结果:', JSON.stringify(catResult.data, null, 2));

        // 6. 查询用户信息
        console.log('\n6️⃣ 查询最终用户信息...');
        const userOptions = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/user/info/${testUID}`,
            method: 'GET'
        };

        const userResult = await makeRequest(userOptions);
        console.log('用户最终信息:', JSON.stringify(userResult.data, null, 2));

        console.log('\n✅ 合约集成测试完成！');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
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

// 启动测试
async function main() {
    console.log('🔍 检查服务状态...');

    const isRunning = await checkServiceRunning();
    if (!isRunning) {
        console.log('❌ 后端服务未运行，请先启动服务:');
        console.log('   cd /home/amyseer/injective/nfc-wallet-backend');
        console.log('   npm run start:dev');
        return;
    }

    console.log('✅ 后端服务正在运行\n');
    await testContractIntegration();
}

main().catch(console.error);
