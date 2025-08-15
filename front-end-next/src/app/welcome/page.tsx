"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import Image from 'next/image';

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
    <>
      
      <div className="screen active">
        <button className="lang-toggle disabled">
          {language === 'zh' ? 'EN' : '中'}
        </button>

        
        <div className="inj-pass-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <div className="pass-glow"></div>
              <span>🎯</span>
            </div>
            <div className="hero-badge">
              <span className="badge-text">
                {language === 'zh' ? 'AdventureX 2025 特别款' : 'AdventureX 2025 Special Edition'}
              </span>
            </div>
            <h2 className="hero-title">Injective Pass</h2>
            <p className="hero-subtitle">
              {language === 'zh' ? '你的专属数字身份' : 'Your exclusive digital identity'}
            </p>
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-dot">⚡</span>
                <span>{language === 'zh' ? '1秒获取链上身份' : '1s to get on-chain identity'}</span>
              </div>
              <div className="feature-item">
                <span className="feature-dot">🌐</span>
                <span>{language === 'zh' ? '专属唯一.inj域名' : 'Exclusive unique .inj domain'}</span>
              </div>
              <div className="feature-item">
                <span className="feature-dot">🔐</span>
                <span>{language === 'zh' ? '无密码安全登录' : 'Passwordless secure login'}</span>
              </div>
            </div>
            <button className="hero-btn" onClick={handleCreatePass}>
              <span>{language === 'zh' ? '开始创建' : 'Start Creating'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
          <div className="hero-visual">
            <div className="pass-preview">
              <div className={`pass-card ${isFlipped ? 'auto-flip' : ''}`}>
                <div className="pass-card-inner">
                  <div className="pass-card-front">
                    <div className="pass-header">
                      <div className="pass-logo">Injective</div>
                      <div className="pass-status">On-Chain</div>
                    </div>
                    <div className="pass-body">
                      <div className="pass-photo"></div>
                      <div className="pass-info">
                        <div className="pass-name">yourname.inj</div>
                        <div className="pass-id">ID: 0x1234...5678</div>
                      </div>
                    </div>
                  </div>
                  <div className="pass-card-back">
                    <div className="advx-content">
                      <div className="advx-icon">
                        <Image 
                          src="/advxlogo.png" 
                          alt="AdvX Logo" 
                          width={48} 
                          height={48} 
                          style={{objectFit: 'contain'}} 
                        />
                      </div>
                      <div className="advx-title">AdventureX</div>
                      <div className="advx-subtitle">{language === 'zh' ? '让创造发生' : 'Make Creation Happen'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="powered-by-container" style={{ display: 'none' }}>
          <span className="powered-by-text">Powered by</span>
          <Image src="/injbg.png" alt="Injective" width={120} height={40} className="powered-by-image" />
        </div>
      </div>

      <style jsx>{`
        /* --- Base Styles & Variables --- */
        :root {
          /* Light Theme (Default) */
          --bg-color: #FAFBFC;
          --primary-text: #1F2937;
          --secondary-text: #6B7280;
          --muted-text: #9CA3AF;

          --blue-light: #4c3dff;
          --blue-dark: #4338ca;
          --blue-accent: #6366f1;

          --teal-light: #14B8A6;
          --teal-dark: #0D9488;
          --teal-accent: #10b981;

          --red-light: #F87171;
          --red-accent: #ef4444;

          --purple-accent: #8b5cf6;
          --orange-accent: #f97316;
          --pink-accent: #ec4899;
          --yellow-accent: #eab308;

          --surface: rgba(255, 255, 255, 0.95);
          --surface-muted: rgba(76, 61, 255, 0.05);
          --surface-border: rgba(76, 61, 255, 0.1);
          --glass: rgba(255, 255, 255, 0.9);
          --glass-border: rgba(76, 61, 255, 0.15);

          --card-bg: rgba(255, 255, 255, 0.8);
          --card-border: rgba(76, 61, 255, 0.08);
        }

        /* Dark Theme - 可以通过数据属性切换 */
        [data-theme="dark"] {
          --bg-color: #000000;
          --primary-text: #FFFFFF;
          --secondary-text: #9CA3AF;
          --muted-text: #6B7280;

          --surface: rgba(31, 41, 55, 0.95);
          --surface-muted: rgba(76, 61, 255, 0.08);
          --surface-border: rgba(76, 61, 255, 0.15);
          --glass: rgba(31, 41, 55, 0.9);
          --glass-border: rgba(76, 61, 255, 0.2);

          --card-bg: rgba(17, 24, 39, 0.8);
          --card-border: rgba(76, 61, 255, 0.12);
        }

        .screen {
          margin: 0;
          background-color: var(--bg-color);
          color: var(--primary-text);
          overflow-x: hidden;
          overflow-y: auto;
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        /* --- Language Toggle --- */
        .lang-toggle {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 100;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 9999px;
          padding: 0.375rem;
          width: 2.25rem;
          height: 2.25rem;
          font-size: 0.875rem;
          color: var(--primary-text);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .inj-pass-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          margin: 0;
          max-width: 1200px;
          width: 100%;
          height: 100vh;
          padding: 0 2rem;
          align-items: center;
          justify-content: center;
        }

        .hero-content {
          text-align: left;
          margin-left: 1.75cm;
          margin-top: -0.5cm;
        }

        .hero-icon {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .hero-icon span {
          font-size: 3rem;
          position: relative;
          z-index: 2;
        }

        .pass-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(76, 61, 255, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 2s infinite ease-in-out;
        }

        .hero-badge {
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
        }

        .badge-text {
          background: linear-gradient(135deg, #ef4444, #f59e0b);
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
          animation: badgeBreath 3s infinite ease-in-out;
          position: relative;
          overflow: hidden;
        }

        .badge-text::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: badgeShimmer 4s infinite;
        }

        @keyframes badgeBreath {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 6px 24px rgba(239, 68, 68, 0.3);
          }
        }

        @keyframes badgeShimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 900;
          color: var(--primary-text);
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, var(--blue-light), var(--teal-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--secondary-text);
          margin: 0 0 2.5rem 0;
          line-height: 1.4;
          font-weight: 500;
        }

        .hero-features {
          margin-bottom: 2.5rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 1.125rem;
          color: var(--primary-text);
          font-weight: 500;
        }

        .feature-dot {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--teal-accent), var(--blue-accent));
          color: white;
          border-radius: 50%;
          font-size: 1.125rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(76, 61, 255, 0.2);
        }

        .hero-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, var(--blue-light), var(--blue-accent));
          color: white;
          border: none;
          border-radius: 1.25rem;
          padding: 1.25rem 2.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 12px 32px rgba(76, 61, 255, 0.3);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.5px;
        }

        .hero-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .hero-btn:hover::before {
          left: 100%;
        }

        .hero-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(76, 61, 255, 0.4);
        }

        .hero-btn svg {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.2s ease;
        }

        .hero-btn:hover svg {
          transform: translateX(4px);
        }

        /* Pass Preview */
        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: -0.75cm;
          margin-top: 1.3cm;
        }

        .pass-preview {
          position: relative;
          perspective: 1000px;
        }

        .pass-card {
          width: 350px;
          height: 225px;
          background: linear-gradient(135deg, var(--card-bg), var(--surface));
          border: 2px solid var(--card-border);
          border-radius: 1.25rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px rgba(76, 61, 255, 0.15);
          animation: cardFloat 8s infinite ease-in-out;
          position: relative;
          overflow: hidden;
          transform: scale(1.25);
          perspective: 1000px;
        }

        .pass-card-inner {
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
          position: relative;
        }

        .pass-card.auto-flip .pass-card-inner {
          transform: rotateY(180deg);
        }

        .pass-card-front,
        .pass-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          top: 0;
          left: 0;
          border-radius: 1.25rem;
          overflow: hidden;
          box-sizing: border-box;
        }

        .pass-card-front {
          background: linear-gradient(135deg, var(--card-bg), var(--surface));
          padding: 1.875rem;
        }

        .pass-card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #ef4444, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: none;
          padding: 0;
          margin: 0;
        }

        .pass-card-back::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
          border-radius: 1.25rem;
          pointer-events: none;
        }

        .advx-content {
          text-align: center;
          color: white;
          position: relative;
          z-index: 2;
          width: 100%;
        }

        .advx-icon {
          margin-bottom: 1rem;
        }

        .advx-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .advx-subtitle {
          font-size: 1rem;
          opacity: 0.9;
        }

        .pass-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .pass-logo {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--blue-light), var(--teal-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pass-status {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--teal-accent);
          background: var(--surface-muted);
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          border: 1px solid var(--surface-border);
        }

        .pass-body {
          display: flex;
          gap: 1.25rem;
        }

        .pass-photo {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, var(--blue-light), var(--teal-accent));
          border-radius: 0.75rem;
          opacity: 0.7;
        }

        .pass-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .pass-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--primary-text);
        }

        .pass-id {
          font-size: 0.875rem;
          color: var(--secondary-text);
          font-family: monospace;
        }

        @keyframes cardFloat {
          0%, 100% {
            transform: scale(1.25) translateY(0);
          }
          50% {
            transform: scale(1.25) translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.5;
          }
        }

        /* 响应式设计 */
        @media (max-width: 1024px) {
          .inj-pass-hero {
            grid-template-columns: 1fr;
            height: auto;
            padding: 4rem 2rem;
            gap: 4rem;
          }
          
          .hero-content {
            margin-left: 0;
            margin-top: 0;
            text-align: center;
          }
          
          .hero-visual {
            margin-left: 0;
            margin-top: 0;
          }
          
          .feature-item {
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.125rem;
          }
          
          .pass-card {
            transform: scale(1);
          }
          
          .hero-btn {
            padding: 1rem 2rem;
            font-size: 1.125rem;
          }
        }
      `}</style>
    </>
  );
}