#!/usr/bin/env node

/**
 * Injective NFC钱包API测试脚本
 * 验证Injective地址生成和NFC钱包功能
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 测试数据
const testUID = '04:1a:2b:3c:4d:5e:6f:' + Date.now().toString(16);
const testUsername = 'injuser_' + Date.now();

// HTTP请求工具函数
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: body ? JSON.parse(body) : null
                    };
                    resolve(result);
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: body
                    });
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

// Injective地址验证函数
function validateInjectiveAddress(address) {
    return address && address.startsWith('inj') && address.length >= 40;
}

function validateEthereumAddress(address) {
    return address && address.startsWith('0x') && address.length === 42;
}

// 测试函数
async function testInjectiveAPI() {
    console.log('🚀 开始测试Injective NFC钱包API...\n');

    try {
        // 测试1: 健康检查
        console.log('📊 测试1: 获取统计信息');
        const statsResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/stats',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`状态码: ${statsResponse.status}`);
        if (statsResponse.status === 200) {
            console.log('✅ 统计信息获取成功:', statsResponse.data);
        } else {
            console.log('❌ 统计信息获取失败:', statsResponse.data);
        }
        console.log('');

        // 测试2: 注册NFC卡片并验证Injective地址
        console.log('📱 测试2: 注册NFC卡片 (Injective地址生成)');
        console.log(`测试UID: ${testUID}`);

        const registerResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { uid: testUID });

        console.log(`状态码: ${registerResponse.status}`);
        if (registerResponse.status === 200) {
            const walletData = registerResponse.data;
            console.log('✅ NFC注册成功:', walletData);

            // 验证地址格式
            console.log('\n🔍 地址格式验证:');
            console.log(`Injective地址: ${walletData.address}`);
            console.log(`以太坊地址: ${walletData.ethAddress}`);

            const isValidInjAddress = validateInjectiveAddress(walletData.address);
            const isValidEthAddress = validateEthereumAddress(walletData.ethAddress);

            console.log(`✅ Injective地址格式正确: ${isValidInjAddress ? '是' : '否'}`);
            console.log(`✅ 以太坊地址格式正确: ${isValidEthAddress ? '是' : '否'}`);
            console.log(`✅ 是否为新钱包: ${walletData.isNewWallet ? '是' : '否'}`);

            // 测试3: 设置用户名
            console.log('\n👤 测试3: 设置用户名');
            console.log(`测试用户名: ${testUsername}`);

            const usernameResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/user/username',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            }, { uid: testUID, username: testUsername });

            console.log(`状态码: ${usernameResponse.status}`);
            if (usernameResponse.status === 200) {
                console.log('✅ 用户名设置成功:', usernameResponse.data);

                // 测试4: 获取用户资料
                console.log('\n📋 测试4: 获取用户资料');
                const profileResponse = await makeRequest({
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/user/profile/${testUID}`,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log(`状态码: ${profileResponse.status}`);
                if (profileResponse.status === 200) {
                    const profileData = profileResponse.data;
                    console.log('✅ 用户资料获取成功:', profileData);

                    // 验证数据一致性
                    console.log('\n🔄 数据一致性验证:');
                    console.log(`钱包地址一致: ${profileData.address === walletData.address ? '✅' : '❌'}`);
                    console.log(`用户名一致: ${profileData.username === testUsername ? '✅' : '❌'}`);

                } else {
                    console.log('❌ 用户资料获取失败:', profileResponse.data);
                }

                // 测试5: 重复注册测试
                console.log('\n🔄 测试5: 重复注册测试');
                const duplicateResponse = await makeRequest({
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/nfc/register',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }, { uid: testUID });

                if (duplicateResponse.status === 200) {
                    const duplicateData = duplicateResponse.data;
                    console.log('✅ 重复注册处理正确:', duplicateData);
                    console.log(`是否返回现有钱包: ${!duplicateData.isNewWallet ? '✅' : '❌'}`);
                    console.log(`地址一致性: ${duplicateData.address === walletData.address ? '✅' : '❌'}`);
                }

            } else {
                console.log('❌ 用户名设置失败:', usernameResponse.data);
            }

        } else {
            console.log('❌ NFC注册失败:', registerResponse.data);
        }

        console.log('\n🎉 Injective NFC钱包测试完成！');
        console.log('\n📚 API文档地址: http://localhost:3000/api');
        console.log('\n🌐 Injective网络特性:');
        console.log('   - 使用Cosmos地址格式 (inj开头)');
        console.log('   - 兼容以太坊私钥');
        console.log('   - 支持EVM智能合约');
        console.log('   - 跨链兼容性');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.log('\n💡 请确保API服务正在运行 (npm run start:dev)');
    }
}

// 检查服务是否运行
async function checkServer() {
    try {
        await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/stats',
            method: 'GET',
            timeout: 3000
        });
        return true;
    } catch (error) {
        return false;
    }
}

// 主函数
async function main() {
    const isServerRunning = await checkServer();

    if (!isServerRunning) {
        console.log('❌ Injective API服务未运行');
        console.log('请先启动服务: npm run start:dev');
        console.log('然后再运行此测试: node test-injective-api.js');
        process.exit(1);
    }

    await testInjectiveAPI();
}

main().catch(console.error); 