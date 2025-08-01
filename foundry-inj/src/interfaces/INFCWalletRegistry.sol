// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title INFCWalletRegistry Interface
 * @dev NFCWalletRegistry合约接口定义
 */
interface INFCWalletRegistry {
    function isNFCBound(string memory nfcUID) external view returns (bool);
    function getNFCBinding(
        string memory nfcUID
    )
        external
        view
        returns (address, uint256, uint256, bool, bool, string memory);
}
