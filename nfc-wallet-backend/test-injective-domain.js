#!/usr/bin/env node

/**
 * Injective NFC钱包 - .inj域名功能测试脚本
 * 验证自定义.inj域名分配和管理功能
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 测试数据
const testUID = '04:1a:2b:3c:4d:5e:6f:' + Date.now().toString(16);
const testDomainPrefix = 'alice' + Date.now().toString().slice(-4); // alice1234
const testDomainPrefix2 = 'bob' + Date.now().toString().slice(-3);   // bob234

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

// 验证函数
function validateInjectiveAddress(address) {
    return address && address.startsWith('inj') && address.length >= 40;
}

function validateDomain(domain) {
    return domain && domain.endsWith('.inj') && domain.length > 4;
}

// 主测试函数
async function testInjectiveDomainFeatures() {
    console.log('🚀 开始测试Injective NFC钱包 - .inj域名功能...\n');

    try {
        // 测试1: 注册NFC钱包
        console.log('📱 测试1: 注册NFC钱包');
        console.log(`测试UID: ${testUID}`);

        const registerResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { uid: testUID });

        console.log(`状态码: ${registerResponse.status}`);
        if (registerResponse.status !== 200) {
            console.log('❌ NFC注册失败:', registerResponse.data);
            return;
        }

        const walletData = registerResponse.data;
        console.log('✅ NFC注册成功:', walletData);

        // 验证地址格式
        console.log('\n🔍 地址格式验证:');
        console.log(`Injective地址: ${walletData.address}`);
        console.log(`以太坊地址: ${walletData.ethAddress}`);
        console.log(`初始域名: ${walletData.domain || '未设置'}`);

        const isValidInjAddress = validateInjectiveAddress(walletData.address);
        console.log(`✅ Injective地址格式正确: ${isValidInjAddress ? '是' : '否'}`);

        // 测试2: 检查域名可用性
        console.log('\n🔍 测试2: 检查.inj域名可用性');
        console.log(`检查域名前缀: ${testDomainPrefix}`);

        const availabilityResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/user/check-domain/${testDomainPrefix}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`状态码: ${availabilityResponse.status}`);
        if (availabilityResponse.status === 200) {
            console.log(`✅ 域名可用性检查: ${availabilityResponse.data.available ? '可用' : '不可用'}`);
        } else {
            console.log('❌ 域名可用性检查失败:', availabilityResponse.data);
        }

        // 测试3: 设置.inj域名
        console.log('\n🏷️  测试3: 设置.inj域名');
        console.log(`设置域名前缀: ${testDomainPrefix} -> ${testDomainPrefix}.inj`);

        const domainResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/user/domain',
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        }, { uid: testUID, domainPrefix: testDomainPrefix });

        console.log(`状态码: ${domainResponse.status}`);
        if (domainResponse.status === 200) {
            const domainData = domainResponse.data;
            console.log('✅ 域名设置成功:', domainData);

            // 验证域名格式
            const isValidDomain = validateDomain(domainData.domain);
            console.log(`✅ 域名格式正确: ${isValidDomain ? '是' : '否'}`);
            console.log(`✅ 生成的完整域名: ${domainData.domain}`);

        } else {
            console.log('❌ 域名设置失败:', domainResponse.data);
            return;
        }

        // 测试4: 获取用户资料验证域名
        console.log('\n📋 测试4: 获取用户资料验证域名');
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
            const expectedDomain = `${testDomainPrefix}.inj`;
            console.log(`域名一致性: ${profileData.domain === expectedDomain ? '✅' : '❌'}`);
            console.log(`地址一致性: ${profileData.address === walletData.address ? '✅' : '❌'}`);

        } else {
            console.log('❌ 用户资料获取失败:', profileResponse.data);
        }

        // 测试5: 根据域名查找用户
        console.log('\n🔍 测试5: 根据域名查找用户');
        const fullDomain = `${testDomainPrefix}.inj`;
        console.log(`查找域名: ${fullDomain}`);

        const searchResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/user/search/${encodeURIComponent(fullDomain)}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`状态码: ${searchResponse.status}`);
        if (searchResponse.status === 200) {
            console.log('✅ 根据域名查找用户成功:', searchResponse.data);
        } else {
            console.log('❌ 根据域名查找用户失败:', searchResponse.data);
        }

        // 测试6: 域名唯一性验证
        console.log('\n🚫 测试6: 域名唯一性验证');
        console.log(`尝试设置重复域名: ${testDomainPrefix}`);

        // 先注册另一个NFC卡片
        const testUID2 = testUID.replace(/.$/, '9');
        const registerResponse2 = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/nfc/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { uid: testUID2 });

        if (registerResponse2.status === 200) {
            // 尝试设置相同域名
            const duplicateDomainResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/user/domain',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            }, { uid: testUID2, domainPrefix: testDomainPrefix });

            console.log(`重复域名测试状态码: ${duplicateDomainResponse.status}`);
            if (duplicateDomainResponse.status === 409) {
                console.log('✅ 域名唯一性验证通过 - 正确拒绝重复域名');
            } else {
                console.log('❌ 域名唯一性验证失败 - 应该拒绝重复域名');
            }
        }

        // 测试7: 域名格式验证
        console.log('\n📝 测试7: 域名格式验证');

        const invalidDomains = [
            'a',           // 太短
            'ab',          // 太短  
            '-invalid',    // 以连字符开头
            'invalid-',    // 以连字符结尾
            'Invalid',     // 包含大写字母
            'inv@lid',     // 包含特殊字符
            'a'.repeat(31) // 太长
        ];

        for (const invalidDomain of invalidDomains) {
            const invalidResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/user/domain',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            }, { uid: testUID2, domainPrefix: invalidDomain });

            if (invalidResponse.status === 400) {
                console.log(`✅ 正确拒绝无效域名前缀: "${invalidDomain}"`);
            } else {
                console.log(`❌ 未正确拒绝无效域名前缀: "${invalidDomain}"`);
            }
        }

        // 测试8: 删除域名
        console.log('\n🗑️  测试8: 删除域名');
        const deleteResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/user/domain/${testUID}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`删除域名状态码: ${deleteResponse.status}`);
        if (deleteResponse.status === 200) {
            console.log('✅ 域名删除成功:', deleteResponse.data);
            console.log(`删除后域名状态: ${deleteResponse.data.domain || '已删除'}`);
        } else {
            console.log('❌ 域名删除失败:', deleteResponse.data);
        }

        console.log('\n🎉 Injective .inj域名功能测试完成！');
        console.log('\n📚 API文档地址: http://localhost:3000/api');
        console.log('\n🏷️  .inj域名功能特性:');
        console.log('   - 自定义域名前缀 (3-30字符)');
        console.log('   - 自动添加.inj后缀');
        console.log('   - 域名唯一性保证');
        console.log('   - 符合DNS规范验证');
        console.log('   - 支持域名查找用户');

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
        console.log('然后再运行此测试: node test-injective-domain.js');
        process.exit(1);
    }

    await testInjectiveDomainFeatures();
}

main().catch(console.error); 