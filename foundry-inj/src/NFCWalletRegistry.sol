// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

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
        uint256 unboundAt; // 解绑时间 (0表示仍在绑定中)
        bool isActive; // 是否激活状态
        bool isBlank; // 是否为空白卡片（未初始化）
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

    event BlankCardDetected(
        string indexed nfcUID,
        address indexed newWallet,
        uint256 timestamp
    );

    event CardInitialized(
        string indexed nfcUID,
        address indexed walletAddress,
        uint256 timestamp
    );

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
     * @dev 检测空白卡并自动创建账户
     * @param nfcUID NFC卡片的唯一标识符
     * @param newWalletAddress 为该卡片新创建的钱包地址
     * @return 是否为空白卡并成功绑定
     */
    function detectAndBindBlankCard(
        string memory nfcUID,
        address newWalletAddress
    ) public onlyAuthorizedOperator returns (bool) {
        require(bytes(nfcUID).length > 0, "Invalid NFC UID");
        require(newWalletAddress != address(0), "Invalid wallet address");

        // 检查是否为空白卡（未绑定过）
        if (isNFCBound(nfcUID)) {
            return false; // 不是空白卡
        }

        // 创建绑定记录，标记为空白卡初始状态
        nfcBindings[nfcUID] = NFCBinding({
            walletAddress: newWalletAddress,
            boundAt: block.timestamp,
            unboundAt: 0,
            isActive: true,
            isBlank: true, // 标记为空白卡
            metadata: "auto_created"
        });

        // 添加到历史记录
        nfcHistory[nfcUID].push(nfcBindings[nfcUID]);

        // 添加到钱包的NFC列表
        walletToNFCs[newWalletAddress].push(nfcUID);
        totalBindings++;

        emit BlankCardDetected(nfcUID, newWalletAddress, block.timestamp);
        emit NFCWalletBound(nfcUID, newWalletAddress, block.timestamp);

        return true;
    }

    /**
     * @dev 初始化空白卡（用户首次操作时）
     * @param nfcUID NFC卡片的唯一标识符
     * @param initMetadata 初始化元数据
     */
    function initializeBlankCard(
        string memory nfcUID,
        string memory initMetadata
    ) external onlyAuthorizedOperator {
        require(isNFCBound(nfcUID), "NFC not bound");

        NFCBinding storage binding = nfcBindings[nfcUID];
        require(binding.isBlank, "Card is not blank");
        require(binding.isActive, "Card is not active");

        // 将卡片标记为已初始化
        binding.isBlank = false;
        binding.metadata = initMetadata;

        emit CardInitialized(nfcUID, binding.walletAddress, block.timestamp);
    }

    /**
     * @dev 批量检测多张空白卡
     * @param nfcUIDs NFC UID数组
     * @param walletAddresses 对应的新钱包地址数组
     * @return 成功绑定的空白卡数量
     */
    function batchDetectBlankCards(
        string[] memory nfcUIDs,
        address[] memory walletAddresses
    ) external onlyAuthorizedOperator returns (uint256) {
        require(
            nfcUIDs.length == walletAddresses.length,
            "Array length mismatch"
        );

        uint256 successCount = 0;

        for (uint256 i = 0; i < nfcUIDs.length; i++) {
            if (detectAndBindBlankCard(nfcUIDs[i], walletAddresses[i])) {
                successCount++;
            }
        }

        return successCount;
    }

    /**
     * @dev 解绑NFC UID (仅限钱包所有者使用签名验证)
     * @param nfcUID NFC卡片的唯一标识符
     * @param ownerSignature 钱包所有者的签名
     */
    function unbindNFCWallet(
        string memory nfcUID,
        bytes memory ownerSignature
    ) external {
        require(isNFCBound(nfcUID), "NFC not bound");

        NFCBinding storage binding = nfcBindings[nfcUID];
        address walletAddress = binding.walletAddress;

        // 验证签名（确保是私钥所有者授权）
        require(
            _verifyOwnerSignature(
                walletAddress,
                nfcUID,
                "unbind",
                ownerSignature
            ),
            "Invalid signature"
        );

        // 从钱包的NFC列表中移除
        _removeNFCFromWallet(walletAddress, nfcUID);

        // 更新绑定记录状态而不是删除
        binding.isActive = false;
        binding.unboundAt = block.timestamp;

        totalBindings--;
        totalUnbindings++;

        emit NFCWalletUnbound(nfcUID, walletAddress, block.timestamp, false);
    }

    /**
     * @dev 授权操作者解绑（仅限紧急情况）
     * @param nfcUID NFC卡片的唯一标识符
     */
    function emergencyUnbindNFCWallet(
        string memory nfcUID
    ) external onlyAuthorizedOperator {
        require(isNFCBound(nfcUID), "NFC not bound");

        NFCBinding storage binding = nfcBindings[nfcUID];
        address walletAddress = binding.walletAddress;

        // 从钱包的NFC列表中移除
        _removeNFCFromWallet(walletAddress, nfcUID);

        // 更新绑定记录状态而不是删除
        binding.isActive = false;
        binding.unboundAt = block.timestamp;

        totalBindings--;
        totalUnbindings++;

        emit NFCWalletUnbound(nfcUID, walletAddress, block.timestamp, true);
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
     * @dev 检查NFC是否为空白卡
     * @param nfcUID NFC卡片UID
     * @return 是否为空白卡
     */
    function isBlankCard(string memory nfcUID) external view returns (bool) {
        if (!isNFCBound(nfcUID)) {
            return true; // 未绑定的卡都视为空白卡
        }
        return nfcBindings[nfcUID].isBlank;
    }

    /**
     * @dev 获取钱包绑定的所有活跃NFC卡片
     * @param walletAddress 钱包地址
     * @return NFC UID数组
     */
    function getWalletActiveNFCs(
        address walletAddress
    ) external view returns (string[] memory) {
        string[] memory allNFCs = walletToNFCs[walletAddress];
        uint256 activeCount = 0;

        // 先统计活跃的卡片数量
        for (uint256 i = 0; i < allNFCs.length; i++) {
            if (nfcBindings[allNFCs[i]].isActive) {
                activeCount++;
            }
        }

        // 创建活跃卡片数组
        string[] memory activeNFCs = new string[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allNFCs.length; i++) {
            if (nfcBindings[allNFCs[i]].isActive) {
                activeNFCs[index] = allNFCs[i];
                index++;
            }
        }

        return activeNFCs;
    }

    /**
     * @dev 获取钱包的卡片统计信息
     * @param walletAddress 钱包地址
     * @return totalCards 总卡片数, activeCards 活跃卡片数, blankCards 空白卡数
     */
    function getWalletCardStats(
        address walletAddress
    )
        external
        view
        returns (uint256 totalCards, uint256 activeCards, uint256 blankCards)
    {
        string[] memory allNFCs = walletToNFCs[walletAddress];
        totalCards = allNFCs.length;

        for (uint256 i = 0; i < allNFCs.length; i++) {
            NFCBinding memory binding = nfcBindings[allNFCs[i]];
            if (binding.isActive) {
                activeCards++;
                if (binding.isBlank) {
                    blankCards++;
                }
            }
        }
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

    /**
     * @dev 验证所有者签名
     * @param owner 钱包所有者地址
     * @param nfcUID NFC卡片UID
     * @param action 操作类型
     * @param signature 签名数据
     * @return 签名是否有效
     */
    function _verifyOwnerSignature(
        address owner,
        string memory nfcUID,
        string memory action,
        bytes memory signature
    ) internal view returns (bool) {
        // 构造签名消息
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                "32",
                keccak256(
                    abi.encodePacked(owner, nfcUID, action, block.chainid)
                )
            )
        );

        // 恢复签名者地址
        address signer = _recoverSigner(messageHash, signature);

        return signer == owner;
    }

    /**
     * @dev 从签名中恢复签名者地址
     * @param messageHash 消息哈希
     * @param signature 签名数据
     * @return 签名者地址
     */
    function _recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");

        return ecrecover(messageHash, v, r, s);
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
                    unboundAt: 0,
                    isActive: true,
                    isBlank: false,
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



