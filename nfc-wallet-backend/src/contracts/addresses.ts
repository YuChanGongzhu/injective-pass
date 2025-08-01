// 智能合约地址配置
// 部署时间: 2025年7月30日
// 网络: Injective EVM 测试网

export const CONTRACT_ADDRESSES = {
    // NFC钱包注册合约
    NFC_WALLET_REGISTRY: '0x8295361432506D1567FEd19E005343E6367f800a',

    // Injective域名NFT合约
    INJ_DOMAIN_NFT: '0x9c3004523A9e558A13298dc8D9a4BfB78b1f3930',

    // 社交抽卡Cat NFT合约
    CAT_NFT: '0x18b4748eaE049Ed46988c6f9c6a782E08059ABa8',
} as const;

// 合约部署信息
export const DEPLOYMENT_INFO = {
    DEPLOYER: '0x1dd50ffF32Ecde6694e56C5bBfE902Fcbc8d2441',
    NETWORK: 'Injective EVM Testnet',
    RPC_URL: 'https://k8s.testnet.json-rpc.injective.network/',
    CHAIN_ID: 1439,
    DEPLOYED_AT: '2025-07-30',

    TRANSACTIONS: {
        NFC_WALLET_REGISTRY: '0xe9fb2d5695273d67bfca8873275c0f9751b4c2f4eafb09562e16abcd88994c52',
        INJ_DOMAIN_NFT: '0x56954fb73177c46cec6571d64a007f3d210f7770543c06a540924b60778eb951',
        CAT_NFT: '0xa09fe1d1685ba282eaf03c8d579a78ad614673a12f87e037c6dcf7b21abfc9fb',
    }
} as const;

// 类型定义
export type ContractName = keyof typeof CONTRACT_ADDRESSES;
export type TransactionHash = keyof typeof DEPLOYMENT_INFO.TRANSACTIONS;
