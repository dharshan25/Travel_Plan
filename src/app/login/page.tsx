'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Anchor, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to home
      window.location.href = '/';
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#FAF7F2]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#BF7B4A]/5 via-transparent to-[#2A9E8F]/5" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#BF7B4A]/8 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[#2A9E8F]/8 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-border/60 shadow-warm-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BF7B4A] to-[#D4896A] flex items-center justify-center mx-auto mb-4 shadow-warm"
            >
              <Anchor className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Straw Hats Crew</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the password to board the ship</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Crew Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="pl-10 pr-10 h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-white transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2 text-center"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={!password || loading}
              className="w-full h-12 rounded-xl text-sm font-semibold gap-2 shadow-warm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Board the Ship
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground/60 mt-6">
            To the Grand Line and beyond!
          </p>
        </div>
      </motion.div>
    </div>
  );
}