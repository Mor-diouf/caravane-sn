import { useState, useEffect, useCallback } from 'react';
import { BusLayout, SavedBusTemplate } from './types';

const STORAGE_KEY = 'kingbus_custom_bus_templates';
const UPDATE_EVENT = 'kingbus:bus-templates-updated';

function generateId(): string {
  return 'template_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

export function getSavedTemplates(): SavedBusTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erreur lecture templates de bus:', err);
    return [];
  }
}

export function saveTemplate(name: string, layout: BusLayout): SavedBusTemplate {
  const templates = getSavedTemplates();
  const trimmedName = name.trim() || layout.name || 'Modèle Personnalisé';
  const now = new Date().toISOString();

  // Si un modèle avec le même id existe déjà, on le met à jour
  const existingIndex = templates.findIndex((t) => t.id === layout.id || t.name.toLowerCase() === trimmedName.toLowerCase());

  let savedItem: SavedBusTemplate;

  if (existingIndex >= 0) {
    savedItem = {
      id: templates[existingIndex].id,
      createdAt: templates[existingIndex].createdAt,
      name: trimmedName,
      capacity: layout.seats?.length || 0,
      layout: {
        ...layout,
        name: trimmedName,
      },
      updatedAt: now,
    };
    templates[existingIndex] = savedItem;
  } else {
    const newId = generateId();
    savedItem = {
      id: newId,
      name: trimmedName,
      capacity: layout.seats?.length || 0,
      layout: {
        ...layout,
        id: newId,
        name: trimmedName,
      },
      createdAt: now,
      updatedAt: now,
    };
    templates.unshift(savedItem);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch (err) {
    console.error('Erreur sauvegarde template de bus:', err);
  }

  return savedItem;
}

export function deleteTemplate(id: string): void {
  const templates = getSavedTemplates().filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch (err) {
    console.error('Erreur suppression template de bus:', err);
  }
}

/**
 * Hook React réactif pour synchroniser la liste des modèles enregistrés
 */
export function useSavedBusTemplates() {
  const [templates, setTemplates] = useState<SavedBusTemplate[]>(() => getSavedTemplates());

  const refresh = useCallback(() => {
    setTemplates(getSavedTemplates());
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return {
    templates,
    saveTemplate: (name: string, layout: BusLayout) => {
      const res = saveTemplate(name, layout);
      refresh();
      return res;
    },
    deleteTemplate: (id: string) => {
      deleteTemplate(id);
      refresh();
    },
    refresh,
  };
}
