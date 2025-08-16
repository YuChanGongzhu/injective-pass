"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IdCard from '@/components/dashboard/IdCard';
import BalanceModule from '@/components/dashboard/BalanceModule';
import CollectionGrid from '@/components/dashboard/CollectionGrid';
import { NfcApi } from '@/lib/api';
import './dashboard.css';

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<{
    domain: string;
    imageUrl: string;
    walletAddress: string;
  } | null>(null);
  
  const [balances, setBalances] = useState({
    inj: '0',
    usdt: '0',
    xp: '0'
  });
  
  const [loading, setLoading] = useState(true);

  // 生成模拟钱包地址
  const generateMockAddress = (uid: string | null): string => {
    if (!uid) return 'inj1' + Math.random().toString(36).substring(2, 15);
    return 'inj1' + uid.replace(/:/g, '').substring(0, 38);
  };

  useEffect(() => {
    // 从localStorage获取用户数据
    const loadUserData = async () => {
      try {
        const storedDomain = localStorage.getItem('userDomain');
        const storedNfcUid = localStorage.getItem('nfcUid');
        
        if (!storedDomain) {
          console.log('未找到用户域名，重定向到铸造页面');
          router.push('/minting');
          return;
        }
        
        // 获取或生成钱包地址
        let walletAddress = localStorage.getItem('walletAddress');
        if (!walletAddress) {
          // 如果没有存储的钱包地址，尝试从API获取或生成一个模拟地址
          try {
            if (storedNfcUid) {
              const walletData = await NfcApi.wallet(storedNfcUid);
              walletAddress = walletData.address;
            }
          } catch (error) {
            console.error('获取钱包地址失败:', error);
          }
          
          // 如果API调用失败或没有NFC UID，生成一个模拟地址
          if (!walletAddress) {
            walletAddress = generateMockAddress(storedNfcUid);
          }
          
          // 保存到localStorage
          localStorage.setItem('walletAddress', walletAddress);
        }
        
        // 生成NFT图像URL
        const imageUrl = localStorage.getItem('nftImageUrl') || 
          `https://placehold.co/400x600/FFFFFF/1F2937?text=${storedDomain}`;
        
        setUserData({
          domain: storedDomain,
          imageUrl: imageUrl,
          walletAddress: walletAddress
        });
        
        // 获取余额数据
        fetchBalances(walletAddress);
      } catch (error) {
        console.error('加载用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);
  
  // 获取余额数据
  const fetchBalances = async (address: string) => {
    try {
      // 调用API获取余额
      const balanceData = await NfcApi.balance(address);
      setBalances({
        inj: balanceData.inj || '0',
        usdt: balanceData.usdt || '0',
        xp: '100' // 示例XP值，API中可能没有返回
      });
    } catch (error) {
      console.error('获取余额失败:', error);
      // 使用模拟数据
      setBalances({
        inj: '1.234',
        usdt: '5.67',
        xp: '100'
      });
    }
  };

  // 如果正在加载或没有用户数据，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">加载中...</div>
      </div>
    );
  }
  
  // 如果没有用户数据，将在useEffect中重定向
  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 动画背景 */}
      <div className="animated-background">
        <div className="blur-orb orb1"></div>
        <div className="blur-orb orb2"></div>
        <div className="blur-orb orb3"></div>
        <div className="blur-orb orb4"></div>
        <div className="blur-orb orb5"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="geo-shape"></div>
        <div className="geo-shape"></div>
        <div className="grid-overlay"></div>
      </div>
      
      {/* 主内容 */}
      <div className="dashboard-container">
        <h1 className="text-2xl font-bold mt-8 mb-2">Dashboard</h1>
        
        {/* ID卡片 */}
        <IdCard 
          domain={userData.domain}
          imageUrl={userData.imageUrl}
          walletAddress={userData.walletAddress}
        />
        
        {/* 余额部分 */}
        <div className="balance-section">
          <BalanceModule 
            title="INJ Balance"
            amount={`${balances.inj} INJ`}
            subAmount={`≈ $${balances.usdt} USDT`}
            address={userData.walletAddress}
          />
          <BalanceModule 
            title="Injective XP"
            amount={balances.xp}
            subAmount="Community Points"
          />
        </div>
        
        {/* 收藏品部分 */}
        <div className="collection-section">
          <h2 className="collection-title">My Collection</h2>
          <CollectionGrid />
        </div>
      </div>
      
      {/* Powered by */}
      <div className="powered-by-container">
        <span className="powered-by-text">Powered by</span>
        <img src="/injective-logo.svg" alt="Injective" className="powered-by-image" />
      </div>
    </div>
  );
}
