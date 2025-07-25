// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title INJDomainRegistry
 * @dev .inj域名注册系统智能合约
 * 支持去中心化的域名注册、转移和管理
 */
contract INJDomainRegistry is Ownable, ReentrancyGuard {
    using Strings for uint256;

    // 域名信息结构
    struct DomainInfo {
        address owner; // 域名所有者
        uint256 registeredAt; // 注册时间
        uint256 expiresAt; // 过期时间 (0表示永不过期)
        bool isActive; // 是否激活状态
        string metadata; // 元数据 (可存储头像、描述等)
    }

    // 状态变量
    mapping(string => DomainInfo) public domains; // 域名 -> 域名信息
    mapping(address => string) public primaryDomains; // 地址 -> 主域名
    mapping(address => string[]) public userDomains; // 地址 -> 拥有的所有域名
    mapping(string => address) public domainToAddress; // 域名 -> 地址 (便于查询)

    uint256 public registrationFee = 0.001 ether; // 注册费用
    uint256 public renewalFee = 0.0005 ether; // 续费费用
    uint256 public constant MIN_DOMAIN_LENGTH = 3; // 最小域名长度
    uint256 public constant MAX_DOMAIN_LENGTH = 30; // 最大域名长度
    uint256 public constant DOMAIN_DURATION = 365 days; // 域名有效期 (可设为0表示永久)

    // 事件
    event DomainRegistered(
        string indexed domain,
        address indexed owner,
        uint256 registeredAt,
        uint256 expiresAt
    );

    event DomainRenewed(
        string indexed domain,
        address indexed owner,
        uint256 newExpiresAt
    );

    event DomainTransferred(
        string indexed domain,
        address indexed from,
        address indexed to
    );

    event PrimaryDomainSet(address indexed user, string indexed domain);

    event DomainMetadataUpdated(string indexed domain, string metadata);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 注册.inj域名
     * @param domainPrefix 域名前缀 (不包含.inj后缀)
     */
    function register(
        string memory domainPrefix
    ) external payable nonReentrant {
        require(msg.value >= registrationFee, "Insufficient registration fee");
        require(_isValidDomainPrefix(domainPrefix), "Invalid domain prefix");

        string memory fullDomain = string(
            abi.encodePacked(domainPrefix, ".inj")
        );
        require(!_domainExists(fullDomain), "Domain already registered");

        uint256 expiresAt = block.timestamp + DOMAIN_DURATION;

        // 记录域名信息
        domains[fullDomain] = DomainInfo({
            owner: msg.sender,
            registeredAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true,
            metadata: ""
        });

        // 更新映射关系
        domainToAddress[fullDomain] = msg.sender;
        userDomains[msg.sender].push(fullDomain);

        // 如果用户没有主域名，设置为主域名
        if (bytes(primaryDomains[msg.sender]).length == 0) {
            primaryDomains[msg.sender] = fullDomain;
        }

        emit DomainRegistered(
            fullDomain,
            msg.sender,
            block.timestamp,
            expiresAt
        );
    }

    /**
     * @dev 续费域名
     * @param domain 完整域名 (包含.inj后缀)
     */
    function renewDomain(string memory domain) external payable nonReentrant {
        require(msg.value >= renewalFee, "Insufficient renewal fee");
        require(_domainExists(domain), "Domain does not exist");
        require(domains[domain].owner == msg.sender, "Not domain owner");

        uint256 newExpiresAt = domains[domain].expiresAt + DOMAIN_DURATION;
        domains[domain].expiresAt = newExpiresAt;

        emit DomainRenewed(domain, msg.sender, newExpiresAt);
    }

    /**
     * @dev 转移域名
     * @param domain 完整域名
     * @param to 新的所有者地址
     */
    function transferDomain(string memory domain, address to) external {
        require(_domainExists(domain), "Domain does not exist");
        require(domains[domain].owner == msg.sender, "Not domain owner");
        require(to != address(0), "Invalid recipient address");
        require(!_isDomainExpired(domain), "Domain expired");

        address from = msg.sender;

        // 更新域名所有者
        domains[domain].owner = to;
        domainToAddress[domain] = to;

        // 从原所有者的域名列表中移除
        _removeDomainFromUser(from, domain);

        // 添加到新所有者的域名列表
        userDomains[to].push(domain);

        // 如果转移的是主域名，清除原所有者的主域名
        if (
            keccak256(bytes(primaryDomains[from])) == keccak256(bytes(domain))
        ) {
            primaryDomains[from] = "";
        }

        // 如果新所有者没有主域名，设置为主域名
        if (bytes(primaryDomains[to]).length == 0) {
            primaryDomains[to] = domain;
        }

        emit DomainTransferred(domain, from, to);
    }

    /**
     * @dev 设置主域名
     * @param domain 要设置为主域名的域名
     */
    function setPrimaryDomain(string memory domain) external {
        require(_domainExists(domain), "Domain does not exist");
        require(domains[domain].owner == msg.sender, "Not domain owner");
        require(!_isDomainExpired(domain), "Domain expired");

        primaryDomains[msg.sender] = domain;
        emit PrimaryDomainSet(msg.sender, domain);
    }

    /**
     * @dev 更新域名元数据
     * @param domain 域名
     * @param metadata 元数据
     */
    function updateDomainMetadata(
        string memory domain,
        string memory metadata
    ) external {
        require(_domainExists(domain), "Domain does not exist");
        require(domains[domain].owner == msg.sender, "Not domain owner");
        require(!_isDomainExpired(domain), "Domain expired");

        domains[domain].metadata = metadata;
        emit DomainMetadataUpdated(domain, metadata);
    }

    /**
     * @dev 检查域名是否可用
     * @param domainPrefix 域名前缀
     * @return 是否可用
     */
    function isDomainAvailable(
        string memory domainPrefix
    ) external view returns (bool) {
        if (!_isValidDomainPrefix(domainPrefix)) {
            return false;
        }

        string memory fullDomain = string(
            abi.encodePacked(domainPrefix, ".inj")
        );
        return !_domainExists(fullDomain) || _isDomainExpired(fullDomain);
    }

    /**
     * @dev 解析域名到地址
     * @param domain 完整域名
     * @return 对应的地址
     */
    function resolveDomain(
        string memory domain
    ) external view returns (address) {
        if (!_domainExists(domain) || _isDomainExpired(domain)) {
            return address(0);
        }
        return domains[domain].owner;
    }

    /**
     * @dev 反向解析地址到主域名
     * @param addr 地址
     * @return 主域名
     */
    function reverseResolve(
        address addr
    ) external view returns (string memory) {
        string memory domain = primaryDomains[addr];
        if (bytes(domain).length == 0 || _isDomainExpired(domain)) {
            return "";
        }
        return domain;
    }

    /**
     * @dev 获取用户的所有域名
     * @param user 用户地址
     * @return 域名数组
     */
    function getUserDomains(
        address user
    ) external view returns (string[] memory) {
        return userDomains[user];
    }

    /**
     * @dev 获取域名详细信息
     * @param domain 域名
     * @return 域名信息结构
     */
    function getDomainInfo(
        string memory domain
    ) external view returns (DomainInfo memory) {
        return domains[domain];
    }

    // 内部函数

    /**
     * @dev 验证域名前缀格式
     */
    function _isValidDomainPrefix(
        string memory domainPrefix
    ) internal pure returns (bool) {
        bytes memory domainBytes = bytes(domainPrefix);
        uint256 length = domainBytes.length;

        // 检查长度
        if (length < MIN_DOMAIN_LENGTH || length > MAX_DOMAIN_LENGTH) {
            return false;
        }

        // 检查字符：只允许小写字母、数字、连字符
        // 不能以连字符开头或结尾，不能有连续连字符
        for (uint256 i = 0; i < length; i++) {
            bytes1 char = domainBytes[i];

            // 检查是否为有效字符
            if (
                !((char >= 0x61 && char <= 0x7A) || // a-z
                    (char >= 0x30 && char <= 0x39) || // 0-9
                    char == 0x2D)
            ) {
                // -
                return false;
            }

            // 不能以连字符开头或结尾
            if ((i == 0 || i == length - 1) && char == 0x2D) {
                return false;
            }

            // 不能有连续连字符
            if (i > 0 && char == 0x2D && domainBytes[i - 1] == 0x2D) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev 检查域名是否存在
     */
    function _domainExists(string memory domain) internal view returns (bool) {
        return domains[domain].owner != address(0);
    }

    /**
     * @dev 检查域名是否过期
     */
    function _isDomainExpired(
        string memory domain
    ) internal view returns (bool) {
        if (!_domainExists(domain)) {
            return true;
        }

        uint256 expiresAt = domains[domain].expiresAt;
        return expiresAt != 0 && block.timestamp > expiresAt;
    }

    /**
     * @dev 从用户域名列表中移除域名
     */
    function _removeDomainFromUser(
        address user,
        string memory domain
    ) internal {
        string[] storage userDomainList = userDomains[user];
        for (uint256 i = 0; i < userDomainList.length; i++) {
            if (
                keccak256(bytes(userDomainList[i])) == keccak256(bytes(domain))
            ) {
                userDomainList[i] = userDomainList[userDomainList.length - 1];
                userDomainList.pop();
                break;
            }
        }
    }

    // 管理员函数

    /**
     * @dev 设置注册费用
     */
    function setRegistrationFee(uint256 newFee) external onlyOwner {
        registrationFee = newFee;
    }

    /**
     * @dev 设置续费费用
     */
    function setRenewalFee(uint256 newFee) external onlyOwner {
        renewalFee = newFee;
    }

    /**
     * @dev 提取合约余额
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev 紧急冻结域名 (仅管理员)
     */
    function emergencyFreezeDomain(string memory domain) external onlyOwner {
        require(_domainExists(domain), "Domain does not exist");
        domains[domain].isActive = false;
    }

    /**
     * @dev 解冻域名 (仅管理员)
     */
    function unfreezeDomain(string memory domain) external onlyOwner {
        require(_domainExists(domain), "Domain does not exist");
        domains[domain].isActive = true;
    }
}
