"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isIOS, isAndroid, isMac, isPasskeySupported } from '@/lib/deviceDetection';
import { getPasskeySignature, hasExistingPasskey } from '@/lib/passkey';
import './wallet.css';

export default function WalletScreen() {
  const router = useRouter();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [language, setLanguage] = useState('zh');

  // iOS和Mac设备检测和passkey处理
  useEffect(() => {
    const handlePasskeyDevices = async () => {
      if ((isIOS() || isMac()) && await isPasskeySupported()) {
        try {
          if (hasExistingPasskey()) {
            // 已有passkey，直接登录
            const result = await getPasskeySignature();
            if (result.success) {
              console.log('Passkey登录成功:', result.username);
              // 直接跳转到铸造页面
              router.push('/minting');
              return;
            } else {
              console.error('Passkey登录失败:', result.error);
              // 如果登录失败，跳转到创建页面
              router.push('/passkey-create');
              return;
            }
          } else {
            // 没有passkey，跳转到创建页面
            router.push('/passkey-create');
            return;
          }
        } catch (error) {
          console.error('Passkey处理失败:', error);
          // 出错时跳转到创建页面
          router.push('/passkey-create');
          return;
        }
      }
    };

    handlePasskeyDevices();
  }, [router]);

  // 处理钱包选择
  const handleWalletSelect = (wallet: string) => {
    setSelectedWallet(wallet);
    // 显示Adventure部分
    const adventureSection = document.getElementById('adventure-section');
    if (adventureSection) {
      adventureSection.style.display = 'block';
    }
    
    // 启用继续按钮
    const continueBtn = document.getElementById('wallet-continue-btn');
    if (continueBtn) {
      continueBtn.removeAttribute('disabled');
    }
  };

  // 处理返回按钮
  const handleGoBack = () => {
    router.push('/welcome');
  };

  // 处理继续按钮
  const handleContinue = () => {
    if (selectedWallet) {
      // 根据设备类型决定跳转
      if (isAndroid()) {
        router.push('/nfc-scan');
      } else {
        router.push('/nfc-scan');
      }
    }
  };

  // 处理跳过按钮
  const handleSkip = () => {
    router.push('/nfc-scan');
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-black">
      {/* 返回按钮 */}
      <button 
        onClick={handleGoBack}
        className="absolute top-4 left-4 z-50 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-all duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 动画背景 */}
      <div className="animated-background">
        <div className="blur-orb orb1"></div>
        <div className="blur-orb orb2"></div>
        <div className="blur-orb orb3"></div>
        <div className="blur-orb orb4"></div>
        <div className="blur-orb orb5"></div>
        <div className="blur-orb orb6"></div>
        <div className="blur-orb orb7"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="geo-shape"></div>
        <div className="geo-shape"></div>
        <div className="geo-shape"></div>
        <div className="geo-shape"></div>
        <div className="geo-shape"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* 钱包选择容器 */}
      <div className="wallet-selection-container">
        <h2 className="text-2xl font-bold text-white mb-2">
          {language === 'zh' ? '选择钱包连接' : 'Select Wallet Connection'}
        </h2>
        <p className="wallet-subtitle">
          {language === 'zh' ? '请选择一个钱包继续，或跳过直接扫描 NFC' : 'Select a wallet to continue, or skip and scan NFC directly'}
        </p>
        
        {/* 钱包选项网格 */}
        <div className="wallet-grid">
          <button 
            className={`wallet-option ${selectedWallet === 'adventure25' ? 'selected' : ''}`}
            onClick={() => handleWalletSelect('adventure25')}
          >
            <span className="hot-badge">HOT</span>
            <span className="wallet-icon">🌟</span>
            <span>{language === 'zh' ? 'Adventure 25\'' : 'Adventure 25\''}</span>
          </button>
          
          <button 
            className={`wallet-option ${selectedWallet === 'metamask' ? 'selected' : ''}`}
            onClick={() => handleWalletSelect('metamask')}
          >
            <span className="wallet-icon">🦊</span>
            <span>MetaMask</span>
          </button>
          
          <button 
            className={`wallet-option ${selectedWallet === 'tokenpocket' ? 'selected' : ''}`}
            onClick={() => handleWalletSelect('tokenpocket')}
          >
            <span className="wallet-icon">💼</span>
            <span>Token Pocket</span>
          </button>
        </div>
        
        {/* Adventure部分 */}
        <div id="adventure-section" className="hidden">
          <h2 className="text-xl font-bold text-white mt-8 mb-2">
            {language === 'zh' ? '选择激活方式' : 'Choose how to activate'}
          </h2>
          <p className="text-gray-400 mb-6">
            {language === 'zh' ? '选择一个钱包继续，或跳过直接扫描 NFC' : 'Select a wallet to continue, or skip and scan NFC directly'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              id="wallet-continue-btn"
              onClick={handleContinue}
              disabled={!selectedWallet}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'zh' ? '继续' : 'Continue'}
            </button>
            
            <button 
              id="wallet-skip-btn"
              onClick={handleSkip}
              className="btn-ghost"
            >
              {language === 'zh' ? '跳过，扫描 NFC' : 'Skip, scan NFC'}
            </button>
          </div>
        </div>
      </div>

      {/* Powered by 图片 */}
      <div className="powered-by-container">
        <span className="powered-by-text">Powered by</span>
        <Image src="/injbg.png" alt="Injective" width={120} height={30} className="powered-by-image" />
      </div>
    </div>
  );
}
