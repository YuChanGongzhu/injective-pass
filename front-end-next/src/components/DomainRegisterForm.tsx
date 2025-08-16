"use client";
import { useState } from 'react';
import { NfcApi } from '@/lib/api';

interface DomainRegisterFormProps {
    onSuccess?: (domain: string) => void;
    className?: string;
}

export default function DomainRegisterForm({ onSuccess, className = '' }: DomainRegisterFormProps) {
    const [uid, setUid] = useState('');
    const [prefix, setPrefix] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const res = await NfcApi.domainRegister({ uid, domainPrefix: prefix });
            setMsg({ text: `注册成功: ${res.domain}`, type: 'success' });
            
            // 如果提供了成功回调，则调用它
            if (onSuccess) {
                onSuccess(res.domain);
            }
            
            // 清空表单
            setUid('');
            setPrefix('');
        } catch (err: any) {
            setMsg({ text: err?.message || '注册失败', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className={`space-y-4 ${className}`}>
            <div>
                <label className="block text-sm text-white/80 mb-1">NFC UID</label>
                <input 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                    value={uid} 
                    onChange={(e) => setUid(e.target.value)} 
                    placeholder="04:aa:bb:..." 
                    required 
                />
            </div>
            <div>
                <label className="block text-sm text-white/80 mb-1">域名前缀</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <span className="px-2 py-2 bg-white/10 text-white/70 text-sm">advx-</span>
                    <input 
                        className="flex-1 bg-transparent border-none px-3 py-2 text-white placeholder-white/30 focus:outline-none" 
                        value={prefix} 
                        onChange={(e) => setPrefix(e.target.value)} 
                        placeholder="alice" 
                        required 
                    />
                    <span className="px-2 py-2 bg-white/10 text-white/70 text-sm">.inj</span>
                </div>
            </div>
            <button 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? '注册中...' : '注册域名'}
            </button>
            
            {msg && (
                <div className={`text-sm p-2 rounded ${msg.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {msg.text}
                </div>
            )}
        </form>
    );
}
