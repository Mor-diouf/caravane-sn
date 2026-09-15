import React, { useState } from 'react';
import { useBusStudio } from './hooks/useBusStudio';
import { BusCanvas } from './components/BusCanvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BusLayout, BusSeat } from './types';
import {
  Bus,
  Layers,
  Box,
  ShieldCheck,
  Settings,
  Compass,
  Eye,
  Edit3,
  Armchair,
  CheckCircle2,
  BookmarkPlus,
  Trash2,
  FolderOpen,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useSavedBusTemplates } from './savedTemplates';
import { SavedBusTemplate } from './types';
import { BUS_PRESETS } from './presets';
import { cn } from '@/lib/utils';

interface BusConfiguratorProps {
  initialLayout?: BusLayout;
  onSave?: (layout: BusLayout) => void;
}

export const BusConfigurator: React.FC<BusConfiguratorProps> = ({ initialLayout, onSave }) => {
  const {
    layout,
    setLayout,
    selectedElement,
    setSelectedElement,
    selectedSeat,
    selectedDoor,
    nextSeatNumber,
    addSeat,
    addRow,
    moveSeat,
    updateSeat,
    deleteSeat,
    addDoor,
    moveDoor,
    deleteDoor,
    moveDriver,
    renumberSeatsAuto,
    loadPreset,
    clearSeats,
    toggleGrid,
    toggleSnap,
    updateDimensions,
    loadLayout,
  } = useBusStudio(initialLayout || 'tata-vip-50');

  const { templates, saveTemplate, deleteTemplate } = useSavedBusTemplates();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [activeNav, setActiveNav] = useState<'bus' | 'plans' | 'models' | 'configs' | 'settings'>('bus');
  const [isIsometric3D, setIsIsometric3D] = useState(true);
  const [use3DSeats, setUse3DSeats] = useState(false);
  const [simulatedSelectedSeat, setSimulatedSelectedSeat] = useState<BusSeat | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal pour nommer et enregistrer le modèle
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateToast, setTemplateToast] = useState<string | null>(null);

  const handleSaveToCaravan = () => {
    if (onSave) {
      onSave(layout);
    } else {
      localStorage.setItem('kingbus_last_saved_layout', JSON.stringify(layout, null, 2));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleConfirmSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = templateNameInput.trim() || layout.name || 'Mon Modèle Bus';
    const saved = saveTemplate(finalName, layout);
    setIsSaveModalOpen(false);
    setTemplateToast(`Modèle "${saved.name}" enregistré avec succès !`);
    setTimeout(() => setTemplateToast(null), 3500);
  };

  return (
    <div className="relative h-screen w-full bg-[#0B0D12] text-[#FDFBF7] flex flex-col overflow-hidden font-sans select-none">
      {/* Toast d'information modèle enregistré */}
      {templateToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600/95 text-white text-xs font-black shadow-2xl border border-emerald-400/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="size-4" />
          <span>{templateToast}</span>
        </div>
      )}

      {/* Modal pour donner un nom et sauvegarder le modèle */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#111722] border border-slate-700/80 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <BookmarkPlus className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  Enregistrer ce modèle de bus
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Donnez un nom à ce modèle pour le réutiliser directement sur toutes vos futures caravanes.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmSaveTemplate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Nom du modèle
                </label>
                <input
                  type="text"
                  autoFocus
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="Ex: Tata VIP 55 Élite, Minibus Touba 15 places..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacité totale :</span>
                  <strong className="text-amber-400 font-extrabold">{layout.seats.length} places</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Portes configurées :</span>
                  <span className="font-semibold text-white">{layout.doors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensions :</span>
                  <span className="font-mono text-slate-400">{layout.width} × {layout.height}px</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!templateNameInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  Enregistrer le modèle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Halo d'ambiance volumétrique de fond (Dark Luxury Tech) */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[600px] rounded-full bg-orange-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[600px] rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[900px] rounded-full bg-sky-900/5 blur-[150px]" />

      {/* 1. BARRE FLOTTANTE SUPÉRIEURE (PILL BAR) */}
      <div className="relative z-30 pt-4 px-6 max-w-7xl mx-auto w-full">
        <Toolbar
          onAddSeat={() => addSeat('standard')}
          onAddRow={addRow}
          onAddDoor={() => addDoor('right')}
          onRenumberAuto={renumberSeatsAuto}
          onClear={clearSeats}
          onLoadPreset={loadPreset}
          savedTemplates={templates}
          onLoadSavedTemplate={(t) => {
            loadLayout(t.layout);
            setTemplateToast(`Modèle "${t.name}" chargé !`);
            setTimeout(() => setTemplateToast(null), 2500);
          }}
          onOpenSaveTemplateModal={() => {
            setTemplateNameInput(layout.name || 'Mon Modèle VIP');
            setIsSaveModalOpen(true);
          }}
          showGrid={layout.showGrid}
          snapToGrid={layout.snapToGrid}
          onToggleGrid={toggleGrid}
          onToggleSnap={toggleSnap}
          nextSeatNumber={nextSeatNumber}
          onSave={handleSaveToCaravan}
          savedSuccess={savedSuccess}
        />
      </div>

      {/* 2. ESPACE CENTRAL : MENU GAUCHE + CANVAS 2.5D + PANNEAU DROIT */}
      <div className="relative z-20 flex-1 flex items-stretch p-6 gap-6 max-w-7xl mx-auto w-full min-h-0">
        {/* SIDEBAR DE NAVIGATION GAUCHE (comme sur la capture 3D) */}
        <aside className="w-48 shrink-0 flex flex-col justify-between py-6 px-3 rounded-3xl bg-[#111722]/70 backdrop-blur-2xl border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-y-auto custom-scrollbar">
          {/* Menu principal */}
          <nav className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setActiveNav('bus')}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                activeNav === 'bus'
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/15 border border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,87,34,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Bus className="size-4" />
              <span>Bus</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('plans')}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                activeNav === 'plans'
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/15 border border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,87,34,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Layers className="size-4" />
              <span>Plans</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('models')}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                activeNav === 'models'
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/15 border border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,87,34,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Box className="size-4" />
              <span>Modèles</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('configs')}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                activeNav === 'configs'
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/15 border border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,87,34,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <ShieldCheck className="size-4" />
              <span>Configurations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                activeNav === 'settings'
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/15 border border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,87,34,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Settings className="size-4" />
              <span>Paramètres</span>
            </button>
          </nav>

          {/* Section Inférieure : Boussole 3D & Slogan de marque */}
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-800/80">
            {/* Widget Boussole / Contrôle d'angle 3D (identique à l'image) */}
            <div className="relative mx-auto size-14 rounded-full bg-[#0a0d14] border border-slate-700/80 shadow-inner flex items-center justify-center">
              <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,87,34,1)]" />
              {/* Point cardinal Nord */}
              <span className="absolute top-1 text-[8px] font-black text-orange-400">N</span>
              <span className="absolute bottom-1 text-[8px] font-semibold text-slate-600">S</span>
              <span className="absolute left-1.5 text-[8px] font-semibold text-slate-600">O</span>
              <span className="absolute right-1.5 text-[8px] font-semibold text-slate-600">E</span>
            </div>

            {/* Slogan King-Bus Studio */}
            <div>
              <span className="text-xs font-black italic tracking-wider text-orange-400 block font-serif">
                KING-BUS
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest block -mt-0.5">
                STUDIO
              </span>
              <p className="text-[9px] text-slate-500 mt-1 leading-snug">
                Des voyages plus confortables, ensemble.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative min-h-0 rounded-3xl bg-[#0e121a]/60 backdrop-blur-xl border border-slate-800/70 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden">
          {activeNav === 'models' ? (
            /* VUE BIBLIOTHÈQUE DE MODÈLES DE BUS */
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveNav('bus')}
                      className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                      title="Retour au studio"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Box className="size-5 text-amber-500" />
                      Bibliothèque de Modèles de Bus
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 pl-10.5">
                    Vos configurations sauvegardées et réutilisables en 1 clic lors de la création de vos caravanes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateNameInput(layout.name || 'Mon Modèle VIP');
                    setIsSaveModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <BookmarkPlus className="size-4" />
                  <span>Enregistrer le plan actuel</span>
                </button>
              </div>

              {/* Section 1 : Mes modèles personnalisés */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  Mes Modèles Enregistrés ({templates.length})
                </h3>

                {templates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center space-y-2">
                    <Box className="size-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">Aucun modèle personnalisé enregistré pour l'instant</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Configurez un bus dans le studio puis cliquez sur "Créer modèle" pour l'enregistrer dans votre bibliothèque.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-slate-800 hover:border-amber-500/50 bg-[#111722]/80 p-4 transition-all flex flex-col justify-between gap-4 shadow-lg group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black">
                              ⭐ Personnalisé
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Supprimer le modèle "${t.name}" ?`)) {
                                  deleteTemplate(t.id);
                                }
                              }}
                              className="size-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                              title="Supprimer ce modèle"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                            {t.name}
                          </h4>
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                            <span className="font-bold text-slate-200">💺 {t.capacity} places</span>
                            <span>•</span>
                            <span>🚪 {t.layout.doors?.length || 0} portes</span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500 font-mono">
                            {t.layout.width} × {t.layout.height}px
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            loadLayout(t.layout);
                            setActiveNav('bus');
                            setTemplateToast(`Modèle "${t.name}" chargé dans le studio !`);
                            setTimeout(() => setTemplateToast(null), 2500);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-200 text-xs font-bold transition-all"
                        >
                          <FolderOpen className="size-3.5" />
                          <span>Charger ce modèle</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2 : Modèles officiels standards */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Bus className="size-3.5" />
                  Modèles Standards King-Bus ({BUS_PRESETS.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BUS_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-800/80 bg-[#111722]/50 p-4 transition-all flex flex-col justify-between gap-4"
                    >
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                          Standard
                        </span>
                        <h4 className="text-sm font-bold text-white mt-2">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                        <div className="mt-2 text-xs font-bold text-slate-300">
                          💺 {p.seats.length} places configurées
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          loadPreset(p);
                          setActiveNav('bus');
                          setTemplateToast(`Modèle "${p.name}" chargé !`);
                          setTimeout(() => setTemplateToast(null), 2500);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                      >
                        <span>Charger comme base</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Barre de contrôles visuels 3D Flottante */}
              <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('editor');
                    setSimulatedSelectedSeat(null);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    activeTab === 'editor'
                      ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Edit3 className="size-3.5" />
                  <span>Studio 2.5D</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('preview');
                    setSelectedElement(null);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    activeTab === 'preview'
                      ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Eye className="size-3.5" />
                  <span>Aperçu Passager</span>
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-1" />

                {/* Bascule Perspective 3D Isométrique */}
                <button
                  type="button"
                  onClick={() => setIsIsometric3D(!isIsometric3D)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    isIsometric3D
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(255,160,0,0.25)]'
                      : 'text-slate-400 hover:text-white'
                  )}
                  title="Activer/Désactiver la perspective 3D isométrique"
                >
                  <Compass className="size-3.5 text-amber-400" />
                  <span>{isIsometric3D ? 'Perspective 3D Active' : 'Vue 2D À Plat'}</span>
                </button>

                {/* Bascule Style Sièges 3D Photo vs Vectoriel */}
                <button
                  type="button"
                  onClick={() => setUse3DSeats(!use3DSeats)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    use3DSeats
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'text-slate-400 hover:text-white'
                  )}
                  title="Basculer entre sièges capitonnés vectoriels et texture 3D photo"
                >
                  <Armchair className="size-3.5 text-amber-400" />
                  <span>{use3DSeats ? 'Sièges 3D Photo' : 'Sièges Cuir Luxe'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <div className="w-[max-content] min-w-full h-[max-content] min-h-full p-12 pt-24">
                  <div className="mx-auto w-max relative">
                    {activeTab === 'editor' ? (
                      <BusCanvas
                        layout={layout}
                        selectedElement={selectedElement}
                        onSelectElement={setSelectedElement}
                        onMoveSeat={moveSeat}
                        onMoveDoor={moveDoor}
                        onMoveDriver={moveDriver}
                        isInteractive={true}
                        isIsometric3D={isIsometric3D}
                        use3DSeats={use3DSeats}
                      />
                    ) : (
                      /* Mode Simulation Client Réel */
                      <div className="flex flex-col items-center gap-6 py-6 w-full">
                        <div className="text-center">
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider">
                            Expérience Passager Réelle
                          </span>
                          <h3 className="text-lg font-black text-white mt-1.5">
                            Choisissez votre place dans {layout.name}
                          </h3>
                        </div>

                        <BusCanvas
                          layout={{
                            ...layout,
                            showGrid: false,
                            seats: layout.seats.map((s) => ({
                              ...s,
                              status:
                                simulatedSelectedSeat?.id === s.id
                                  ? 'selected'
                                  : s.status,
                            })),
                          }}
                          selectedElement={
                            simulatedSelectedSeat
                              ? { type: 'seat', id: simulatedSelectedSeat.id }
                              : null
                          }
                          onSelectElement={(elem) => {
                            if (elem && elem.type === 'seat') {
                              const seat = layout.seats.find((s) => s.id === elem.id);
                              setSimulatedSelectedSeat(seat || null);
                            } else {
                              setSimulatedSelectedSeat(null);
                            }
                          }}
                          onMoveSeat={() => {}}
                          onMoveDoor={() => {}}
                          onMoveDriver={() => {}}
                          isInteractive={false}
                          isIsometric3D={isIsometric3D}
                          use3DSeats={use3DSeats}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Barre Glassmorphism de confirmation passager */}
          {activeTab === 'preview' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-40">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <Armchair className="size-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                      Siège sélectionné
                    </span>
                    <strong className="text-sm text-white font-black">
                      {simulatedSelectedSeat
                        ? `Siège N° ${simulatedSelectedSeat.number} (${simulatedSelectedSeat.category})`
                        : 'Aucune place choisie'}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!simulatedSelectedSeat}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
                    simulatedSelectedSeat
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(255,87,34,0.4)] hover:brightness-110'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  )}
                >
                  Acheter Billet (Test)
                </button>
              </div>
          )}
        </main>

        {/* PANNEAU LATÉRAL DROIT : PROPRIÉTÉS DU BUS */}
        <PropertiesPanel
          selectedElement={selectedElement}
          selectedSeat={selectedSeat}
          selectedDoor={selectedDoor}
          onUpdateSeat={updateSeat}
          onDeleteSeat={deleteSeat}
          onDeleteDoor={deleteDoor}
          onClose={() => setSelectedElement(null)}
          busName={layout.name}
          onUpdateBusName={(name) => setLayout((prev) => ({ ...prev, name }))}
          busWidth={layout.width}
          busHeight={layout.height}
          onUpdateDimensions={updateDimensions}
          totalSeats={layout.seats.length}
          totalDoors={layout.doors.length}
        />
      </div>
    </div>
  );
};
