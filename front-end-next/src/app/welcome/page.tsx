"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import Image from 'next/image';
import './welcome.css';

export default function Welcome() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [language, setLanguage] = useState('zh'); 

  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 5000);
    
    return () => clearInterval(flipInterval);
  }, []);

  const handleCreatePass = () => {
    router.push('/nfc-scan');
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-black bg-cover bg-center bg-no-repeat" style={{ 
        backgroundImage: "url('/injbg.png')",
      }}>
        {/* 背景特效 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-gradient-radial from-indigo-500/15 to-transparent to-70% z-[1] pointer-events-none animate-background-pulse"></div>
        <div className="grid-overlay"></div>
        
        {/* 语言切换按钮 */}
        <button 
          onClick={() => setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'))}
          className="fixed top-4 right-4 z-[100] bg-white/80 border border-indigo-500/10 rounded-full p-1.5 w-9 h-9 text-sm text-gray-800 cursor-pointer shadow-lg"
        >
          {language === 'zh' ? 'EN' : '中'}
        </button>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 m-0 max-w-7xl w-full h-screen px-8 items-center justify-center relative z-[2]">
          {/* 左侧内容 */}
          <div className="text-left lg:ml-28 lg:-mt-8 lg:text-left text-center">
            {/* 图标 */}
            <div className="relative inline-block mb-6">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-radial from-indigo-500/30 to-transparent rounded-full animate-pulse"></div>
              <span className="relative z-[2] text-5xl">🎯</span>
            </div>
            
            {/* 徽章 */}
            <div className="mb-4 flex lg:justify-start justify-center">
              <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-amber-500 text-white py-2 px-5 rounded-full text-sm font-semibold tracking-wider shadow-lg shadow-red-500/20 animate-badge-breath">
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-badge-shimmer"></div>
                {language === 'zh' ? 'AdventureX 2025 特别款' : 'AdventureX 2025 Special Edition'}
              </div>
            </div>
            
            {/* 标题 */}
            <h2 className="text-5xl font-black m-0 mb-4 bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">
              Injective Pass
            </h2>
            
            {/* 副标题 */}
            <p className="text-xl text-gray-400 m-0 mb-10 leading-relaxed font-medium">
              {language === 'zh' ? '你的专属数字身份' : 'Your exclusive digital identity'}
            </p>
            
            {/* 特性列表 */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4 text-lg text-white font-medium lg:justify-start justify-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-full text-lg font-semibold shadow-lg shadow-indigo-500/20">⚡</div>
                <span>{language === 'zh' ? '1秒获取链上身份' : '1s to get on-chain identity'}</span>
              </div>
              <div className="flex items-center gap-4 mb-4 text-lg text-white font-medium lg:justify-start justify-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-full text-lg font-semibold shadow-lg shadow-indigo-500/20">🌐</div>
                <span>{language === 'zh' ? '专属唯一.inj域名' : 'Exclusive unique .inj domain'}</span>
              </div>
              <div className="flex items-center gap-4 mb-4 text-lg text-white font-medium lg:justify-start justify-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-full text-lg font-semibold shadow-lg shadow-indigo-500/20">🔐</div>
                <span>{language === 'zh' ? '无密码安全登录' : 'Passwordless secure login'}</span>
              </div>
            </div>
            
            {/* 按钮 */}
            <button 
              onClick={handleCreatePass}
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 to-teal-500 text-white py-3 px-6 rounded-full text-lg font-semibold tracking-wider shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 lg:mx-0 mx-auto"
            >
              <span className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-500 group-hover:left-full"></span>
              <span>{language === 'zh' ? '开始创建' : 'Start Creating'}</span>
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* 右侧卡片预览 */}
          <div className="flex justify-center items-center lg:-ml-12 lg:mt-20">
            <div className="relative perspective-1000">
              <div className={`w-[350px] h-[225px] bg-gradient-to-br from-white/80 to-white/95 border-2 border-indigo-500/8 rounded-2xl backdrop-blur-xl shadow-2xl shadow-indigo-500/15 animate-card-float relative overflow-hidden scale-125 ${isFlipped ? 'auto-flip' : ''}`}>
                <div className="w-full h-full transition-transform duration-700 transform-style-3d relative pass-card-inner">
                  {/* 卡片正面 */}
                  <div className="absolute w-full h-full backface-hidden top-0 left-0 rounded-2xl overflow-hidden box-border bg-gradient-to-br from-white/80 to-white/95 p-7">
                    <div className="pass-header flex justify-between items-center mb-6">
                      <div className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">Injective</div>
                      <div className="text-xs font-semibold text-teal-500 bg-indigo-500/5 py-1 px-2 rounded-full border border-indigo-500/10">On-Chain</div>
                    </div>
                    <div className="flex gap-5">
                      <div className="w-[50px] h-[50px] bg-gradient-to-br from-indigo-500 to-teal-500 rounded-full opacity-70 flex items-center justify-center text-white text-2xl">👤</div>
                      <div className="flex flex-col justify-center">
                        <div className="text-xl font-bold text-gray-800 mb-2">yourname.inj</div>
                        <div className="text-sm text-gray-500 font-mono">ID: 0x1234...5678</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 卡片背面 */}
                  <div className="absolute w-full h-full backface-hidden top-0 left-0 rounded-2xl overflow-hidden box-border bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center relative border-none p-0 m-0 rotate-y-180">
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08)_0%,transparent_50%)] rounded-2xl pointer-events-none"></div>
                    <div className="text-center text-white relative z-[2] w-full">
                      <div className="mb-4">
                        <Image src="/advxlogo.png" alt="AdvX Logo" width={48} height={48} className="mx-auto" />
                      </div>
                      <div className="text-2xl font-bold mb-2">{language === 'zh' ? 'AdventureX 2025' : 'AdventureX 2025'}</div>
                      <div className="text-base opacity-90">{language === 'zh' ? '特别版数字身份' : 'Special Edition Digital Identity'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}