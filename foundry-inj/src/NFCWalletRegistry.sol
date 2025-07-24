// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFCWalletRegistry
 * @dev NFC钱包注册系统，记录NFC UID与钱包地址的映射关系
 * 提供链上透明度和审计追踪
 */
contract NFCWalletRegistry is Ownable {
    using Strings for uint256;

    // NFC钱包绑定信息
    struct NFCBinding {
        address walletAddress; // 绑定的钱包地址
        uint256 boundAt; // 绑定时间
        bool isActive; // 是否激活状态
        string metadata; // 元数据信息
    }

    // 状态变量
    mapping(string => NFCBinding) public nfcBindings; // NFC UID -> 当前绑定信息
    mapping(string => NFCBinding[]) public nfcHistory; // NFC UID -> 历史绑定记录
    mapping(address => string[]) public walletToNFCs; // 钱包地址 -> 活跃NFC UID列表
    mapping(string => bool) public authorizedOperators; // 授权的操作者 (后端服务)

    uint256 public totalBindings; // 总绑定数量
    uint256 public totalUnbindings; // 总解绑数量

    // 事件
    event NFCWalletBound(
        string indexed nfcUID,
        address indexed walletAddress,
        uint256 boundAt
    );

    event NFCWalletUnbound(
        string indexed nfcUID,
        address indexed walletAddress,
        uint256 unboundAt,
        bool cardReset
    );

    event NFCCardReset(
        string indexed nfcUID,
        address indexed previousWallet,
        uint256 resetAt
    );

    event NFCMetadataUpdated(string indexed nfcUID, string metadata);

    event OperatorAuthorized(string indexed operatorId, bool authorized);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 绑定NFC UID到钱包地址
     * @param nfcUID NFC卡片的唯一标识符
     * @param walletAddress 钱包地址
     */
    function bindNFCWallet(
        string memory nfcUID,
        address walletAddress
    ) external onlyAuthorizedOperator {
        require(bytes(nfcUID).length > 0, "Invalid NFC UID");
        require(walletAddress != address(0), "Invalid wallet address");
        require(!isNFCBound(nfcUID), "NFC already bound");

        // 创建绑定记录
        nfcBindings[nfcUID] = NFCBinding({
            walletAddress: walletAddress,
            boundAt: block.timestamp,
            unboundAt: 0,
            isActive: true,
            isBlank: false,
            metadata: ""
        });

        // 更新钱包到NFC的映射
        walletToNFCs[walletAddress].push(nfcUID);
        totalBindings++;

        emit NFCWalletBound(nfcUID, walletAddress, block.timestamp);
    }

    /**
     * @dev 解绑NFC UID (仅限钱包所有者或授权操作者)
     * @param nfcUID NFC卡片的唯一标识符
     */
    function unbindNFCWallet(string memory nfcUID) external {
        require(isNFCBound(nfcUID), "NFC not bound");

        NFCBinding storage binding = nfcBindings[nfcUID];
        address walletAddress = binding.walletAddress;

        // 检查权限：必须是钱包所有者或授权操作者
        require(
            msg.sender == walletAddress || _isAuthorizedOperator(msg.sender),
            "Unauthorized to unbind"
        );

        // 从钱包的NFC列表中移除
        _removeNFCFromWallet(walletAddress, nfcUID);

        // 删除绑定记录
        delete nfcBindings[nfcUID];
        totalBindings--;

        emit NFCWalletUnbound(nfcUID, walletAddress, block.timestamp);
    }

    /**
     * @dev 更新NFC元数据
     * @param nfcUID NFC卡片UID
     * @param metadata 新的元数据
     */
    function updateNFCMetadata(
        string memory nfcUID,
        string memory metadata
    ) external onlyAuthorizedOperator {
        require(isNFCBound(nfcUID), "NFC not bound");

        nfcBindings[nfcUID].metadata = metadata;
        emit NFCMetadataUpdated(nfcUID, metadata);
    }

    /**
     * @dev 检查NFC是否已绑定
     * @param nfcUID NFC卡片UID
     * @return 是否已绑定
     */
    function isNFCBound(string memory nfcUID) public view returns (bool) {
        return
            nfcBindings[nfcUID].walletAddress != address(0) &&
            nfcBindings[nfcUID].isActive;
    }

    /**
     * @dev 获取NFC绑定的钱包地址
     * @param nfcUID NFC卡片UID
     * @return 绑定的钱包地址
     */
    function getNFCWallet(
        string memory nfcUID
    ) external view returns (address) {
        if (!isNFCBound(nfcUID)) {
            return address(0);
        }
        return nfcBindings[nfcUID].walletAddress;
    }

    /**
     * @dev 获取钱包绑定的所有NFC
     * @param walletAddress 钱包地址
     * @return NFC UID数组
     */
    function getWalletNFCs(
        address walletAddress
    ) external view returns (string[] memory) {
        return walletToNFCs[walletAddress];
    }

    /**
     * @dev 获取NFC绑定信息
     * @param nfcUID NFC卡片UID
     * @return 绑定信息结构
     */
    function getNFCBinding(
        string memory nfcUID
    ) external view returns (NFCBinding memory) {
        return nfcBindings[nfcUID];
    }

    /**
     * @dev 获取系统统计信息
     * @return 总绑定数量
     */
    function getStats() external view returns (uint256) {
        return totalBindings;
    }

    // 内部函数

    /**
     * @dev 从钱包的NFC列表中移除指定NFC
     */
    function _removeNFCFromWallet(
        address walletAddress,
        string memory nfcUID
    ) internal {
        string[] storage nfcList = walletToNFCs[walletAddress];
        for (uint256 i = 0; i < nfcList.length; i++) {
            if (keccak256(bytes(nfcList[i])) == keccak256(bytes(nfcUID))) {
                nfcList[i] = nfcList[nfcList.length - 1];
                nfcList.pop();
                break;
            }
        }
    }

    /**
     * @dev 检查是否为授权操作者
     */
    function _isAuthorizedOperator(
        address operator
    ) internal view returns (bool) {
        // 将地址转换为字符串进行检查
        return authorizedOperators[Strings.toHexString(uint160(operator), 20)];
    }

    // 权限控制修饰符

    modifier onlyAuthorizedOperator() {
        require(
            _isAuthorizedOperator(msg.sender) || msg.sender == owner(),
            "Not authorized operator"
        );
        _;
    }

    // 管理员函数

    /**
     * @dev 授权操作者
     * @param operatorId 操作者标识符（通常是地址字符串）
     * @param authorized 是否授权
     */
    function setOperatorAuthorization(
        string memory operatorId,
        bool authorized
    ) external onlyOwner {
        authorizedOperators[operatorId] = authorized;
        emit OperatorAuthorized(operatorId, authorized);
    }

    /**
     * @dev 紧急冻结NFC绑定
     * @param nfcUID NFC卡片UID
     */
    function emergencyFreezeNFC(string memory nfcUID) external onlyOwner {
        require(isNFCBound(nfcUID), "NFC not bound");
        nfcBindings[nfcUID].isActive = false;
    }

    /**
     * @dev 解冻NFC绑定
     * @param nfcUID NFC卡片UID
     */
    function unfreezeNFC(string memory nfcUID) external onlyOwner {
        require(
            nfcBindings[nfcUID].walletAddress != address(0),
            "NFC not exists"
        );
        nfcBindings[nfcUID].isActive = true;
    }

    /**
     * @dev 批量绑定NFC (管理员功能，用于数据迁移)
     * @param nfcUIDs NFC UID数组
     * @param walletAddresses 对应的钱包地址数组
     */
    function batchBindNFCs(
        string[] memory nfcUIDs,
        address[] memory walletAddresses
    ) external onlyOwner {
        require(
            nfcUIDs.length == walletAddresses.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < nfcUIDs.length; i++) {
            if (!isNFCBound(nfcUIDs[i]) && walletAddresses[i] != address(0)) {
                nfcBindings[nfcUIDs[i]] = NFCBinding({
                    walletAddress: walletAddresses[i],
                    boundAt: block.timestamp,
                    isActive: true,
                    metadata: ""
                });

                walletToNFCs[walletAddresses[i]].push(nfcUIDs[i]);
                totalBindings++;

                emit NFCWalletBound(
                    nfcUIDs[i],
                    walletAddresses[i],
                    block.timestamp
                );
            }
        }
    }
}
