import React, { useState } from 'react';
import { BusDoor, BusSeat, SeatCategory } from '../types';
import { SelectedElement } from '../hooks/useBusStudio';
import { Trash2, Bus, Hash, Tag, DollarSign, X, Users, Sliders, ChevronDown, Check } from 'lucide-react';
import { BUS_PRESETS } from '../presets';

interface PropertiesPanelProps {
  selectedElement: SelectedElement;
  selectedSeat: BusSeat | null;
  selectedDoor: BusDoor | null;
  onUpdateSeat: (id: string, updates: Partial<BusSeat>) => void;
  onDeleteSeat: (id: string) => void;
  onDeleteDoor: (id: string) => void;
  onClose: () => void;
  busName: string;
  onUpdateBusName: (name: string) => void;
  busWidth: number;
  busHeight: number;
  onUpdateDimensions: (w: number, h: number) => void;
  totalSeats: number;
  totalDoors?: number;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  selectedSeat,
  selectedDoor,
  onUpdateSeat,
  onDeleteSeat,
  onDeleteDoor,
  onClose,
  busName,
  onUpdateBusName,
  busWidth,
  busHeight,
  onUpdateDimensions,
  totalSeats,
  totalDoors = 2,
}) => {
  // Toggles visuels d'éléments
  const [toggleSeats, setToggleSeats] = useState(true);
  const [toggleDoors, setToggleDoors] = useState(true);
  const [toggleRows, setToggleRows] = useState(true);

  // Valeurs de dimensions représentées en mètres
  const longueurM = ((busHeight / 60) * 0.9).toFixed(2);
  const largeurM = ((busWidth / 140) * 0.95).toFixed(2);
  const hauteurM = '3.20';

  return (
    <aside className="w-full max-w-[340px] shrink-0 rounded-3xl bg-[#111722]/85 backdrop-blur-2xl border border-slate-800/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col gap-5 text-slate-100 select-none overflow-y-auto custom-scrollbar">
      {/* En-tête du panneau */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Bus className="size-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-white">
              {selectedSeat
                ? `Siège N° ${selectedSeat.number}`
                : selectedDoor
                ? `Porte d'Accès`
                : 'Propriétés du Bus'}
            </h3>
            <span className="text-[10px] text-slate-400 block font-medium">
              Paramètres du châssis
            </span>
          </div>
        </div>

        {selectedElement && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* VUE 1 : SIÈGE SÉLECTIONNÉ */}
      {selectedSeat ? (
        <div className="flex flex-col gap-4 text-xs">
          {/* Numéro du siège */}
          <div>
            <label className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <Hash className="size-3.5 text-amber-400" /> Numéro de place
            </label>
            <input
              type="text"
              value={selectedSeat.number}
              onChange={(e) =>
                onUpdateSeat(selectedSeat.id, { number: e.target.value })
              }
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-black text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type d'emplacement */}
          <div>
            <label className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <Tag className="size-3.5 text-cyan-400" /> Type d'emplacement
            </label>
            <select
              value={selectedSeat.category}
              onChange={(e) =>
                onUpdateSeat(selectedSeat.id, {
                  category: e.target.value as SeatCategory,
                })
              }
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="standard">Standard Cuir</option>
              <option value="window">Côté Fenêtre</option>
              <option value="aisle">Côté Couloir</option>
              <option value="vip">VIP Capitonnage Or</option>
              <option value="disabled">PMR (Mobilité réduite)</option>
            </select>
          </div>

          {/* Tarif personnalisé */}
          <div>
            <label className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-emerald-400" /> Tarif spécifique (FCFA)
            </label>
            <input
              type="number"
              placeholder="Prix par défaut"
              value={selectedSeat.price || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                onUpdateSeat(selectedSeat.id, { price: val as any });
              }}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Coordonnées 2.5D */}
          <div className="bg-[#0b0e14]/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Axe X : <strong className="text-slate-200">{selectedSeat.x} px</strong></span>
            <span>Axe Y : <strong className="text-slate-200">{selectedSeat.y} px</strong></span>
          </div>

          {/* Supprimer le siège */}
          <button
            type="button"
            onClick={() => onDeleteSeat(selectedSeat.id)}
            className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold transition-all cursor-pointer"
          >
            <Trash2 className="size-4" />
            <span>Supprimer ce siège</span>
          </button>
        </div>
      ) : selectedDoor ? (
        /* VUE 2 : PORTE SÉLECTIONNÉE */
        <div className="flex flex-col gap-4 text-xs">
          <div>
            <label className="text-slate-400 font-medium mb-1.5 block">
              Nom de la porte
            </label>
            <input
              type="text"
              value={selectedDoor.label}
              onChange={(e) => {}}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => onDeleteDoor(selectedDoor.id)}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold cursor-pointer"
          >
            <Trash2 className="size-4" />
            <span>Supprimer cette porte</span>
          </button>
        </div>
      ) : (
        /* VUE 3 : PROPRIÉTÉS GLOBALES DU BUS (MATCHING THE 3D DESIGN EXACTLY) */
        <div className="flex flex-col gap-5 text-xs">
          {/* Sélecteur de Modèle Style Carte avec Icône de Bus */}
          <div className="relative">
            <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#0b0e14] border border-slate-700/80 rounded-2xl cursor-pointer hover:border-amber-500/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600">
                  <Bus className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-extrabold text-white text-xs truncate max-w-[170px]">
                  {busName || 'Tata VIP 50 places'}
                </span>
              <ChevronDown className="size-4 text-slate-400" />
            </div>
          </div>

          {/* Section Dimensions du Bus avec Sliders Orange Vif */}
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Sliders className="size-3.5 text-amber-400" />
              <span>Dimensions du bus</span>
            </div>

            {/* Longueur */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">⟷ Longueur</span>
                <span className="font-mono text-white font-bold">{longueurM} m</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={480}
                  max={1200}
                  step={20}
                  value={busHeight}
                  onChange={(e) =>
                    onUpdateDimensions(busWidth, parseInt(e.target.value, 10))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            {/* Largeur */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">⟷ Largeur</span>
                <span className="font-mono text-white font-bold">{largeurM} m</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={320}
                  max={520}
                  step={10}
                  value={busWidth}
                  onChange={(e) =>
                    onUpdateDimensions(parseInt(e.target.value, 10), busHeight)
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            {/* Hauteur */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">↕ Hauteur</span>
                <span className="font-mono text-white font-bold">{hauteurM} m</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={1}
                  max={10}
                  defaultValue={6}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section Éléments du Bus avec Switchers Toggles Orange */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">
              Éléments du bus
            </span>

            {/* Sièges Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="size-2 rounded-full bg-amber-400" />
                <span>Sièges</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-300">{totalSeats}</span>
                <button
                  type="button"
                  onClick={() => setToggleSeats(!toggleSeats)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    toggleSeats ? 'bg-orange-500 shadow-[0_0_10px_rgba(255,87,34,0.6)]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`size-4 rounded-full bg-white transition-transform ${
                      toggleSeats ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Portes Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="size-2 rounded-full bg-emerald-400" />
                <span>Portes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-300">{totalDoors}</span>
                <button
                  type="button"
                  onClick={() => setToggleDoors(!toggleDoors)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    toggleDoors ? 'bg-orange-500 shadow-[0_0_10px_rgba(255,87,34,0.6)]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`size-4 rounded-full bg-white transition-transform ${
                      toggleDoors ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Rangées Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="size-2 rounded-full bg-cyan-400" />
                <span>Rangées</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-300">
                  {Math.ceil(totalSeats / 4)}
                </span>
                <button
                  type="button"
                  onClick={() => setToggleRows(!toggleRows)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    toggleRows ? 'bg-orange-500 shadow-[0_0_10px_rgba(255,87,34,0.6)]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`size-4 rounded-full bg-white transition-transform ${
                      toggleRows ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Carte Signature Présentation en bas (comme l'image conceptuelle) */}
          <div className="mt-1 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border border-orange-500/30 flex items-center gap-3 shadow-lg">
            <div className="size-11 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,87,34,0.3)]">
              <Bus className="size-6 text-orange-400" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-white truncate block">
                {busName || 'Tata VIP 50 places'}
              </span>
              <span className="text-[10px] text-amber-300/80 font-medium block">
                Confort • Sécurité • Élégance
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
