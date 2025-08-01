#!/usr/bin/env node

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8080/api';
const HEALTH_URL = 'http://localhost:8080/health';

// 测试数据
const TEST_NFCS = [
    '04:1a:2b:3c:4d:5e:6f',
    '04:2b:3c:4d:5e:6f:7a'
];

const TEST_DOMAINS = ['alice', 'bob'];
const TEST_CAT_NAMES = ['Lucky Cat', 'Social Cat', 'Test Cat'];

// 颜色代码
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// HTTP 请求封装
async function makeRequest(method, url, data = null) {
    try {
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// 测试函数
async function testHealthCheck() {
    log('\n🔍 测试 1: 健康检查', 'cyan');

    const result = await makeRequest('GET', HEALTH_URL);

    if (result.success) {
        logSuccess(`健康检查通过: ${result.data.status}`);
        logInfo(`时间戳: ${result.data.timestamp}`);
        return true;
    } else {
        logError(`健康检查失败: ${result.error}`);
        return false;
    }
}

async function testNFCRegistration() {
    log('\n🔍 测试 2: NFC 注册', 'cyan');

    for (let i = 0; i < TEST_NFCS.length; i++) {
        const nfcUid = TEST_NFCS[i];
        logInfo(`注册 NFC: ${nfcUid}`);

        const result = await makeRequest('POST', `${BASE_URL}/nfc/register`, {
            uid: nfcUid  // 使用 uid 而不是 nfcUid
        });

        if (result.success) {
            logSuccess(`NFC 注册成功`);
            logInfo(`钱包地址: ${result.data.address}`);
            logInfo(`以太坊地址: ${result.data.ethAddress}`);
            logInfo(`初始资金: ${result.data.initialFunded ? '已发送' : '未发送'}`);
            if (result.data.transactionHash) {
                logInfo(`交易哈希: ${result.data.transactionHash}`);
            }
        } else {
            if (result.status === 409) {
                logWarning(`NFC 已注册: ${nfcUid}`);
            } else {
                logError(`NFC 注册失败: ${JSON.stringify(result.error)}`);
            }
        }

        await delay(1000); // 等待1秒
    }

    return true;
}

async function testWalletQuery() {
    log('\n🔍 测试 3: 钱包查询', 'cyan');

    for (const nfcUid of TEST_NFCS) {
        logInfo(`查询 NFC 钱包: ${nfcUid}`);

        const result = await makeRequest('GET', `${BASE_URL}/nfc/wallet/${nfcUid}`);

        if (result.success) {
            logSuccess(`钱包查询成功`);
            logInfo(`钱包地址: ${result.data.address}`);
            // 注意：钱包查询API可能不包含余额信息，需要单独调用余额API
        } else {
            logError(`钱包查询失败: ${JSON.stringify(result.error)}`);
        }
    }

    return true;
}

async function testDomainCheck() {
    log('\n🔍 测试 4: 域名检查', 'cyan');

    for (const domain of TEST_DOMAINS) {
        logInfo(`检查域名: ${domain}.inj`);

        const result = await makeRequest('GET', `${BASE_URL}/nfc/domain/check?domain=${domain}`);

        if (result.success) {
            logSuccess(`域名检查成功`);
            logInfo(`域名: ${result.data.domain} - ${result.data.available ? '可用' : '已占用'}`);
        } else {
            logError(`域名检查失败: ${JSON.stringify(result.error)}`);
        }
    }

    return true;
}

async function testDomainRegistration() {
    log('\n🔍 测试 5: 域名注册', 'cyan');

    for (let i = 0; i < Math.min(TEST_NFCS.length, TEST_DOMAINS.length); i++) {
        const nfcUid = TEST_NFCS[i];
        const domainName = TEST_DOMAINS[i];

        logInfo(`为 NFC ${nfcUid} 注册域名: ${domainName}.inj`);

        const result = await makeRequest('POST', `${BASE_URL}/nfc/domain/register`, {
            uid: nfcUid,                    // 使用 uid 而不是 nfcUid
            domainPrefix: domainName        // 使用 domainPrefix 而不是 domainName
        });

        if (result.success) {
            logSuccess(`域名注册成功`);
            logInfo(`域名: ${result.data.domain}`);
            logInfo(`Token ID: ${result.data.tokenId}`);
            if (result.data.transactionHash) {
                logInfo(`交易哈希: ${result.data.transactionHash}`);
            }
        } else {
            if (result.status === 409) {
                logWarning(`域名已注册: ${domainName}.inj`);
            } else {
                logError(`域名注册失败: ${JSON.stringify(result.error)}`);
            }
        }

        await delay(2000); // 等待2秒，因为需要链上确认
    }

    return true;
}

async function testSocialInteraction() {
    log('\n🔍 测试 6: 社交互动', 'cyan');

    if (TEST_NFCS.length < 2) {
        logWarning('需要至少2个NFC进行社交互动测试');
        return false;
    }

    const myNFC = TEST_NFCS[0];
    const otherNFC = TEST_NFCS[1];

    logInfo(`社交互动: ${myNFC} 与 ${otherNFC}`);

    const result = await makeRequest('POST', `${BASE_URL}/nfc/social-interaction`, {
        myNFC: myNFC,
        otherNFC: otherNFC
    });

    if (result.success) {
        logSuccess(`社交互动成功`);
        logInfo(`奖励抽卡券: ${result.data.rewardTickets}`);
        logInfo(`总抽卡券: ${result.data.totalTickets}`);
        if (result.data.transactionHash) {
            logInfo(`交易哈希: ${result.data.transactionHash}`);
        }
        logInfo(`消息: ${result.data.message}`);

        await delay(3000); // 等待3秒让交易确认
        return true;
    } else {
        if (result.error.message && result.error.message.includes('already interacted')) {
            logWarning('这两个NFC已经互动过了');
            return true;
        } else {
            logError(`社交互动失败: ${JSON.stringify(result.error)}`);
            return false;
        }
    }
}

async function testDrawStats() {
    log('\n🔍 测试 7: 抽卡统计查询', 'cyan');

    for (const nfcUid of TEST_NFCS) {
        logInfo(`查询 NFC 抽卡统计: ${nfcUid}`);

        const result = await makeRequest('GET', `${BASE_URL}/nfc/draw-stats/${nfcUid}`);

        if (result.success) {
            logSuccess(`抽卡统计查询成功`);
            logInfo(`可用抽卡次数: ${result.data.availableDraws}`);
            logInfo(`已使用次数: ${result.data.usedDraws}`);
            logInfo(`总获得次数: ${result.data.totalDraws}`);
            logInfo(`社交奖励: ${result.data.socialBonus}`);
        } else {
            logError(`抽卡统计查询失败: ${JSON.stringify(result.error)}`);
        }
    }

    return true;
}

async function testSocialStats() {
    log('\n🔍 测试 8: 社交统计查询', 'cyan');

    for (const nfcUid of TEST_NFCS) {
        logInfo(`查询 NFC 社交统计: ${nfcUid}`);

        const result = await makeRequest('GET', `${BASE_URL}/nfc/cat/social/${nfcUid}`);

        if (result.success) {
            logSuccess(`社交统计查询成功`);
            logInfo(`社交奖励: ${result.data.socialBonus}`);
            logInfo(`互动过的NFC数量: ${result.data.interactedNFCs.length}`);
            logInfo(`总互动次数: ${result.data.totalInteractions}`);
            if (result.data.interactedNFCs.length > 0) {
                logInfo(`互动过的NFC: ${result.data.interactedNFCs.join(', ')}`);
            }
        } else {
            logError(`社交统计查询失败: ${JSON.stringify(result.error)}`);
        }
    }

    return true;
}

async function testCatDrawWithTickets() {
    log('\n🔍 测试 9: 使用抽卡券抽卡', 'cyan');

    // 检查第一个NFC是否有抽卡券
    const nfcUid = TEST_NFCS[0];
    const statsResult = await makeRequest('GET', `${BASE_URL}/nfc/draw-stats/${nfcUid}`);

    if (!statsResult.success || statsResult.data.availableDraws === 0) {
        logWarning(`NFC ${nfcUid} 没有可用的抽卡券，跳过测试`);
        return true;
    }

    logInfo(`使用抽卡券抽卡: NFC ${nfcUid}`);

    const result = await makeRequest('POST', `${BASE_URL}/nfc/draw-cat-with-tickets`, {
        nfcUid: nfcUid,
        catName: TEST_CAT_NAMES[1] // Social Cat
    });

    if (result.success) {
        logSuccess(`抽卡券抽卡成功`);
        logInfo(`Token ID: ${result.data.tokenId}`);
        logInfo(`猫咪名称: ${result.data.catName}`);
        logInfo(`稀有度: ${result.data.rarity}`);
        logInfo(`颜色: ${result.data.color}`);
        logInfo(`剩余抽卡券: ${result.data.remainingTickets}`);
        if (result.data.transactionHash) {
            logInfo(`交易哈希: ${result.data.transactionHash}`);
        }

        await delay(3000); // 等待交易确认
        return true;
    } else {
        logError(`抽卡券抽卡失败: ${JSON.stringify(result.error)}`);
        return false;
    }
}

async function testSystemStats() {
    log('\n🔍 测试 10: 系统统计', 'cyan');

    const result = await makeRequest('GET', `${BASE_URL}/nfc/stats`);

    if (result.success) {
        logSuccess(`系统统计查询成功`);
        logInfo(`总钱包数: ${result.data.totalWallets}`);
        logInfo(`总NFC数: ${result.data.totalNFCs}`);
        logInfo(`总域名数: ${result.data.totalDomains}`);
        logInfo(`总猫咪数: ${result.data.totalCats}`);
        return true;
    } else {
        logError(`系统统计查询失败: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// 主测试函数
async function runQuickTest() {
    log('🚀 开始 Injective Pass 快速测试', 'magenta');
    log(`📡 目标服务: ${BASE_URL}`, 'blue');
    log(`⏰ 测试时间: ${new Date().toLocaleString()}`, 'blue');

    const tests = [
        { name: '健康检查', fn: testHealthCheck },
        { name: 'NFC注册', fn: testNFCRegistration },
        { name: '钱包查询', fn: testWalletQuery },
        { name: '域名检查', fn: testDomainCheck },
        { name: '域名注册', fn: testDomainRegistration },
        { name: '社交互动', fn: testSocialInteraction },
        { name: '抽卡统计', fn: testDrawStats },
        { name: '社交统计', fn: testSocialStats },
        { name: '抽卡券抽卡', fn: testCatDrawWithTickets },
        { name: '系统统计', fn: testSystemStats }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            logError(`测试 ${test.name} 发生异常: ${error.message}`);
            failed++;
        }
    }

    // 测试总结
    log('\n📊 测试总结', 'magenta');
    log(`✅ 通过: ${passed}`, 'green');
    log(`❌ 失败: ${failed}`, 'red');
    log(`📈 总计: ${passed + failed}`, 'blue');

    if (failed === 0) {
        log('\n🎉 所有测试通过！系统运行正常', 'green');
    } else {
        log('\n⚠️  有测试失败，请检查系统状态', 'yellow');
    }

    log(`\n⏱️  测试完成时间: ${new Date().toLocaleString()}`, 'blue');
}

// 检查依赖
async function checkDependencies() {
    try {
        require('axios');
        return true;
    } catch (error) {
        log('❌ 缺少依赖: axios', 'red');
        log('请运行: npm install axios', 'yellow');
        return false;
    }
}

// 启动测试
async function main() {
    if (!(await checkDependencies())) {
        process.exit(1);
    }

    await runQuickTest();
}

// 处理命令行参数
if (require.main === module) {
    main().catch(error => {
        logError(`测试过程中发生错误: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    runQuickTest,
    makeRequest
};
