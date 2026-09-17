import React from 'react';
import { BusSeat } from '../types';
import { Crown, Accessibility } from 'lucide-react';

interface CanvasSeatProps {
  seat: BusSeat;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent | React.PointerEvent) => void;
  onPointerDown: (e: React.PointerEvent, seatId: string) => void;
  isInteractive?: boolean;
  use3DTexture?: boolean;
}

export const CanvasSeat: React.FC<CanvasSeatProps> = ({
  seat,
  isSelected,
  onSelect,
  onPointerDown,
  isInteractive = true,
}) => {
  const isVip = seat.category === 'vip';
  const isBooked = seat.status === 'reserved' || seat.status === 'occupied';

  const primaryLeather = isSelected
    ? '#FF5722'
    : isBooked
    ? '#10B981'
    : isVip
    ? '#2D1B4E'
    : '#121620';

  const accentBorder = isSelected
    ? '#FFA000'
    : isBooked
    ? '#34D399'
    : isVip
    ? '#A855F7'
    : '#334155';

  const stitchColor = isSelected ? '#FFE082' : isBooked ? '#A7F3D0' : isVip ? '#D8B4FE' : '#475569';
  const headrestFill = isSelected ? '#D84315' : isBooked ? '#059669' : isVip ? '#1E1135' : '#0B0E14';
  const textColor = isSelected ? '#FFFFFF' : isBooked ? '#ECFDF5' : '#F8FAFC';

  return (
    <div
      style={{
        position: 'absolute',
        left: `${seat.x}px`,
        top: `${seat.y}px`,
        width: `${seat.width}px`,
        height: `${seat.height}px`,
        touchAction: 'none',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onPointerDown={(e) => {
        if (!isInteractive) return;
        onPointerDown(e, seat.id);
      }}
      className={`group select-none flex items-center justify-center transition-transform duration-150 ${
        isInteractive ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
      } ${isSelected ? 'z-30' : 'z-10'} ${isBooked ? 'opacity-80' : ''}`}
      title={`Siège ${seat.number} (${seat.category}) - Orienté vers le chauffeur`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Ombre portée 2.5D au sol */}
        <div
          className={`absolute inset-x-1 bottom-0 h-4 rounded-full blur-[3px] transition-opacity ${
            isSelected
              ? 'bg-amber-500/50 opacity-100 blur-[6px]'
              : 'bg-black/80 opacity-70'
          }`}
        />

        {/* 
          SIÈGE EXÉCUTIF ORIENTÉ VERS L'AVANT (VERS LE CHAUFFEUR / NORD) :
          - Coussin d'assise & genoux en HAUT (y: 6..42) -> tournés vers le pare-brise / chauffeur
          - Dossier & Appuie-tête en BAS (y: 47..60) -> vers l'arrière du bus
          - Accoudoirs sur les côtés gauche et droit
        */}
        <svg
          viewBox="0 0 54 62"
          className={`w-full h-full filter ${
            isSelected
              ? 'drop-shadow-[0_0_14px_rgba(255,87,34,0.7)]'
              : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]'
          }`}
        >
          <defs>
            <linearGradient id={`leatherGrad-${seat.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              {/* Le haut du coussin (face au chauffeur) reçoit plus de lumière */}
              <stop offset="0%" stopColor={isSelected ? '#FF7043' : isVip ? '#3E2468' : '#1A202C'} />
              <stop offset="100%" stopColor={primaryLeather} />
            </linearGradient>

            <linearGradient id={`headrestGrad-${seat.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1A202C" />
              <stop offset="100%" stopColor={headrestFill} />
            </linearGradient>
          </defs>

          {/* Accoudoirs latéraux (Gauche & Droite) */}
          <rect
            x="2"
            y="14"
            width="4.5"
            height="28"
            rx="2.2"
            fill="#0B0D12"
            stroke={accentBorder}
            strokeWidth="0.8"
          />
          <rect
            x="47.5"
            y="14"
            width="4.5"
            height="28"
            rx="2.2"
            fill="#0B0D12"
            stroke={accentBorder}
            strokeWidth="0.8"
          />

          {/* Coussin d'assise principal (Orienté vers l'avant / Haut) */}
          <rect
            x="5.5"
            y="6"
            width="43"
            height="42"
            rx="8"
            fill={`url(#leatherGrad-${seat.id})`}
            stroke={accentBorder}
            strokeWidth={isSelected ? '2' : '1.2'}
          />

          {/* Bord avant de l'assise (Genoux du passager tournés vers le chauffeur) */}
          <path
            d="M 9,8 Q 27,5 45,8"
            fill="none"
            stroke={isSelected ? '#FFE082' : '#FF5722'}
            strokeWidth="1.8"
            opacity="0.85"
            strokeLinecap="round"
          />

          {/* Lignes de capitonnage / surpiqûres nobles */}
          <line
            x1="12"
            y1="16"
            x2="42"
            y2="16"
            stroke={stitchColor}
            strokeWidth="0.9"
            strokeDasharray="2,2"
            opacity="0.6"
          />
          <line
            x1="12"
            y1="26"
            x2="42"
            y2="26"
            stroke={stitchColor}
            strokeWidth="0.9"
            strokeDasharray="2,2"
            opacity="0.6"
          />
          <line
            x1="12"
            y1="36"
            x2="42"
            y2="36"
            stroke={stitchColor}
            strokeWidth="0.9"
            strokeDasharray="2,2"
            opacity="0.6"
          />

          {/* Renforts latéraux baquet */}
          <path
            d="M 10,12 Q 13,26 10,40"
            fill="none"
            stroke={stitchColor}
            strokeWidth="0.8"
            opacity="0.5"
          />
          <path
            d="M 44,12 Q 41,26 44,40"
            fill="none"
            stroke={stitchColor}
            strokeWidth="0.8"
            opacity="0.5"
          />

          {/* 
            Dossier & Appuie-tête distinct placé en BAS (vers l'arrière du bus) 
            => Ainsi le passager assis regarde bien vers le HAUT (vers le chauffeur)
          */}
          <rect
            x="12"
            y="46"
            width="30"
            height="14"
            rx="5"
            fill={`url(#headrestGrad-${seat.id})`}
            stroke={accentBorder}
            strokeWidth={isSelected ? '1.8' : '1.2'}
          />

          {/* Liseré orange sur l'appuie-tête */}
          <line
            x1="16"
            y1="53"
            x2="38"
            y2="53"
            stroke={isSelected ? '#FFE082' : '#FF5722'}
            strokeWidth="1.2"
            opacity={isSelected ? '0.9' : '0.6'}
          />
        </svg>

        {/* Numéro central du siège gravé bien droit et ultra lisible */}
        <div className="absolute top-[14px] inset-x-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            style={{ color: textColor }}
            className={`font-black tracking-normal select-none transition-transform ${
              isSelected
                ? 'text-[15px] scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-white'
                : isBooked
                ? 'text-[11px] opacity-40 text-slate-400'
                : 'text-[13.5px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] text-white'
            }`}
          >
            {seat.number}
          </span>

          {/* Mini-badges discrets */}
          {isVip && (
            <Crown className="w-2.5 h-2.5 text-amber-300 -mt-0.5 drop-shadow" />
          )}
          {seat.category === 'disabled' && (
            <Accessibility className="w-2.5 h-2.5 text-cyan-300 -mt-0.5 drop-shadow" />
          )}
        </div>
      </div>
    </div>
  );
};
