"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPasskey } from '@/lib/passkey';
import './passkey-create.css';

export default function PasskeyCreatePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [language, setLanguage] = useState('zh');

  // 处理返回按钮
  const handleGoBack = () => {
    router.push('/wallet-screen');
  };

  // 处理创建Passkey
  const handleCreatePasskey = async () => {
    if (!username.trim()) {
      setStatus('error');
      setErrorMessage('请输入用户名');
      return;
    }

    setStatus('creating');
    setErrorMessage('');

    try {
      const result = await createPasskey(username.trim());
      
      if (result.success) {
        setStatus('success');
        // 延迟跳转到铸造页面
        setTimeout(() => {
          router.push('/minting');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || '创建失败，请重试');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || '创建失败，请重试');
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (status) {
      case 'creating':
        return language === 'zh' ? '正在创建云托管通行证...' : 'Creating cloud-hosted passkey...';
      case 'success':
        return language === 'zh' ? '创建成功！正在跳转...' : 'Created successfully! Redirecting...';
      case 'error':
        return errorMessage || (language === 'zh' ? '创建失败，请重试' : 'Creation failed, please try again');
      default:
        return '';
    }
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

      {/* Passkey创建容器 */}
      <div className="passkey-create-container">
        <div className="passkey-create-card">
          <div className="passkey-create-header">
            <div className="passkey-icon">🔐</div>
            <h2>{language === 'zh' ? '创建您的云托管通行证' : 'Create Your Cloud-Hosted Passkey'}</h2>
            <p>{language === 'zh' ? '来访问 Injective 生态系统' : 'To access the Injective ecosystem'}</p>
          </div>

          <div className="passkey-create-form">
            <div className="input-group">
              <label htmlFor="passkey-username">
                {language === 'zh' ? '用户名' : 'Username'}
              </label>
              <input 
                type="text" 
                id="passkey-username" 
                placeholder={language === 'zh' ? '请输入用户名' : 'Enter username'} 
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={status === 'creating'}
                suppressHydrationWarning={true}
              />
              <small>{language === 'zh' ? '用户名将用于识别您的通行证' : 'Username will be used to identify your passkey'}</small>
            </div>

            <button 
              className="passkey-create-btn"
              onClick={handleCreatePasskey}
              disabled={status === 'creating' || !username.trim()}
            >
              <span>
                {status === 'creating' 
                  ? (language === 'zh' ? '创建中...' : 'Creating...') 
                  : (language === 'zh' ? '创建云托管通行证' : 'Create Cloud-Hosted Passkey')
                }
              </span>
            </button>

            <button 
              className="passkey-back-btn"
              onClick={handleGoBack}
              disabled={status === 'creating'}
            >
              <span>{language === 'zh' ? '返回' : 'Back'}</span>
            </button>
          </div>

          {/* 状态显示 */}
          {status !== 'idle' && (
            <div className={`passkey-status ${status}`}>
              {getStatusText()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
