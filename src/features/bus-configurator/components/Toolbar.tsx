import React from 'react';
import { Plus, Save, Crown, Hash, BookmarkPlus } from 'lucide-react';
import { BUS_PRESETS } from '../presets';
import { BusPreset, SavedBusTemplate } from '../types';

interface ToolbarProps {
  onAddSeat: () => void;
  onAddRow: () => void;
  onAddDoor: () => void;
  onRenumberAuto: () => void;
  onClear: () => void;
  onLoadPreset: (preset: BusPreset) => void;
  savedTemplates?: SavedBusTemplate[];
  onLoadSavedTemplate?: (template: SavedBusTemplate) => void;
  onOpenSaveTemplateModal?: () => void;
  showGrid: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  nextSeatNumber: number;
  onSave?: () => void;
  savedSuccess?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddSeat,
  onAddRow,
  onAddDoor,
  onRenumberAuto,
  onLoadPreset,
  savedTemplates = [],
  onLoadSavedTemplate,
  onOpenSaveTemplateModal,
  nextSeatNumber,
  onSave,
  savedSuccess,
}) => {
  return (
    <header className="relative z-40 flex items-center justify-between gap-4 px-6 py-3 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-slate-700/60 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,87,34,0.06)]">
      {/* Logo King-Bus Studio avec Couronne Orange */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_15px_rgba(255,87,34,0.5)]">
          <Crown className="size-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-sm font-black tracking-wider text-white">KING-BUS</span>
            <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">STUDIO</span>
          </div>
          <span className="text-[9px] text-slate-400 tracking-wide font-medium">
            Architecte Flotte 3D
          </span>
        </div>
      </div>

      {/* Boutons d'Action Centraux avec Contour Néon Orange */}
      <div className="flex items-center gap-3">
        {/* + Ajouter Siège */}
        <button
          type="button"
          onClick={onAddSeat}
          className="group relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#111622]/90 border border-orange-500/70 hover:border-orange-400 text-white text-xs font-bold shadow-[0_0_12px_rgba(255,87,34,0.25)] hover:shadow-[0_0_18px_rgba(255,87,34,0.45)] transition-all cursor-pointer transform active:scale-95"
        >
          <Plus className="size-3.5 text-orange-400 group-hover:rotate-90 transition-transform" />
          <span>+ Ajouter Siège ({nextSeatNumber})</span>
        </button>

        {/* + Rangée */}
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111622]/90 border border-orange-500/70 hover:border-orange-400 text-white text-xs font-bold shadow-[0_0_12px_rgba(255,87,34,0.25)] hover:shadow-[0_0_18px_rgba(255,87,34,0.45)] transition-all cursor-pointer transform active:scale-95"
        >
          <Plus className="size-3.5 text-orange-400" />
          <span>+ Rangée (4)</span>
        </button>

        {/* + Porte */}
        <button
          type="button"
          onClick={onAddDoor}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111622]/90 border border-orange-500/70 hover:border-orange-400 text-white text-xs font-bold shadow-[0_0_12px_rgba(255,87,34,0.25)] hover:shadow-[0_0_18px_rgba(255,87,34,0.45)] transition-all cursor-pointer transform active:scale-95"
        >
          <Plus className="size-3.5 text-orange-400" />
          <span>+ Porte</span>
        </button>

        {/* Numéroter auto */}
        <button
          type="button"
          onClick={onRenumberAuto}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          title="Réordonner et numéroter 1..N"
        >
          <Hash className="size-3.5 text-amber-400" />
          <span>Numéroter (1..N)</span>
        </button>
      </div>

      {/* Actions Droite : Sélecteur de Modèle & Boutons de Sauvegarde */}
      <div className="flex items-center gap-2.5">
        {/* Sélecteur de modèle */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            if (val.startsWith('custom:')) {
              const templateId = val.replace('custom:', '');
              const t = savedTemplates.find((item) => item.id === templateId);
              if (t && onLoadSavedTemplate) onLoadSavedTemplate(t);
            } else {
              const found = BUS_PRESETS.find((p) => p.id === val);
              if (found) onLoadPreset(found);
            }
          }}
          defaultValue=""
          className="hidden lg:block bg-slate-800/90 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-full text-xs px-3.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer max-w-[190px] truncate"
        >
          <option value="" disabled>
            📂 Charger modèle...
          </option>
          {savedTemplates.length > 0 && (
            <optgroup label="⭐ Mes Modèles Enregistrés">
              {savedTemplates.map((t) => (
                <option key={t.id} value={`custom:${t.id}`}>
                  ⭐ {t.name} ({t.capacity} pl.)
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="🚌 Modèles Standards">
            {BUS_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Bouton pour enregistrer le plan actuel comme modèle réutilisable */}
        {onOpenSaveTemplateModal && (
          <button
            type="button"
            onClick={onOpenSaveTemplateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm hover:border-amber-400"
            title="Enregistrer ce plan comme modèle avec un nom personnalisé"
          >
            <BookmarkPlus className="size-3.5 text-amber-400" />
            <span className="hidden sm:inline">Créer modèle</span>
          </button>
        )}

        {/* Bouton Sauvegarder Vert Émeraude Solide (valide pour la caravane) */}
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all cursor-pointer transform active:scale-95"
        >
          <Save className="size-4" />
          <span>{savedSuccess ? 'Enregistré !' : 'Appliquer'}</span>
        </button>
      </div>
    </header>
  );
};
