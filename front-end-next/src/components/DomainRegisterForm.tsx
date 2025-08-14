"use client";
import { useState } from 'react';
import { NfcApi } from '@/lib/api';

export default function DomainRegisterForm() {
    const [uid, setUid] = useState('');
    const [prefix, setPrefix] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const res = await NfcApi.domainRegister({ uid, domainPrefix: prefix });
            setMsg(`注册成功: ${res.domain}`);
        } catch (err: any) {
            setMsg(err?.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div>
                <label className="block text-sm">NFC UID</label>
                <input className="border rounded px-2 py-1 w-full" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="04:aa:bb:..." required />
            </div>
            <div>
                <label className="block text-sm">域名前缀（系统会生成 advx-）</label>
                <input className="border rounded px-2 py-1 w-full" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="alice" required />
            </div>
            <button disabled={loading} className="bg-black text-white px-3 py-1 rounded disabled:opacity-60">{loading ? '注册中...' : '注册域名'}</button>
            {msg && <p className="text-sm">{msg}</p>}
        </form>
    );
}
