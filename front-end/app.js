const i18n = {
    en: {
        welcome: {
            title: "Activate your INJ Pass",
            subtitle: "Seamlessly link physical-world objects to your Injective digital identity.",
            feature1: "Tap Bonjour card for 1s to get on-chain identity",
            feature2: "Create your free domain and explore the Inj ecosystem",
            feature3: "MCP cloud hosting, no need to remember complex passwords",
            createButton: "Create Injective Pass now"
        },
        nfc: {
            scanning: "Scanning...",
            instruction: "Please bring your Adventure 25 card close to your phone",
            status: "Scanning...",
            skip: "Skip scan"
        },
        wallet: {
            selectTitle: "Select Wallet Connection",
            selectSubtitle: "Please select a wallet to continue, or skip to scan NFC",
            adventure25: "Adventure 25'",
            metamask: "MetaMask",
            tokenpocket: "Token Pocket",
            continue: "Continue",
            skip: "Skip, scan NFC",
            copyAddress: "Copy Address",
            viewOnInjScan: "View on InjScan",
            disconnect: "Disconnect"
        },
        scanning: {
            ready: "Ready to scan...",
            prompt: "Please bring the NFC item close to your phone...",
            captured: "Identity core captured!",
            failed: "Scan failed, please try again."
        },
        mint: {
            title: "Create your .Inj domain",
            subtitle: "This will be your unique identity on Injective.",
            placeholder: "e.g. vincent",
            check: "Check availability",
            checking: "Checking...",
            available: "Great! {domain}.Inj is available.",
            taken: "Sorry, {domain}.Inj is already taken.",
            mint: "Mint & activate",
            generating: "Generating secure wallet...",
            minting: "Minting your Injective identity...",
            done: "Done!"
        },
        dashboard: {
            totalAssets: "Total assets",
            collection: "收藏品"
        },
        tab: {
            pass: "Pass",
            ecosystem: "Ecosystem",
            activity: "Activity",
            settings: "Settings"
        }
    },
    zh: {
        welcome: {
            title: "激活您的INJ通行证",
            subtitle: "创建连接物理世界的专属Injective数字身份尽享生态",
            feature1: "拍Bonjour卡1秒获取Inj链上身份",
            feature2: "免费创建专属域名畅游Inj生态",
            feature3: "MCP云托管无需牢记复杂密码",
            createButton: "立即创建 Injective Pass"
        },
        nfc: {
            scanning: "正在扫描",
            instruction: "请将您的Adventure 25卡片靠近手机",
            status: "正在扫描...",
            skip: "跳过扫描"
        },
        wallet: {
            selectTitle: "选择钱包连接",
            selectSubtitle: "请选择一个钱包继续，或跳过直接扫描 NFC",
            adventure25: "Adventure 25'",
            metamask: "MetaMask",
            tokenpocket: "Token Pocket",
            continue: "继续",
            skip: "跳过，直接扫描 NFC",
            copyAddress: "复制地址",
            viewOnInjScan: "在 InjScan 查看",
            disconnect: "断开连接"
        },
        scanning: {
            ready: "准备扫描...",
            prompt: "请将 NFC 物品靠近手机...",
            captured: "身份核心已捕获！",
            failed: "扫描失败，请重试。"
        },
        mint: {
            title: "创建您的 .Inj 域名",
            subtitle: "这将成为您在 Injective 上的唯一身份。",
            placeholder: "例如: vincent",
            check: "检查可用性",
            checking: "检查中...",
            available: "太棒了！{domain}.Inj 可用。",
            taken: "抱歉，{domain}.Inj 已被占用。",
            mint: "铸造并激活",
            generating: "正在生成安全钱包...",
            minting: "正在铸造您的Injective身份...",
            done: "完成！"
        },
        dashboard: {
            totalAssets: "总资产",
            collection: "收藏品"
        },
        tab: {
            pass: "通行证",
            ecosystem: "生态",
            activity: "活动",
            settings: "设置"
        }
    }
};

let currentLang = localStorage.getItem('lang') || 'en';
const langToggleBtn = document.getElementById('lang-toggle-btn');

function t(path) {
    const parts = path.split('.');
    let obj = i18n[currentLang];
    for (const p of parts) {
        if (obj && p in obj) {
            obj = obj[p];
        } else {
            return path; // fallback: key itself
        }
    }
    return obj;
}

function tf(path, params = {}) {
    let str = t(path);
    for (const key in params) {
        str = str.replace(new RegExp(`{${key}}`, 'g'), params[key]);
    }
    return str;
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = t(key);
        if (typeof val === 'string') el.placeholder = val;
    });
    document.documentElement.lang = currentLang;
    langToggleBtn.textContent = currentLang === 'en' ? '中' : 'EN';
}

langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', currentLang);
    applyI18n();
    // also update dynamic texts if needed
    if (appState.currentScreen === 'scanning-screen') {
        scanningStatusEl.textContent = t('scanning.ready');
    }
    checkDomainBtn.textContent = t('mint.check');
});

// Initialize language button text
langToggleBtn.textContent = currentLang === 'en' ? '中' : 'EN';

/* ------------------ Mock API ------------------ */
/* --- Device Detection & Passkey Functions --- */

// 检测是否为iOS设备
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// 检测是否为Android设备
function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

// 检测是否支持Passkey
function isPasskeySupported() {
    return window.PublicKeyCredential &&
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
        PublicKeyCredential.isConditionalMediationAvailable;
}

// 获取Relying Party ID
function getRpId() {
    const host = window.location.host;
    // 如果是 localhost 或 IP 地址，返回 localhost
    if (host.startsWith("localhost") || host.includes("127.0.0.1") || host.includes("192.168.") || host.includes("10.")) {
        return "localhost";
    }
    // 如果是 IP 地址 (简单判断)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(host)) {
        return "localhost";
    }
    // 其他情况返回实际域名
    return host;
}

// 创建Passkey
async function createPasskey(username) {
    try {
        // 检查是否支持Passkey
        if (!window.PublicKeyCredential) {
            return { success: false, error: '浏览器不支持Passkey' };
        }

        // 检查是否支持平台认证器
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!isAvailable) {
            return { success: false, error: '设备不支持Passkey' };
        }

        const rpId = getRpId();
        console.log('Using RP ID:', rpId);

        const publicKey = {
            challenge: new TextEncoder().encode(crypto.randomUUID()),
            rp: {
                id: rpId,
                name: "Injective Pass",
            },
            timeout: 60_000,
            user: {
                id: new TextEncoder().encode(crypto.randomUUID()),
                name: username,
                displayName: username,
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
            }
        };

        console.log('Creating passkey with options:', publicKey);

        const pubKeyCredential = await navigator.credentials.create({ publicKey });
        const { id } = pubKeyCredential;
        const pubKey = pubKeyCredential.response.getPublicKey();

        // 存储公钥
        storePublicKey(id, pubKey);

        // 存储用户名映射
        const publicKeyMap = localStorage.getItem('publicKeyMap') ?
            JSON.parse(localStorage.getItem('publicKeyMap')) : {};
        localStorage.setItem('publicKeyMap', JSON.stringify({
            ...publicKeyMap,
            [id]: username
        }));

        console.log('Passkey created successfully:', { id, username });
        return { success: true, keyId: id, username };
    } catch (error) {
        console.error('Passkey creation failed:', error);

        // 提供更友好的错误信息
        let errorMessage = error.message;
        if (error.name === 'InvalidStateError') {
            errorMessage = 'Passkey已存在，请使用现有Passkey登录';
        } else if (error.name === 'NotAllowedError') {
            errorMessage = '用户取消了Passkey创建';
        } else if (error.name === 'SecurityError') {
            errorMessage = '安全错误，请确保使用HTTPS或localhost';
        } else if (error.message.includes('invalid domain')) {
            errorMessage = '域名无效，请确保使用有效的域名或localhost';
        }

        return { success: false, error: errorMessage };
    }
}

// 获取Passkey签名
async function getPasskeySignature() {
    try {
        const publicKey = {
            challenge: new TextEncoder().encode("Login to Injective Pass"),
            rpId: getRpId(),
            timeout: 60_000,
        };

        const pubKeyCredential = await navigator.credentials.get({
            publicKey,
            mediation: "optional",
        });

        const { id } = pubKeyCredential;
        const { authenticatorData, clientDataJSON, signature, userHandle } = pubKeyCredential.response;
        const { challenge, origin } = JSON.parse(formatArrayBuf(clientDataJSON));

        // 获取用户名
        const publicKeyMap = localStorage.getItem('publicKeyMap') ?
            JSON.parse(localStorage.getItem('publicKeyMap')) : {};
        const username = publicKeyMap[id] || 'Unknown User';

        return {
            success: true,
            keyId: id,
            username,
            challenge,
            signature: Array.from(new Uint8Array(signature)),
            authenticatorData: Array.from(new Uint8Array(authenticatorData))
        };
    } catch (error) {
        console.error('Passkey authentication failed:', error);
        return { success: false, error: error.message };
    }
}

// 辅助函数
function formatArrayBuf(buffer, encoding = "utf-8") {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
}

function storePublicKey(keyId, arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
    localStorage.setItem(keyId, base64String);
}

function retrievePublicKey(keyId) {
    const base64String = localStorage.getItem(keyId);
    if (!base64String) return null;
    const uint8Array = new Uint8Array(
        atob(base64String).split("").map(char => char.charCodeAt(0))
    );
    return uint8Array.buffer;
}

// 处理创建Pass的主要逻辑
async function handleCreatePass() {
    if (isIOS() && isPasskeySupported()) {
        // iOS设备：直接调用Passkey
        await handleIOSPasskey();
    } else if (isAndroid()) {
        // Android设备：显示NFC扫描界面
        navigateTo('nfc-scan-screen');
    } else {
        // 其他设备：显示钱包选择界面
        navigateTo('wallet-screen');
    }
}

// iOS Passkey处理
async function handleIOSPasskey() {
    try {
        // 检查是否已有Passkey
        const publicKeyMap = localStorage.getItem('publicKeyMap') ?
            JSON.parse(localStorage.getItem('publicKeyMap')) : {};

        if (Object.keys(publicKeyMap).length > 0) {
            // 已有Passkey，直接登录
            const result = await getPasskeySignature();
            if (result.success) {
                console.log('Passkey登录成功:', result.username);
                // 直接跳转到域名创建页面
                navigateTo('minting-screen');
            } else {
                console.error('Passkey登录失败:', result.error);
                // 如果登录失败，可能是Passkey被删除，跳转到创建页面
                navigateTo('passkey-create-screen');
            }
        } else {
            // 没有Passkey，跳转到创建页面
            navigateTo('passkey-create-screen');
        }
    } catch (error) {
        console.error('Passkey处理失败:', error);
        // 出错时跳转到创建页面
        navigateTo('passkey-create-screen');
    }
}

// 处理Passkey创建
async function handleCreatePasskey() {
    const username = document.getElementById('passkey-username').value.trim();
    const statusEl = document.getElementById('passkey-status');
    const createBtn = document.querySelector('.passkey-create-btn');

    if (!username) {
        showPasskeyStatus('请输入用户名', 'error');
        return;
    }

    if (username.length < 2) {
        showPasskeyStatus('用户名至少需要2个字符', 'error');
        return;
    }

    try {
        // 禁用按钮
        createBtn.disabled = true;
        createBtn.innerHTML = '<span>创建中...</span>';

        // 创建Passkey
        const result = await createPasskey(username);

        if (result.success) {
            showPasskeyStatus('Passkey创建成功！正在跳转...', 'success');
            console.log('Passkey创建成功:', result.username);

            // 延迟跳转
            setTimeout(() => {
                navigateTo('minting-screen');
            }, 1500);
        } else {
            showPasskeyStatus('Passkey创建失败: ' + result.error, 'error');
            createBtn.disabled = false;
            createBtn.innerHTML = '<span>创建 Passkey</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>';
        }
    } catch (error) {
        console.error('Passkey创建失败:', error);
        showPasskeyStatus('Passkey创建失败，请重试', 'error');
        createBtn.disabled = false;
        createBtn.innerHTML = '<span>创建 Passkey</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>';
    }
}

// 显示Passkey状态
function showPasskeyStatus(message, type) {
    const statusEl = document.getElementById('passkey-status');
    statusEl.textContent = message;
    statusEl.className = `passkey-status ${type}`;
}

// 真实的NFC扫描功能
async function startNFCScan() {
    const statusText = document.getElementById('nfc-status-text');

    try {
        // 检查是否支持Web NFC API
        if (!('NDEFReader' in window)) {
            statusText.textContent = '您的浏览器不支持NFC功能，请使用支持Web NFC的浏览器（如Chrome on Android）';
            console.warn('Web NFC API not supported');
            return;
        }

        statusText.textContent = '正在初始化NFC...';

        // 创建NDEF读取器
        const ndef = new NDEFReader();

        // 设置扫描超时
        const scanTimeout = setTimeout(() => {
            statusText.textContent = 'NFC扫描超时，请确保NFC卡片靠近设备并重试';
            console.warn('NFC scan timeout');
        }, 20000); // 20秒超时

        // 监听NFC标签读取事件
        ndef.addEventListener('reading', (event) => {
            clearTimeout(scanTimeout);
            console.log('NFC tag detected:', event);

            // 获取UID (优先使用serialNumber，否则生成唯一ID)
            const uid = event.serialNumber || `nfc-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
            appState.nfcUid = uid;

            statusText.textContent = '扫描成功！正在处理...';
            console.log('NFC UID obtained:', uid);

            // 延迟跳转到域名创建页面
            setTimeout(() => {
                navigateTo('minting-screen');
            }, 1500);
        });

        // 监听读取错误
        ndef.addEventListener('readingerror', (error) => {
            clearTimeout(scanTimeout);
            console.error('NFC reading error:', error);
            statusText.textContent = 'NFC读取失败，请检查NFC卡片是否正常并重试';
        });

        // 开始扫描
        await ndef.scan();
        statusText.textContent = '请将NFC卡片靠近设备...';
        console.log('NFC scan started successfully');

    } catch (error) {
        console.error('NFC扫描失败:', error);

        // 提供更友好的错误信息
        if (error.name === 'NotAllowedError') {
            statusText.textContent = '需要NFC权限，请在浏览器中允许NFC访问';
        } else if (error.name === 'NotSupportedError') {
            statusText.textContent = '您的设备不支持NFC功能';
        } else if (error.name === 'NotReadableError') {
            statusText.textContent = '无法读取NFC卡片，请重试';
        } else {
            statusText.textContent = 'NFC扫描失败：' + error.message;
        }
    }
}

// 兼容性NFC扫描函数（用于不支持Web NFC API的浏览器）
async function handleNFCScan() {
    const statusText = document.getElementById('nfc-status-text');

    try {
        statusText.textContent = '正在模拟扫描...';
        console.log('Starting simulation NFC scan');

        // 模拟NFC扫描过程（稍微长一点让用户感觉真实）
        await new Promise(resolve => setTimeout(resolve, 2500));

        // 生成符合格式的模拟UID
        const mockUid = `04:f3:a1:8a:b2:5d:80:${Math.random().toString(16).substr(2, 8)}`;
        appState.nfcUid = mockUid;

        console.log('Mock NFC UID generated:', mockUid);

        // 模拟扫描成功
        statusText.textContent = '模拟扫描成功！正在处理...';
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 跳转到域名创建页面
        navigateTo('minting-screen');

    } catch (error) {
        console.error('模拟NFC扫描失败:', error);
        statusText.textContent = '模拟扫描失败，请重试';

        // 提供重试选项
        setTimeout(() => {
            statusText.textContent = '点击重试按钮再次尝试';
        }, 2000);
    }
}

// 配置后端 API 基础 URL - 动态适应不同环境
const API_BASE_URL = (() => {
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    const currentProtocol = window.location.protocol;

    // 如果是 localhost 或 127.0.0.1，使用本地配置
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:8080';
    }

    // 如果是服务器环境，使用相同主机的8080端口
    return `${currentProtocol}//${currentHost}:8080`;
})();

// 真正的 API 客户端
const apiClient = {
    // API 连接检测
    checkApiConnection: async () => {
        try {
            console.log(`Checking API connection: ${API_BASE_URL}/api/health`);
            const response = await fetch(`${API_BASE_URL}/api/health`, {
                method: 'GET',
                timeout: 5000
            });
            const isConnected = response.ok;
            console.log(`API connection status: ${isConnected ? 'Connected' : 'Failed'}`);
            return isConnected;
        } catch (error) {
            console.warn('API connection check failed:', error);
            return false;
        }
    },

    // NFC 注册 API
    registerNFC: async (uid) => {
        try {
            console.log(`Attempting NFC registration with API: ${API_BASE_URL}/api/nfc/register`);
            const response = await fetch(`${API_BASE_URL}/api/nfc/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('NFC registration successful:', result);
            return result;
        } catch (error) {
            console.error('NFC registration failed:', error);
            throw error;
        }
    },

    // 读取NFC UID（真实Web NFC API实现）
    readNfcUid: async () => {
        // 如果已经有NFC UID，直接返回
        if (appState.nfcUid) {
            return appState.nfcUid;
        }

        return new Promise(async (resolve, reject) => {
            try {
                // 检查是否支持Web NFC API
                if (!('NDEFReader' in window)) {
                    reject(new Error('您的浏览器不支持NFC功能，请使用支持Web NFC的浏览器（如Chrome on Android）'));
                    return;
                }

                console.log('Starting NFC scan...');

                // 创建NDEF读取器
                const ndef = new NDEFReader();

                // 设置超时
                const timeout = setTimeout(() => {
                    reject(new Error('NFC扫描超时，请确保NFC卡片靠近设备并重试'));
                }, 15000); // 15秒超时

                // 监听NFC标签读取事件
                ndef.addEventListener('reading', (event) => {
                    clearTimeout(timeout);
                    console.log('NFC tag detected:', event);

                    // 获取UID (使用serialNumber)
                    const uid = event.serialNumber || `nfc:${Date.now()}`;
                    appState.nfcUid = uid;

                    console.log('NFC UID read:', uid);
                    resolve(uid);
                });

                // 监听读取错误
                ndef.addEventListener('readingerror', (error) => {
                    clearTimeout(timeout);
                    console.error('NFC reading error:', error);
                    reject(new Error('NFC读取失败，请检查NFC卡片是否正常并重试'));
                });

                // 开始扫描
                await ndef.scan();
                console.log('NFC scan started, waiting for tag...');

            } catch (error) {
                console.error('NFC scan failed:', error);

                // 提供具体的错误信息
                if (error.name === 'NotAllowedError') {
                    reject(new Error('需要NFC权限，请在浏览器中允许NFC访问'));
                } else if (error.name === 'NotSupportedError') {
                    reject(new Error('您的设备不支持NFC功能'));
                } else if (error.name === 'NotReadableError') {
                    reject(new Error('无法读取NFC卡片，请重试'));
                } else {
                    reject(new Error('NFC扫描失败：' + error.message));
                }
            }
        });
    },

    // 根据 UID 获取钱包信息
    getWalletByUID: async (uid) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/nfc/wallet/${encodeURIComponent(uid)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // 钱包不存在
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get wallet by UID failed:', error);
            throw error;
        }
    },

    // 生成钱包（通过注册NFC实现）
    generateWallet: async (uid) => {
        try {
            console.log('Generating wallet for UID:', uid);
            console.log('Using API URL:', API_BASE_URL);

            // 首先检查API连接
            const apiConnected = await apiClient.checkApiConnection();
            if (!apiConnected) {
                console.warn('API server not available, falling back to mock data');
                // 回退到模拟数据
                return {
                    publicKey: 'inj1' + Math.random().toString(36).substr(2, 38),
                    privateKey: 'hidden_for_security'
                };
            }

            const result = await apiClient.registerNFC(uid);
            return {
                publicKey: result.address,
                privateKey: 'hidden_for_security' // 出于安全考虑不返回私钥
            };
        } catch (error) {
            console.error('Generate wallet failed:', error);
            console.log('Falling back to mock data');
            // 回退到模拟数据
            return {
                publicKey: 'inj1' + Math.random().toString(36).substr(2, 38),
                privateKey: 'hidden_for_security',
            };
        }
    },

    // 检查域名可用性
    checkDomainAvailability: async (domain) => {
        try {
            console.log('Checking domain availability:', domain);

            // 首先检查API连接
            const apiConnected = await apiClient.checkApiConnection();
            if (!apiConnected) {
                console.warn('API server not available, using mock response');
                return Math.random() > 0.2; // 80%的概率可用
            }

            const response = await fetch(`${API_BASE_URL}/api/nfc/domain/check?domain=${encodeURIComponent(domain)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Domain availability result:', result);
            return result.available;
        } catch (error) {
            console.error('Domain availability check failed:', error);
            // 如果 API 调用失败，返回随机结果作为回退
            return Math.random() > 0.2;
        }
    },

    // 创建域名并铸造NFT
    mintNft: async (domain, uid, address) => {
        try {
            // 使用真实 API 创建域名
            const result = await apiClient.createDomain(uid, domain);
            if (result.success) {
                return {
                    name: `${domain}.Inj`,
                    imageUrl: `https://placehold.co/400x600/FFFFFF/1F2937?text=${domain}.Inj`,
                };
            }
        } catch (error) {
            console.warn('Real API failed, using mock data:', error);
        }

        // 回退到模拟数据
        await new Promise(resolve => setTimeout(resolve, 3000));
        return {
            name: `${domain}.Inj`,
            imageUrl: `https://placehold.co/400x600/FFFFFF/1F2937?text=${domain}.Inj`,
        };
    },

    // 创建域名
    createDomain: async (uid, domainName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/nfc/domain/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid, domainName })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Domain creation failed:', error);
            throw error;
        }
    },

    // 获取钱包余额
    getBalances: async (address) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/nfc/balance/${encodeURIComponent(address)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return {
                inj: result.inj || '0.0000',
                usdt: result.usd || '0.00',
            };
        } catch (error) {
            console.error('Get balances failed:', error);
            // 回退到模拟数据
            return {
                inj: (Math.random() * 100).toFixed(4),
                usdt: (Math.random() * 5000).toFixed(2),
            };
        }
    },

    // 获取钱包统计
    getWalletStats: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/nfc/stats`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get wallet stats failed:', error);
            throw error;
        }
    }
};

/* ------------------ App State & DOM ------------------ */
let appState = {
    currentScreen: 'welcome-wallet-screen',
    nfcUid: null,
    userData: null,
    wallet: null,
    navigationHistory: ['welcome-wallet-screen'],
};

const screens = document.querySelectorAll('.screen');
const tabBar = document.getElementById('tab-bar');

// Browser history management
function updateBrowserHistory(screenId) {
    const url = new URL(window.location);
    url.searchParams.set('screen', screenId);
    window.history.pushState({ screen: screenId }, '', url);
}

function navigateTo(screenId) {
    // Add to navigation history
    if (screenId !== appState.currentScreen) {
        appState.navigationHistory.push(screenId);
    }

    appState.currentScreen = screenId;
    screens.forEach(screen => {
        screen.classList.toggle('active', screen.id === screenId);
    });

    // 显示底部导航栏的条件：dashboard、ecosystem、activity、settings
    const showTabBarScreens = ['dashboard-screen', 'ecosystem-screen', 'activity-screen', 'settings-screen'];
    tabBar.style.display = showTabBarScreens.includes(screenId) ? 'block' : 'none';

    // Update browser history
    updateBrowserHistory(screenId);

    // Handle screen-specific logic
    if (screenId === 'nfc-scan-screen') {
        setTimeout(() => {
            const container = document.querySelector('.nfc-scan-container');
            container.classList.add('active');
            startNFCScan();
        }, 100);
    }
}

function goBack() {
    if (appState.navigationHistory.length > 1) {
        appState.navigationHistory.pop(); // Remove current screen
        const previousScreen = appState.navigationHistory[appState.navigationHistory.length - 1];
        navigateTo(previousScreen);
    } else {
        navigateTo('welcome-wallet-screen');
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const screen = event.state?.screen || 'welcome-wallet-screen';
    navigateTo(screen);
});

// Initialize browser history
updateBrowserHistory('welcome-wallet-screen');

/* ------------------ Wallet Screen Logic ------------------ */
// 钱包选择逻辑优化
const walletOptions = document.querySelectorAll('.wallet-option');
const walletContinueBtn = document.getElementById('wallet-continue-btn');
const walletSkipBtn = document.getElementById('wallet-skip-btn');
const adventureSection = document.getElementById('adventure-section');
const walletAddressDisplay = document.getElementById('wallet-address-display');
const walletDropdown = document.getElementById('wallet-dropdown');
const copyAddressDropdown = document.getElementById('copy-address-dropdown');
const viewInjscanDropdown = document.getElementById('view-injscan-dropdown');
const disconnectDropdown = document.getElementById('disconnect-dropdown');

// Wallet address display hover functionality
let dropdownTimeout;

walletAddressDisplay.addEventListener('mouseenter', () => {
    clearTimeout(dropdownTimeout);
    walletDropdown.style.display = 'block';
    walletDropdown.style.opacity = '0';
    setTimeout(() => {
        walletDropdown.style.opacity = '1';
    }, 10);
});

walletAddressDisplay.addEventListener('mouseleave', () => {
    dropdownTimeout = setTimeout(() => {
        if (!walletDropdown.matches(':hover')) {
            walletDropdown.style.opacity = '0';
            setTimeout(() => {
                walletDropdown.style.display = 'none';
            }, 200);
        }
    }, 150);
});

walletDropdown.addEventListener('mouseenter', () => {
    clearTimeout(dropdownTimeout);
});

walletDropdown.addEventListener('mouseleave', () => {
    walletDropdown.style.opacity = '0';
    setTimeout(() => {
        walletDropdown.style.display = 'none';
    }, 200);
});

// Dropdown menu functionality
copyAddressDropdown.addEventListener('click', async () => {
    if (appState.wallet && appState.wallet.address) {
        try {
            await navigator.clipboard.writeText(appState.wallet.address);
            // Show success feedback
            const originalText = copyAddressDropdown.querySelector('span').textContent;
            const originalIcon = copyAddressDropdown.querySelector('svg').innerHTML;

            copyAddressDropdown.querySelector('span').textContent = currentLang === 'en' ? 'Copied!' : '已复制!';
            copyAddressDropdown.querySelector('svg').innerHTML = `
    <polyline points="20 6 9 17 4 12"/>
  `;
            copyAddressDropdown.style.color = 'var(--teal-dark)';

            setTimeout(() => {
                copyAddressDropdown.querySelector('span').textContent = originalText;
                copyAddressDropdown.querySelector('svg').innerHTML = originalIcon;
                copyAddressDropdown.style.color = '';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = appState.wallet.address;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            // Show feedback
            const originalText = copyAddressDropdown.querySelector('span').textContent;
            copyAddressDropdown.querySelector('span').textContent = currentLang === 'en' ? 'Copied!' : '已复制!';
            setTimeout(() => {
                copyAddressDropdown.querySelector('span').textContent = originalText;
            }, 2000);
        }
    }
});

viewInjscanDropdown.addEventListener('click', () => {
    if (appState.wallet && appState.wallet.address) {
        let address = appState.wallet.address;

        // Convert different address formats to Injective format
        if (address.startsWith('0x')) {
            // Convert Ethereum address to Injective address
            address = 'inj1' + address.slice(2);
        } else if (!address.startsWith('inj1')) {
            // If it's not already in Injective format, assume it needs conversion
            address = 'inj1' + address;
        }

        // Open InjScan in new tab
        window.open(`https://injscan.com/account/${address}`, '_blank');
    }
});

disconnectDropdown.addEventListener('click', () => {
    // Clear wallet state
    appState.wallet = null;
    appState.nfcUid = null;
    appState.userData = null;

    // Hide wallet address display and dropdown
    walletAddressDisplay.style.display = 'none';
    walletDropdown.style.display = 'none';
    walletDropdown.style.opacity = '0';

    // Reset wallet selection
    walletOptions.forEach(o => o.classList.remove('selected'));
    adventureSection.style.display = 'none';
    walletContinueBtn.disabled = true;

    // Clear any stored wallet data
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');

    // Navigate back to welcome screen
    navigateTo('welcome-wallet-screen');

    // Show disconnect feedback
    const originalText = disconnectDropdown.querySelector('span').textContent;
    disconnectDropdown.querySelector('span').textContent = currentLang === 'en' ? 'Disconnected!' : '已断开!';
    setTimeout(() => {
        disconnectDropdown.querySelector('span').textContent = originalText;
    }, 2000);
});

walletOptions.forEach(option => {
    option.addEventListener('click', async () => {
        walletOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        const walletType = option.dataset.wallet;
        // 切换钱包时隐藏或清空地址显示
        walletAddressDisplay.style.display = 'none';
        walletDropdown.style.display = 'none';
        walletAddressDisplay.textContent = '';
        if (walletType === 'adventure25') {
            adventureSection.style.display = 'block';
            walletContinueBtn.disabled = false;
            appState.wallet = 'adventure25';
        } else {
            adventureSection.style.display = 'none';
            // MetaMask/TokenPocket连接逻辑
            if (walletType === 'metamask') {
                if (typeof window.ethereum !== 'undefined') {
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                        if (accounts && accounts.length > 0) {
                            appState.wallet = {
                                type: 'metamask',
                                address: accounts[0]
                            };
                            // 保存钱包连接状态
                            localStorage.setItem('connectedWallet', 'metamask');
                            localStorage.setItem('walletAddress', accounts[0]);
                            // 显示右上角钱包地址
                            walletAddressDisplay.style.display = 'block';
                            walletAddressDisplay.textContent = accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4);
                            // 直接跳转到minting-screen
                            navigateTo('minting-screen');
                        }
                    } catch (err) {
                        alert('MetaMask 连接被拒绝或发生错误。');
                        appState.wallet = null;
                        return;
                    }
                } else {
                    alert('未检测到MetaMask插件，请先安装MetaMask。');
                    appState.wallet = null;
                    return;
                }
            } else if (walletType === 'tokenpocket') {
                // 这里可集成TokenPocket的连接逻辑，暂时直接模拟跳转
                appState.wallet = { type: 'tokenpocket', address: '0xTokenPocketAddress' };
                // 保存钱包连接状态
                localStorage.setItem('connectedWallet', 'tokenpocket');
                localStorage.setItem('walletAddress', '0xTokenPocketAddress');
                walletAddressDisplay.style.display = 'block';
                walletAddressDisplay.textContent = '0xToken...ress';
                navigateTo('minting-screen');
            }
        }
    });
});

walletContinueBtn.addEventListener('click', () => {
    if (appState.wallet === 'adventure25') {
        navigateTo('scanning-screen');
    }
});
walletSkipBtn.addEventListener('click', () => {
    if (appState.wallet === 'adventure25') {
        navigateTo('scanning-screen');
    }
});

/* ------------------ Scanning Screen ------------------ */
const scanningStatusEl = document.getElementById('scanning-status');
const scanningAnimationContainer = document.getElementById('scanning-animation-container');

async function handleScan() {
    scanningStatusEl.textContent = t('scanning.prompt');
    try {
        const uid = await apiClient.readNfcUid();
        appState.nfcUid = uid;
        scanningStatusEl.textContent = t('scanning.captured');
        scanningAnimationContainer.innerHTML = `
  <svg class="scanning-icon" style="width: 5rem; height: 5rem; color: var(--teal-dark);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;
        setTimeout(() => navigateTo('minting-screen'), 1000);
    } catch (error) {
        scanningStatusEl.textContent = t('scanning.failed');
        console.error("Scan failed:", error);
    }
}

/* ------------------ Minting Screen ------------------ */
const domainInput = document.getElementById('domain-input');
const checkDomainBtn = document.getElementById('check-domain-btn');
const mintingFeedbackEl = document.getElementById('minting-feedback');
const mintingStepDomain = document.getElementById('minting-step-domain');
const mintingStepMinting = document.getElementById('minting-step-minting');
const mintingStatusEl = document.getElementById('minting-status');

domainInput.addEventListener('input', () => {
    domainInput.value = domainInput.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    mintingFeedbackEl.innerHTML = '';
});

checkDomainBtn.addEventListener('click', async () => {
    const domain = domainInput.value;
    if (!domain) return;

    checkDomainBtn.disabled = true;
    checkDomainBtn.textContent = t('mint.checking');
    mintingFeedbackEl.innerHTML = '';

    const isAvailable = await apiClient.checkDomainAvailability(domain);

    if (isAvailable) {
        mintingFeedbackEl.innerHTML = `
  <button id="mint-btn" class="btn btn-secondary">铸造并激活</button>
`;
        document.getElementById('mint-btn').addEventListener('click', handleMint);
    } else {
        mintingFeedbackEl.innerHTML = `
  <p class="feedback-error">域名已被注册</p>
  <button id="mint-btn" class="btn btn-secondary" disabled style="opacity: 0.5; cursor: not-allowed;">铸造并激活</button>
`;
    }

    checkDomainBtn.disabled = false;
    checkDomainBtn.textContent = t('mint.check');
});

async function handleMint() {
    mintingStepDomain.style.display = 'none';
    mintingStepMinting.style.display = 'block';

    mintingStatusEl.textContent = t('mint.generating');
    const wallet = await apiClient.generateWallet(appState.nfcUid);

    mintingStatusEl.textContent = '正在铸造您的Injective身份...';
    const nft = await apiClient.mintNft(domainInput.value, appState.nfcUid, wallet.publicKey);

    mintingStatusEl.innerHTML = '<span class="emoji-fade-in">🎉</span> 完成';
    appState.userData = { wallet, nft };

    setTimeout(() => {
        populateDashboard();
        navigateTo('dashboard-screen');
    }, 1000);
}

/* ------------------ Dashboard Screen ------------------ */
const dashboardNftImage = document.getElementById('dashboard-nft-image');
const dashboardNftName = document.getElementById('dashboard-nft-name');
const dashboardAddress = document.getElementById('dashboard-address');
const dashboardInjBalance = document.getElementById('dashboard-inj-balance');
const dashboardUsdtBalance = document.getElementById('dashboard-usdt-balance');
const copyAddressBtn = document.getElementById('copy-address-btn');
const copyIcon = document.getElementById('copy-icon');
const checkIcon = document.getElementById('check-icon');

async function populateDashboard() {
    const { wallet, nft } = appState.userData;
    dashboardNftImage.src = nft.imageUrl;
    dashboardNftName.textContent = nft.name;
    dashboardAddress.textContent = `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-4)}`;

    const balances = await apiClient.getBalances(wallet.publicKey);
    dashboardInjBalance.textContent = balances.inj;
    dashboardUsdtBalance.textContent = balances.usdt;

    // 卡片翻转与二维码
    const idCard = document.getElementById('dashboard-id-card');
    const qrcodeDiv = document.getElementById('dashboard-qrcode');
    const addressBack = document.getElementById('dashboard-address-back');
    if (idCard && qrcodeDiv && wallet.publicKey) {
        qrcodeDiv.innerHTML = '';
        // 根据当前主题设置二维码颜色
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        new QRCode(qrcodeDiv, {
            text: wallet.publicKey,
            width: 150,
            height: 150,
            colorDark: isDark ? '#FFFFFF' : '#1F2937',
            colorLight: isDark ? '#1F2937' : '#FFFFFF',
            correctLevel: QRCode.CorrectLevel.H
        });
        addressBack.textContent = wallet.publicKey;
        idCard.onclick = function () {
            idCard.classList.toggle('flipped');
        };
    }
}

copyAddressBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(appState.userData.wallet.publicKey);
    copyIcon.style.display = 'none';
    checkIcon.style.display = 'block';
    setTimeout(() => {
        copyIcon.style.display = 'block';
        checkIcon.style.display = 'none';
    }, 2000);
});

// Initialize wallet connection state
function initializeWalletState() {
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedAddress = localStorage.getItem('walletAddress');

    if (savedWallet && savedAddress) {
        appState.wallet = {
            type: savedWallet,
            address: savedAddress
        };
        walletAddressDisplay.style.display = 'block';
        walletAddressDisplay.textContent = savedAddress.slice(0, 6) + '...' + savedAddress.slice(-4);

        // If we have a connected wallet, show it on dashboard
        if (appState.userData) {
            navigateTo('dashboard-screen');
        } else {
            navigateTo('minting-screen');
        }
    }
}

/* ------------------ Theme Management ------------------ */
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const sunIcon = themeToggleBtn.querySelector('.sun-icon');
const moonIcon = themeToggleBtn.querySelector('.moon-icon');

let currentTheme = localStorage.getItem('theme') || 'dark';

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

themeToggleBtn.addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // 重新生成二维码以适配新主题
    if (appState.userData && appState.userData.wallet) {
        const qrcodeDiv = document.getElementById('dashboard-qrcode');
        if (qrcodeDiv) {
            qrcodeDiv.innerHTML = '';
            new QRCode(qrcodeDiv, {
                text: appState.userData.wallet.publicKey,
                width: 150,
                height: 150,
                colorDark: newTheme === 'dark' ? '#FFFFFF' : '#1F2937',
                colorLight: newTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
});

// Initialize theme
setTheme(currentTheme);



/* ------------------ Tab Bar Navigation ------------------ */
const tabItems = document.querySelectorAll('.tab-item');

tabItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        // Remove active class from all tabs
        tabItems.forEach(tab => tab.classList.remove('active'));
        // Add active class to clicked tab
        item.classList.add('active');

        // Navigate to corresponding screen
        const screens = ['dashboard-screen', 'ecosystem-screen', 'activity-screen', 'settings-screen'];
        if (screens[index]) {
            navigateTo(screens[index]);
        }
    });
});

/* ------------------ Settings Interactions ------------------ */
const themeToggleSettings = document.getElementById('theme-toggle-settings');
const langToggleSettings = document.getElementById('lang-toggle-settings');

// Initialize settings toggles
if (themeToggleSettings) {
    themeToggleSettings.classList.toggle('active', currentTheme === 'dark');
    themeToggleSettings.addEventListener('click', () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        themeToggleSettings.classList.toggle('active', newTheme === 'dark');
    });
}

if (langToggleSettings) {
    langToggleSettings.textContent = currentLang === 'en' ? 'English' : '中文';
    langToggleSettings.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        localStorage.setItem('lang', currentLang);
        applyI18n();
        langToggleSettings.textContent = currentLang === 'en' ? 'English' : '中文';
    });
}

/* ------------------ Ecosystem Interactions ------------------ */
const ecosystemBtns = document.querySelectorAll('.ecosystem-btn');
ecosystemBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        alert('即将跳转到相应的生态项目页面！');
    });
});

/* ------------------ Settings Action Buttons ------------------ */
const settingsActionBtns = document.querySelectorAll('.settings-action-btn');
settingsActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('danger')) {
            if (confirm('确定要断开钱包连接吗？')) {
                // Disconnect wallet logic
                appState.wallet = null;
                localStorage.removeItem('connectedWallet');
                localStorage.removeItem('walletAddress');
                navigateTo('welcome-wallet-screen');
                alert('钱包已断开连接');
            }
        } else if (btn.textContent.includes('导出')) {
            alert('数据导出功能即将推出！');
        } else if (btn.textContent.includes('重置')) {
            if (confirm('确定要重置所有设置吗？')) {
                localStorage.clear();
                location.reload();
            }
        }
    });
});

// init
applyI18n();
initializeWalletState();

// Handle initial screen from URL
const urlParams = new URLSearchParams(window.location.search);
const initialScreen = urlParams.get('screen') || 'welcome-wallet-screen';
if (initialScreen !== 'welcome-wallet-screen') {
    navigateTo(initialScreen);
}