#!/usr/bin/env node

/**
 * NFC解绑功能测试脚本
 * 测试NFC卡片解绑、重置为空白状态和NFT销毁功能
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 测试数据
const testUID = '04:1a:2b:3c:4d:5e:6f:' + Date.now().toString(16);

// HTTP请求工具函数
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
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

// 验证函数
function validateInjectiveAddress(address) {
    return address && address.startsWith('inj') && address.length >= 42;
}

function validateNFCStatus(status) {
    return typeof status.status === 'number' &&
        ['blank', 'bound', 'frozen'].includes(status.description);
}

// 主测试函数
async function testNFCUnbindFeatures() {
    console.log('🚀 开始测试NFC解绑功能...\n');

    try {
        // Test 1: 注册NFC卡片
        console.log('📝 Test 1: 注册NFC卡片');
        const registerResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { uid: testUID });

        if (registerResponse.status === 201) {
            console.log('✅ NFC卡片注册成功');
            console.log(`   地址: ${registerResponse.data.address}`);
            console.log(`   以太坊地址: ${registerResponse.data.ethAddress}`);
            console.log(`   UID: ${registerResponse.data.uid}`);

            if (!validateInjectiveAddress(registerResponse.data.address)) {
                console.log('❌ 生成的地址格式不正确');
                return;
            }
        } else {
            console.log('❌ NFC卡片注册失败:', registerResponse.data);
            return;
        }

        // 等待链上交易确认
        console.log('\n⏳ 等待链上交易确认...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 2: 检查初始状态
        console.log('\n📊 Test 2: 检查NFC卡片初始状态');
        const initialStatusResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/nfc/status/${testUID}`,
            method: 'GET'
        });

        if (initialStatusResponse.status === 200) {
            const status = initialStatusResponse.data;
            console.log('✅ 成功获取NFC状态');
            console.log(`   状态: ${status.description} (${status.status})`);
            console.log(`   是否空白: ${status.isBlank}`);
            console.log(`   是否已绑定: ${status.isBound}`);
            console.log(`   钱包地址: ${status.walletAddress}`);
            console.log(`   NFT Token ID: ${status.nftTokenId || '无'}`);
            console.log(`   历史绑定次数: ${status.bindingHistory}`);

            if (!validateNFCStatus(status)) {
                console.log('❌ NFC状态格式不正确');
                return;
            }

            if (!status.isBound) {
                console.log('❌ NFC应该处于绑定状态');
                return;
            }
        } else {
            console.log('❌ 获取NFC状态失败:', initialStatusResponse.data);
            return;
        }

        // Test 3: 解绑NFC卡片（重置为空白状态）
        console.log('\n🔓 Test 3: 解绑NFC卡片并重置为空白状态');
        const unbindResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/unbind',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            uid: testUID,
            resetToBlank: true,
            ownerSignature: '0x' // 暂时使用空签名
        });

        if (unbindResponse.status === 200) {
            const result = unbindResponse.data;
            console.log('✅ NFC解绑成功');
            console.log(`   整体成功: ${result.success}`);
            console.log(`   链上解绑: ${result.nfcUnbound}`);
            console.log(`   NFT销毁: ${result.nftBurned}`);
            console.log(`   消息: ${result.message}`);

            if (!result.success) {
                console.log('❌ 解绑操作未完全成功');
                return;
            }
        } else {
            console.log('❌ NFC解绑失败:', unbindResponse.data);
            return;
        }

        // 等待链上交易确认
        console.log('\n⏳ 等待链上解绑交易确认...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 4: 检查解绑后状态
        console.log('\n📊 Test 4: 检查解绑后的NFC状态');
        const afterUnbindStatusResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/nfc/status/${testUID}`,
            method: 'GET'
        });

        if (afterUnbindStatusResponse.status === 200) {
            const status = afterUnbindStatusResponse.data;
            console.log('✅ 成功获取解绑后状态');
            console.log(`   状态: ${status.description} (${status.status})`);
            console.log(`   是否空白: ${status.isBlank}`);
            console.log(`   是否已绑定: ${status.isBound}`);
            console.log(`   钱包地址: ${status.walletAddress || '无'}`);
            console.log(`   NFT Token ID: ${status.nftTokenId || '无'}`);
            console.log(`   历史绑定次数: ${status.bindingHistory}`);

            // 验证卡片已变为空白状态
            if (!status.isBlank) {
                console.log('❌ 卡片应该处于空白状态');
                return;
            }

            if (status.isBound) {
                console.log('❌ 卡片不应该处于绑定状态');
                return;
            }

            if (status.bindingHistory === 0) {
                console.log('❌ 应该保留历史绑定记录');
                return;
            }

            console.log('✅ 卡片已成功重置为空白状态，保留了历史记录');
        } else {
            console.log('❌ 获取解绑后状态失败:', afterUnbindStatusResponse.data);
            return;
        }

        // Test 5: 尝试重新注册相同UID
        console.log('\n🔄 Test 5: 测试重新注册相同NFC UID');
        const reRegisterResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { uid: testUID });

        if (reRegisterResponse.status === 201) {
            console.log('✅ 空白卡片重新注册成功');
            console.log(`   新地址: ${reRegisterResponse.data.address}`);
            console.log(`   UID: ${reRegisterResponse.data.uid}`);
            console.log('✅ 卡片生命周期测试完成：注册 -> 解绑重置 -> 重新注册');
        } else {
            console.log('❌ 重新注册失败:', reRegisterResponse.data);
            return;
        }

        // Test 6: 批量状态查询
        console.log('\n📊 Test 6: 测试批量状态查询');
        const batchStatusResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/batch-status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            uids: [testUID, 'non-existent-uid', '04:aa:bb:cc:dd:ee:ff']
        });

        if (batchStatusResponse.status === 200) {
            const statuses = batchStatusResponse.data;
            console.log('✅ 批量状态查询成功');
            console.log(`   查询了 ${statuses.length} 个UID的状态`);

            statuses.forEach((status, index) => {
                console.log(`   ${index + 1}. ${status.uid}: ${status.description}`);
            });
        } else {
            console.log('❌ 批量状态查询失败:', batchStatusResponse.data);
            return;
        }

        console.log('\n🎉 所有NFC解绑功能测试完成！');
        console.log('\n✅ 测试总结:');
        console.log('   - NFC卡片注册和钱包生成 ✓');
        console.log('   - NFC状态查询 ✓');
        console.log('   - NFC解绑和NFT销毁 ✓');
        console.log('   - 卡片重置为空白状态 ✓');
        console.log('   - 历史记录保留 ✓');
        console.log('   - 空白卡片重新注册 ✓');
        console.log('   - 批量状态查询 ✓');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.log('\n💡 请确保:');
        console.log('   1. API服务正在运行 (npm run start:dev)');
        console.log('   2. 数据库连接正常');
        console.log('   3. 智能合约已部署并配置');
        console.log('   4. 合约服务已正确初始化');
    }
}

// 检查服务器状态
async function checkServer() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/stats',
            method: 'GET'
        });

        if (response.status === 200) {
            console.log('✅ API服务运行正常');
            console.log(`📊 当前统计: ${JSON.stringify(response.data, null, 2)}`);
            return true;
        } else {
            console.log('❌ API服务状态异常');
            return false;
        }
    } catch (error) {
        console.log('❌ 无法连接到API服务');
        return false;
    }
}

async function main() {
    console.log('🔍 检查API服务状态...\n');

    const serverOk = await checkServer();
    if (!serverOk) {
        console.log('\n💡 请先启动API服务: npm run start:dev');
        return;
    }

    console.log('\n' + '='.repeat(60));
    await testNFCUnbindFeatures();
    console.log('='.repeat(60));
}

main().catch(console.error); 