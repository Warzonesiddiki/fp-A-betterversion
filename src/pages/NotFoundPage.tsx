import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="p-12 text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-slate-400 mb-6">Page not found.</p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}
