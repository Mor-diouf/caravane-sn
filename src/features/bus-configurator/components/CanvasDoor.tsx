import React from 'react';
import { BusDoor } from '../types';
import { LogIn } from 'lucide-react';

interface CanvasDoorProps {
  door: BusDoor;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent | React.PointerEvent) => void;
  onPointerDown: (e: React.PointerEvent, doorId: string) => void;
  isInteractive?: boolean;
}

export const CanvasDoor: React.FC<CanvasDoorProps> = ({
  door,
  isSelected,
  onSelect,
  onPointerDown,
  isInteractive = true,
}) => {
  const isRightSide = door.side === 'right' || door.x > 200;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${door.x}px`,
        top: `${door.y}px`,
        width: `${door.width}px`,
        height: `${door.height}px`,
        touchAction: 'none',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onPointerDown={(e) => {
        if (!isInteractive) return;
        onPointerDown(e, door.id);
      }}
      className={`select-none flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
        isSelected ? 'z-30 scale-105' : 'z-20'
      }`}
      title={`${door.label || 'Porte d’accès'} (Glisser pour déplacer)`}
    >
      <div className="relative w-full h-full flex flex-col justify-between p-1 rounded-xl bg-gradient-to-b from-amber-950/70 via-slate-900/90 to-black border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Halo de lumière ambrée projeté sur le sol extérieur */}
        <div
          className={`absolute pointer-events-none top-0 bottom-0 w-8 bg-gradient-to-r ${
            isRightSide
              ? 'left-full from-amber-500/30 to-transparent'
              : 'right-full from-transparent to-amber-500/30'
          } blur-sm`}
        />

        {/* Marches d'escalier illuminées (Step-well) */}
        <div className="flex flex-col gap-1 w-full my-auto">
          {/* Marche 1 */}
          <div className="h-1.5 w-full rounded-sm bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          {/* Marche 2 */}
          <div className="h-1.5 w-[85%] mx-auto rounded-sm bg-gradient-to-r from-amber-600/50 via-amber-400/80 to-amber-600/50 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
          {/* Marche 3 */}
          <div className="h-1.5 w-[70%] mx-auto rounded-sm bg-amber-700/40 border-b border-amber-400/50" />
        </div>

        {/* Libellé et icône de la porte */}
        <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
          <LogIn className="w-2.5 h-2.5 text-amber-400" />
          <span className="truncate max-w-[40px]">{door.label || 'Porte'}</span>
        </div>

        {/* Liseré néon inférieur du seuil */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_6px_rgba(251,191,36,1)]" />
      </div>
    </div>
  );
};
