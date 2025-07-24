#!/usr/bin/env node

/**
 * 卡片所有权历史功能测试脚本
 * 测试NFT卡片的历史所有者记录、查询和转移功能
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 测试数据
const testUID1 = '04:aa:bb:cc:dd:ee:ff:' + Date.now().toString(16);
const testUID2 = '04:11:22:33:44:55:66:' + (Date.now() + 1000).toString(16);

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

function validateOwnershipHistory(history) {
    return Array.isArray(history.ownershipHistory) &&
        typeof history.ownershipCount === 'number' &&
        typeof history.currentOwner === 'string';
}

// 主测试函数
async function testCardOwnershipFeatures() {
    console.log('🚀 开始测试卡片所有权历史功能...\n');

    const testResults = {
        cardAddresses: {},
        ownershipData: {}
    };

    try {
        // Test 1: 注册两张NFC卡片
        console.log('📝 Test 1: 注册两张NFC卡片');

        for (const uid of [testUID1, testUID2]) {
            const registerResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/nfc/register',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, { uid });

            if (registerResponse.status === 201) {
                console.log(`✅ NFC卡片 ${uid} 注册成功`);
                console.log(`   地址: ${registerResponse.data.address}`);
                testResults.cardAddresses[uid] = registerResponse.data.address;

                if (!validateInjectiveAddress(registerResponse.data.address)) {
                    console.log('❌ 生成的地址格式不正确');
                    return;
                }
            } else {
                console.log(`❌ NFC卡片 ${uid} 注册失败:`, registerResponse.data);
                return;
            }
        }

        // 等待链上交易确认和NFT铸造
        console.log('\n⏳ 等待链上交易确认和NFT铸造...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 2: 检查初始所有权历史
        console.log('\n📊 Test 2: 检查初始所有权历史');

        for (const uid of [testUID1, testUID2]) {
            const historyResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/nfc/ownership-history/${uid}`,
                method: 'GET'
            });

            if (historyResponse.status === 200) {
                const history = historyResponse.data;
                console.log(`✅ 成功获取 ${uid} 的所有权历史`);
                console.log(`   Token ID: ${history.tokenId}`);
                console.log(`   当前所有者: ${history.currentOwner}`);
                console.log(`   历史所有者数量: ${history.ownershipCount}`);
                console.log(`   创建时间: ${new Date(history.createdAt * 1000).toISOString()}`);

                if (history.ownershipHistory && history.ownershipHistory.length > 0) {
                    console.log(`   首次拥有记录:`);
                    const firstRecord = history.ownershipHistory[0];
                    console.log(`     所有者: ${firstRecord.owner}`);
                    console.log(`     原因: ${firstRecord.transferReason}`);
                    console.log(`     时长: ${firstRecord.duration} 秒`);
                }

                if (!validateOwnershipHistory(history)) {
                    console.log('❌ 所有权历史格式不正确');
                    return;
                }

                testResults.ownershipData[uid] = history;
            } else {
                console.log(`❌ 获取 ${uid} 所有权历史失败:`, historyResponse.data);
                return;
            }
        }

        // Test 3: 检查拥有历史
        console.log('\n🔍 Test 3: 检查特定地址的拥有历史');

        for (const uid of [testUID1, testUID2]) {
            const ownerAddress = testResults.cardAddresses[uid];

            const checkResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/nfc/check-ownership/${uid}/${ownerAddress}`,
                method: 'GET'
            });

            if (checkResponse.status === 200) {
                const ownershipInfo = checkResponse.data;
                console.log(`✅ 成功检查 ${uid} 的拥有情况`);
                console.log(`   地址 ${ownerAddress}:`);
                console.log(`   是否曾经拥有: ${ownershipInfo.hasOwned}`);
                console.log(`   总拥有时长: ${ownershipInfo.totalDuration} 秒`);
                console.log(`   拥有次数: ${ownershipInfo.ownershipPeriods}`);

                if (!ownershipInfo.hasOwned) {
                    console.log('❌ 当前所有者应该显示为曾经拥有');
                    return;
                }
            } else {
                console.log(`❌ 检查 ${uid} 拥有情况失败:`, checkResponse.data);
                return;
            }
        }

        // Test 4: 批量获取所有者信息
        console.log('\n📦 Test 4: 批量获取所有者信息');

        const batchOwnersResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/batch-owners',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            uids: [testUID1, testUID2, 'non-existent-uid']
        });

        if (batchOwnersResponse.status === 200) {
            const ownersInfo = batchOwnersResponse.data;
            console.log('✅ 批量获取所有者信息成功');
            console.log(`   查询了 ${ownersInfo.length} 个卡片的所有者信息`);

            ownersInfo.forEach((info, index) => {
                console.log(`   ${index + 1}. ${info.nfcUID}:`);
                console.log(`      当前所有者: ${info.currentOwner || '无'}`);
                console.log(`      历史所有者数量: ${info.ownershipCount}`);
            });
        } else {
            console.log('❌ 批量获取所有者信息失败:', batchOwnersResponse.data);
            return;
        }

        // Test 5: 测试解绑和所有权结束记录
        console.log('\n🔓 Test 5: 测试解绑和所有权结束记录');

        // 解绑第一张卡片
        const unbindResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/unbind',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            uid: testUID1,
            resetToBlank: true
        });

        if (unbindResponse.status === 200) {
            const result = unbindResponse.data;
            console.log(`✅ NFC卡片 ${testUID1} 解绑成功`);
            console.log(`   NFT销毁: ${result.nftBurned}`);
            console.log(`   链上解绑: ${result.nfcUnbound}`);
        } else {
            console.log(`❌ 解绑 ${testUID1} 失败:`, unbindResponse.data);
            return;
        }

        // 等待解绑交易确认
        console.log('\n⏳ 等待解绑交易确认...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 6: 检查解绑后的所有权历史
        console.log('\n📊 Test 6: 检查解绑后的所有权历史');

        const afterUnbindHistoryResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/nfc/ownership-history/${testUID1}`,
            method: 'GET'
        });

        if (afterUnbindHistoryResponse.status === 200) {
            const history = afterUnbindHistoryResponse.data;
            console.log(`✅ 解绑后仍能获取 ${testUID1} 的所有权历史`);
            console.log(`   历史所有者数量: ${history.ownershipCount}`);
            console.log(`   最后转移时间: ${new Date(history.lastTransferAt * 1000).toISOString()}`);

            if (history.ownershipHistory && history.ownershipHistory.length > 0) {
                const lastRecord = history.ownershipHistory[history.ownershipHistory.length - 1];
                console.log(`   最后一条记录:`);
                console.log(`     转移原因: ${lastRecord.transferReason}`);
                console.log(`     结束时间: ${lastRecord.toTimestamp ? new Date(lastRecord.toTimestamp * 1000).toISOString() : '当前'}`);

                if (lastRecord.transferReason !== 'unbind') {
                    console.log('❌ 最后一条记录应该是unbind');
                    return;
                }
            }
        } else if (afterUnbindHistoryResponse.status === 400) {
            console.log(`✅ 解绑后的卡片正确返回了"没有对应NFT"的错误`);
        } else {
            console.log(`❌ 解绑后检查历史失败:`, afterUnbindHistoryResponse.data);
            return;
        }

        // Test 7: 验证历史拥有信息仍然可查
        console.log('\n🔍 Test 7: 验证历史拥有信息持久性');

        const originalOwner = testResults.cardAddresses[testUID1];
        const persistentCheckResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/nfc/check-ownership/${testUID1}/${originalOwner}`,
            method: 'GET'
        });

        if (persistentCheckResponse.status === 200) {
            const ownershipInfo = persistentCheckResponse.data;
            console.log(`✅ 解绑后仍能查询历史拥有信息`);
            console.log(`   是否曾经拥有: ${ownershipInfo.hasOwned}`);
            console.log(`   总拥有时长: ${ownershipInfo.totalDuration} 秒`);

            if (!ownershipInfo.hasOwned || ownershipInfo.totalDuration === 0) {
                console.log('❌ 历史拥有信息应该被保留');
                return;
            }
        } else {
            console.log(`❌ 检查历史拥有信息失败:`, persistentCheckResponse.data);
            return;
        }

        console.log('\n🎉 所有卡片所有权历史功能测试完成！');
        console.log('\n✅ 测试总结:');
        console.log('   - NFC卡片注册和NFT铸造 ✓');
        console.log('   - 初始所有权记录 ✓');
        console.log('   - 历史拥有查询 ✓');
        console.log('   - 批量所有者信息 ✓');
        console.log('   - 解绑和所有权结束 ✓');
        console.log('   - 历史数据持久性 ✓');
        console.log('   - 完整的所有权生命周期追踪 ✓');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.log('\n💡 请确保:');
        console.log('   1. API服务正在运行 (npm run start:dev)');
        console.log('   2. 数据库连接正常');
        console.log('   3. NFT合约已部署并配置');
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
    await testCardOwnershipFeatures();
    console.log('='.repeat(60));
}

main().catch(console.error); 