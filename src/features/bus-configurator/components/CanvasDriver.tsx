import React from 'react';
import { BusDriver } from '../types';
import { ArrowUp } from 'lucide-react';

interface CanvasDriverProps {
  driver: BusDriver;
  onPointerDown: (e: React.PointerEvent) => void;
  isInteractive?: boolean;
  is3DMode?: boolean;
}

export const CanvasDriver: React.FC<CanvasDriverProps> = ({
  driver,
  onPointerDown,
  isInteractive = true,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${driver.x}px`,
        top: `${driver.y}px`,
        width: `${driver.width}px`,
        height: `${driver.height}px`,
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        if (!isInteractive) return;
        onPointerDown(e);
      }}
      className="select-none flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-20 group transition-transform hover:scale-[1.03]"
      title="Poste Chauffeur (Orienté vers l'avant / Pare-brise) - Glisser pour déplacer"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Ombre portée 2.5D au sol */}
        <div className="absolute inset-x-2 bottom-0 h-5 bg-black/80 rounded-full blur-[5px]" />

        {/* 
          COCKPIT & CHAUFFEUR STRICTEMENT ORIENTÉ VERS L'AVANT (VERS LE HAUT / NORD) :
          - En haut (y: 6..24) : Tableau de bord incurvé avec compteurs rétroéclairés ambrés & pare-brise
          - Au milieu (y: 30..48) : Volant gainé de cuir tenu par les mains du chauffeur
          - En bas (y: 50..82) : Chauffeur en uniforme assis, casquette avec visière pointant vers l'avant (Haut)
        */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="dashBoardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B0E14" />
            </linearGradient>

            <linearGradient id="driverSuitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A374A" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="capGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#090C12" />
            </linearGradient>

            <filter id="amberGlowCockpit" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Tableau de bord incurvé AVANT (face à la route / haut) */}
          <path
            d="M 10,22 Q 50,10 90,22 L 84,33 Q 50,24 16,33 Z"
            fill="url(#dashBoardGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />

          {/* Écran GPS / Compteurs rétroéclairés Ambre (pointés vers l'avant) */}
          <rect x="22" y="18" width="14" height="7" rx="1.5" fill="#0A0D14" stroke="#FF5722" strokeWidth="0.8" />
          <line x1="25" y1="21" x2="33" y2="21" stroke="#FFA000" strokeWidth="1.2" filter="url(#amberGlowCockpit)" />
          
          <rect x="64" y="18" width="14" height="7" rx="1.5" fill="#0A0D14" stroke="#FF5722" strokeWidth="0.8" />
          <line x1="67" y1="21" x2="75" y2="21" stroke="#FFA000" strokeWidth="1.2" filter="url(#amberGlowCockpit)" />

          {/* Voyant LED central d'horizon artificiel */}
          <circle cx="50" cy="18" r="2" fill="#22C55E" className="animate-pulse" />

          {/* 2. Volant de direction gainé de cuir en position de conduite vers l'avant */}
          <circle cx="50" cy="38" r="13.5" fill="#07090E" stroke="#64748B" strokeWidth="3" />
          
          {/* Liseré orange d'axe central (repère de cap vers l'avant) */}
          <line x1="50" y1="24.5" x2="50" y2="28" stroke="#FF5722" strokeWidth="2.8" strokeLinecap="round" />

          {/* Branches du volant */}
          <line x1="50" y1="26" x2="50" y2="50" stroke="#475569" strokeWidth="1.6" />
          <line x1="38" y1="38" x2="62" y2="38" stroke="#475569" strokeWidth="1.6" />
          <circle cx="50" cy="38" r="4.5" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <circle cx="50" cy="38" r="1.5" fill="#FFA000" />

          {/* 3. Mains du chauffeur posées sur le volant à 9h15 */}
          <ellipse cx="36.5" cy="38" rx="3" ry="2.2" fill="#D97706" />
          <ellipse cx="63.5" cy="38" rx="3" ry="2.2" fill="#D97706" />

          {/* 4. Siège du chauffeur (dossier en bas) */}
          <rect x="25" y="48" width="50" height="42" rx="8" fill="#0A0D14" stroke="#334155" strokeWidth="1" />

          {/* 5. Chauffeur vu de dessus (orienté strictement vers le haut / pare-brise) */}
          {/* Épaules en veste d'uniforme */}
          <ellipse
            cx="50"
            cy="68"
            rx="22"
            ry="12"
            fill="url(#driverSuitGrad)"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Épaulettes d'officier dorées */}
          <rect x="29" y="64" width="6" height="3" rx="1" fill="#FFA000" />
          <rect x="65" y="64" width="6" height="3" rx="1" fill="#FFA000" />

          {/* Casquette d'officier de service vue de dessus */}
          <ellipse
            cx="50"
            cy="64"
            rx="9.5"
            ry="8.5"
            fill="url(#capGrad)"
            stroke="#FF5722"
            strokeWidth="1.2"
          />

          {/* Visière de casquette pointant vers l'AVANT (vers le haut) */}
          <path
            d="M 43,58 Q 50,53 57,58"
            stroke="#FF5722"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Insigne doré d'officier sur la casquette */}
          <circle cx="50" cy="58" r="1.5" fill="#FFA000" />
        </svg>

        {/* Indicateur de cap vers l'avant */}
        <div className="absolute -bottom-2.5 bg-slate-950/95 border border-amber-500/80 px-2.5 py-0.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1">
          <ArrowUp className="w-2.5 h-2.5 text-amber-400 stroke-[3]" />
          <span className="text-[8px] font-black text-amber-300 uppercase tracking-widest">
            Chauffeur (Avant)
          </span>
        </div>
      </div>
    </div>
  );
};
