'use client';

import Webhook from '@/components/Webhook';
import { motion } from 'framer-motion';

export default function WebhookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Webhook Manager
          </h1>
          <p className="text-white/70 text-lg">
            Configure e teste a integração com n8n de forma simples e rápida
          </p>
        </motion.div>
        <Webhook />
      </div>
    </div>
  );
}
