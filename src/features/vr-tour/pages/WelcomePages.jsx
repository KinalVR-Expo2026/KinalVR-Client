import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePages.css';

/* ── Roman numeral positions on the clock ── */
const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const ClockFace = ({ size = 480 }) => {
  const radius = size / 2;
  const numeralRadius = radius - 22;
  const tickOuterRadius = radius - 8;
  const tickInnerRadius = tickOuterRadius - 10;
  const tickMajorInner = tickOuterRadius - 16;

  const ticks = useMemo(() => {
    const items = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * (Math.PI / 180);
      const isMajor = i % 5 === 0;
      const inner = isMajor ? tickMajorInner : tickInnerRadius;
      items.push({
        x1: radius + Math.cos(angle) * inner,
        y1: radius + Math.sin(angle) * inner,
        x2: radius + Math.cos(angle) * tickOuterRadius,
        y2: radius + Math.sin(angle) * tickOuterRadius,
        isMajor,
        key: i,
      });
    }
    return items;
  }, [radius, tickOuterRadius, tickInnerRadius, tickMajorInner]);

  const numeralPositions = useMemo(() => {
    return NUMERALS.map((numeral, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      return {
        numeral,
        x: radius + Math.cos(angle) * numeralRadius,
        y: radius + Math.sin(angle) * numeralRadius,
      };
    });
  }, [radius, numeralRadius]);

  return (
    <div className="clock-face">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        {/* Outer circle */}
        <circle cx={radius} cy={radius} r={radius - 12} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        {/* Inner circle */}
        <circle cx={radius} cy={radius} r={radius - 40} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Tick marks */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
          />
        ))}
        {/* Numerals */}
        {numeralPositions.map((n) => (
          <text
            key={n.numeral}
            x={n.x}
            y={n.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.35)"
            fontFamily="'Cormorant Garamond', serif"
            fontSize="20"
            fontWeight="400"
            letterSpacing="1"
          >
            {n.numeral}
          </text>
        ))}
      </svg>
    </div>
  );
};

export const WelcomePages = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-space-page">
      {/* ── Background Elements ── */}
      <div className="scattered-stars" />
      
      <div className="clock-bg-container">
        <ClockFace size={480} />
      </div>

      {/* ── Top Bar ── */}
      <div className="space-top-bar">
        <button className="mode-pc-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          MODO PC
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="space-content">
        {/* Center Logo Placeholder (a geometric K) */}
        <div className="center-logo-icon">
          <svg viewBox="0 0 100 100">
            {/* Geometric starburst/badge shape */}
            <path d="M50 5 L60 25 L80 20 L75 40 L95 50 L75 60 L80 80 L60 75 L50 95 L40 75 L20 80 L25 60 L5 50 L25 40 L20 20 L40 25 Z" />
            {/* The letter K */}
            <text x="50" y="58" fontSize="30" textAnchor="middle" fill="#e0e4eb" stroke="none" fontFamily="'Cormorant Garamond', serif">K</text>
          </svg>
        </div>

        <h1 className="space-title">Kinal</h1>
        <p className="space-subtitle">Por el tiempo</p>

        {/* Orange CTA Button */}
        <button 
          className="space-cta-orange"
          onClick={() => navigate('/dashboard')}
        >
          <div className="cta-play-icon">
            <svg viewBox="0 0 12 12">
              <polygon points="4,3 9,6 4,9" />
            </svg>
          </div>
          Iniciar Experiencia
        </button>
      </div>
    </div>
  );
};
