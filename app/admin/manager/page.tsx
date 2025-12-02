"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaBroom } from 'react-icons/fa';

const INSTANCES = [
  {
    name: 'ubva_premium',
    status: 'Connected',
    client: 'ubva_premium',
    version: '2.2.3',
  },
];

export default function ManagerPage() {
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showTypebotModal, setShowTypebotModal] = useState(false);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'} p-0`}>
      <header className="flex items-center justify-between px-8 py-6 border-b border-border bg-primary/5">
        <div className="flex items-center gap-4">
          <img src="/logo.png?v=2" alt="Logo UBVA" className="w-20 h-20 rounded-full" />
          <span className="text-3xl font-bold tracking-tight">UBVA Manager</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="bg-primary text-white px-4 py-2 rounded font-bold">Toggle theme</Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 flex gap-4">
          <Button className="bg-primary text-white px-6 py-3 rounded font-bold" onClick={() => setShowWebhookModal(true)}>
            Webhook Events
          </Button>
          <Button className="bg-secondary text-secondary-foreground px-6 py-3 rounded font-bold" onClick={() => setShowTypebotModal(true)}>
            Typebot Integration
          </Button>
        </div>
        {showWebhookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-muted-foreground hover:text-primary text-xl font-bold"
                onClick={() => setShowWebhookModal(false)}
                title="Fechar"
              >
                &times;
              </button>
              <iframe
                src="/admin/webhook-panel"
                className="w-full h-[80vh] rounded-xl border-none"
                style={{ background: 'transparent' }}
                title="Webhook Panel"
              />
            </div>
          </div>
        )}
        {showTypebotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-3xl w-full relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-muted-foreground hover:text-primary text-xl font-bold"
                onClick={() => setShowTypebotModal(false)}
                title="Fechar"
              >
                &times;
              </button>
              <iframe
                src="/admin/typebot"
                className="w-full h-[80vh] rounded-xl border-none"
                style={{ background: 'transparent' }}
                title="Typebot Panel"
              />
            </div>
          </div>
        )}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Instances</h2>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full mb-4"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search instance..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSTANCES.filter(i => i.name.includes(search)).map(instance => (
              <div key={instance.name} className="border rounded-lg p-4 bg-muted/50 flex flex-col gap-2 shadow">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{instance.name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${instance.status === 'Connected' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{instance.status}</span>
                  <Button className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">Disconnect</Button>
                </div>
                <div className="text-sm">Client name: {instance.client}</div>
                <div className="text-sm">Version: {instance.version}</div>
                <div className="flex gap-2 mt-2">
                  <a href="https://discord.com" target="_blank" rel="noopener" className="underline text-primary">Discord</a>
                  <a href="https://postman.com" target="_blank" rel="noopener" className="underline text-primary">Postman</a>
                  <a href="https://github.com" target="_blank" rel="noopener" className="underline text-primary">GitHub</a>
                  <a href="https://docs.ubva.com" target="_blank" rel="noopener" className="underline text-primary">Docs</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
