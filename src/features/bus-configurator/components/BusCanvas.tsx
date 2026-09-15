import React, { useRef, useState, useCallback } from 'react';
import { BusLayout } from '../types';
import { CanvasSeat } from './CanvasSeat';
import { CanvasDoor } from './CanvasDoor';
import { CanvasDriver } from './CanvasDriver';
import { SelectedElement } from '../hooks/useBusStudio';

interface BusCanvasProps {
  layout: BusLayout;
  selectedElement?: SelectedElement;
  onSelectElement?: (elem: SelectedElement) => void;
  onMoveSeat?: (id: string, x: number, y: number) => void;
  onMoveDoor?: (id: string, x: number, y: number) => void;
  onMoveDriver?: (x: number, y: number) => void;
  isInteractive?: boolean;
  isIsometric3D?: boolean;
  use3DSeats?: boolean;
  mode?: 'editor' | 'preview';
  selectedSeatIds?: string[];
  occupiedSeatIds?: string[];
  onSeatClick?: (seat: any) => void;
}

type DragState = {
  type: 'seat' | 'door' | 'driver';
  id?: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
} | null;

export const BusCanvas: React.FC<BusCanvasProps> = ({
  layout,
  selectedElement,
  onSelectElement = () => {},
  onMoveSeat = () => {},
  onMoveDoor = () => {},
  onMoveDriver = () => {},
  isInteractive = true,
  isIsometric3D = false,
  use3DSeats = false,
  mode = 'editor',
  selectedSeatIds = [],
  occupiedSeatIds = [],
  onSeatClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>(null);

  const handleSeatPointerDown = useCallback((e: React.PointerEvent, seatId: string) => {
    if (!isInteractive) return;
    const seat = layout.seats.find(s => s.id === seatId);
    if (!seat) return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onSelectElement({ type: 'seat', id: seatId });
    setDragState({
      type: 'seat',
      id: seatId,
      startX: e.clientX,
      startY: e.clientY,
      origX: seat.x,
      origY: seat.y,
    });
  }, [isInteractive, layout.seats, onSelectElement]);

  const handleDoorPointerDown = useCallback((e: React.PointerEvent, doorId: string) => {
    if (!isInteractive) return;
    const door = layout.doors.find(d => d.id === doorId);
    if (!door) return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onSelectElement({ type: 'door', id: doorId });
    setDragState({
      type: 'door',
      id: doorId,
      startX: e.clientX,
      startY: e.clientY,
      origX: door.x,
      origY: door.y,
    });
  }, [isInteractive, layout.doors, onSelectElement]);

  const handleDriverPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isInteractive) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onSelectElement({ type: 'driver' });
    setDragState({
      type: 'driver',
      startX: e.clientX,
      startY: e.clientY,
      origX: layout.driverArea.x,
      origY: layout.driverArea.y,
    });
  }, [isInteractive, layout.driverArea, onSelectElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    const newX = dragState.origX + deltaX;
    const newY = dragState.origY + deltaY;

    if (dragState.type === 'seat' && dragState.id) {
      onMoveSeat(dragState.id, newX, newY);
    } else if (dragState.type === 'door' && dragState.id) {
      onMoveDoor(dragState.id, newX, newY);
    } else if (dragState.type === 'driver') {
      onMoveDriver(newX, newY);
    }
  }, [dragState, onMoveSeat, onMoveDoor, onMoveDriver]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      setDragState(null);
    }
  }, [dragState]);

  return (
    <div 
      className="relative select-none perspective-[1600px]"
      style={{ width: layout.width, height: layout.height }}
    >
      {/* Halo d'ambiance 3D externe sous le bus */}
      <div
        className="absolute pointer-events-none rounded-[60px] opacity-45 blur-3xl"
        style={{
          width: `${layout.width + 120}px`,
          height: `${layout.height + 80}px`,
          background: 'radial-gradient(circle, rgba(255, 87, 34, 0.3) 0%, rgba(255, 160, 0, 0.1) 50%, transparent 80%)',
          transform: isIsometric3D ? 'rotateX(24deg) rotateZ(-12deg) scale(0.95)' : 'none',
          transition: 'transform 0.5s ease-out',
        }}
      />

      {/* ROUES EXTÉRIEURES DU BUS */}
      <div
        className="absolute pointer-events-none z-0 transition-transform duration-500 ease-out"
        style={{
          width: `${layout.width + 24}px`,
          height: `${layout.height}px`,
          transform: isIsometric3D ? 'rotateX(24deg) rotateZ(-12deg) scale(0.95)' : 'none',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute -left-3 top-28 w-4 h-14 bg-slate-950 rounded-l-md border-r-2 border-amber-500/60 shadow-lg flex items-center justify-center">
          <div className="w-1.5 h-8 bg-slate-700 rounded-full" />
        </div>
        <div className="absolute -right-3 top-28 w-4 h-14 bg-slate-950 rounded-r-md border-l-2 border-amber-500/60 shadow-lg flex items-center justify-center">
          <div className="w-1.5 h-8 bg-slate-700 rounded-full" />
        </div>
        <div className="absolute -left-3 bottom-24 w-4 h-20 bg-slate-950 rounded-l-md border-r-2 border-amber-500/60 shadow-lg flex items-center justify-center">
          <div className="w-1.5 h-12 bg-slate-700 rounded-full" />
        </div>
        <div className="absolute -right-3 bottom-24 w-4 h-20 bg-slate-950 rounded-r-md border-l-2 border-amber-500/60 shadow-lg flex items-center justify-center">
          <div className="w-1.5 h-12 bg-slate-700 rounded-full" />
        </div>
      </div>

      {/* CHÂSSIS 3D CUTAWAY ISOMÉTRIQUE DU BUS */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => onSelectElement(null)}
        style={{
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          background: 'radial-gradient(ellipse at center, #141923 0%, #0c0f16 70%, #07090d 100%)',
          transform: isIsometric3D
            ? 'rotateX(24deg) rotateZ(-12deg) scale(0.95)'
            : 'none',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative z-10 border-2 border-slate-700/80 rounded-[48px] shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(255,87,34,0.15)] overflow-hidden"
      >
        {/* Motif Plancher Parquet Sombre Noble */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="luxuryParquet"
              width="60"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <rect width="60" height="12" fill="#1A202C" stroke="#0F141C" strokeWidth="0.8" />
              <rect y="12" width="60" height="12" fill="#141923" stroke="#0F141C" strokeWidth="0.8" />
              <line x1="30" y1="0" x2="30" y2="12" stroke="#0B0D13" strokeWidth="0.8" />
              <line x1="15" y1="12" x2="15" y2="24" stroke="#0B0D13" strokeWidth="0.8" />
              <line x1="45" y1="12" x2="45" y2="24" stroke="#0B0D13" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#luxuryParquet)" />
        </svg>

        {/* ALLÉE CENTRALE : LIGNES NÉON AMBRE RAYTRACÉES (#FF5722 / #FFA000) */}
        <div
          className="absolute pointer-events-none top-24 bottom-16 left-1/2 -translate-x-1/2 w-14 flex justify-between px-1"
        >
          <div className="w-[2px] h-full bg-gradient-to-b from-amber-400 via-orange-500 to-amber-400 shadow-[0_0_15px_rgba(255,160,0,0.9),0_0_25px_rgba(255,87,34,0.6)] opacity-90" />
          <div className="flex-1 bg-gradient-to-b from-orange-500/[0.05] via-amber-500/[0.08] to-orange-500/[0.05]" />
          <div className="w-[2px] h-full bg-gradient-to-b from-amber-400 via-orange-500 to-amber-400 shadow-[0_0_15px_rgba(255,160,0,0.9),0_0_25px_rgba(255,87,34,0.6)] opacity-90" />
        </div>

        {/* PARE-BRISE AVANT AÉRODYNAMIQUE */}
        <div className="absolute top-0 left-6 right-6 h-12 border-b border-sky-400/30 bg-gradient-to-b from-sky-950/40 via-slate-900/40 to-transparent rounded-b-3xl pointer-events-none flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute -top-10 -left-10 w-48 h-24 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 pointer-events-none" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-400/80 drop-shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Cockpit 3D Avant
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          </div>
        </div>

        {/* RÉTROVISEURS EXTÉRIEURS */}
        <div className="absolute -left-1 top-8 w-2.5 h-8 bg-black rounded-l-lg border-r border-amber-500 shadow-[0_0_10px_rgba(255,160,0,0.6)] pointer-events-none" />
        <div className="absolute -right-1 top-8 w-2.5 h-8 bg-black rounded-r-lg border-l border-amber-500 shadow-[0_0_10px_rgba(255,160,0,0.6)] pointer-events-none" />

        {/* POSTE CHAUFFEUR AVEC IMAGE 3D RÉALISTE */}
        <CanvasDriver
          driver={layout.driverArea}
          onPointerDown={handleDriverPointerDown}
          isInteractive={isInteractive}
          is3DMode={isIsometric3D}
        />

        {/* PORTES D'ACCÈS ILLUMINÉES */}
        {layout.doors.map((door) => (
          <CanvasDoor
            key={door.id}
            door={door}
            isSelected={selectedElement?.type === 'door' && selectedElement.id === door.id}
            onSelect={() => onSelectElement({ type: 'door', id: door.id })}
            onPointerDown={handleDoorPointerDown}
            isInteractive={isInteractive}
          />
        ))}

        {/* SIÈGES FAUTEUILS CUIR 3D */}
        {layout.seats.map((seat) => {
          const isSeatSelected = mode === 'preview'
            ? selectedSeatIds.includes(seat.id)
            : selectedElement?.type === 'seat' && selectedElement.id === seat.id;
            
          const isOccupied = mode === 'preview' ? occupiedSeatIds.includes(seat.id) : false;
          const displaySeat = isOccupied ? { ...seat, status: 'occupied' as const } : seat;

          return (
            <CanvasSeat
              key={seat.id}
              seat={displaySeat}
              isSelected={isSeatSelected}
              onSelect={(e) => {
                if (mode === 'preview' && onSeatClick) {
                  onSeatClick(seat);
                } else if (onSelectElement) {
                  onSelectElement({ type: 'seat', id: seat.id });
                }
              }}
              onPointerDown={(e, id) => {
                if (mode !== 'preview') handleSeatPointerDown(e, id);
              }}
              isInteractive={isInteractive && (!isOccupied || mode !== 'preview')}
              use3DTexture={use3DSeats}
            />
          );
        })}

        {/* FEUX ARRIÈRE NÉON */}
        <div className="absolute bottom-0 left-6 right-6 h-6 border-t border-red-500/40 bg-gradient-to-t from-red-950/40 to-transparent rounded-t-xl pointer-events-none flex items-center justify-between px-5">
          <div className="w-6 h-2 bg-red-600 rounded-sm shadow-[0_0_12px_rgba(239,68,68,1)]" />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
            Arrière du Bus
          </span>
          <div className="w-6 h-2 bg-red-600 rounded-sm shadow-[0_0_12px_rgba(239,68,68,1)]" />
        </div>
      </div>
    </div>
  );
};
