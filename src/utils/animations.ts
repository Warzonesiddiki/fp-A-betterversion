/**
 * Animation utilities for FinPlan Pro
 * All animations respect prefers-reduced-motion
 */

import type { CSSProperties } from 'react';

const REDUCED: CSSProperties = { transition: 'none', animation: 'none' };

export function pageTransition(reduced = false): CSSProperties {
  if (reduced) return REDUCED;
  return { transition: 'opacity 0.2s ease, transform 0.2s ease' };
}

export function fadeIn(reduced = false): CSSProperties {
  if (reduced) return REDUCED;
  return { animation: 'fadeIn 0.2s ease forwards' };
}

export function slideIn(
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  reduced = false
): CSSProperties {
  if (reduced) return REDUCED;
  const map = { left: 'slideInLeft', right: 'slideInRight', up: 'slideInUp', down: 'slideInDown' };
  return { animation: `${map[direction]} 0.2s ease forwards` };
}

export function scaleIn(reduced = false): CSSProperties {
  if (reduced) return REDUCED;
  return { animation: 'scaleIn 0.15s ease forwards' };
}

export function pulse(reduced = false): CSSProperties {
  if (reduced) return REDUCED;
  return { animation: 'pulse 1.5s ease-in-out infinite' };
}

export function staggerChildren(index: number, reduced = false): CSSProperties {
  if (reduced) return REDUCED;
  return { animation: `fadeIn 0.2s ease forwards`, animationDelay: `${index * 20}ms` };
}

export const keyframes = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideInLeft { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slideInDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;
