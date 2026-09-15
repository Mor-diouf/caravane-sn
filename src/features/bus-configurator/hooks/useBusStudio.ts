import { useState, useCallback, useMemo } from 'react';
import { BusDoor, BusDriver, BusLayout, BusPreset, BusSeat, SeatCategory } from '../types';
import { BUS_PRESETS } from '../presets';

export type SelectedElement = 
  | { type: 'seat'; id: string }
  | { type: 'door'; id: string }
  | { type: 'driver' }
  | null;

function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9);
}

function snap(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 1) return Math.round(val);
  return Math.round(val / gridSize) * gridSize;
}

export function useBusStudio(initial?: string | BusLayout) {
  const [layout, setLayout] = useState<BusLayout>(() => {
    if (initial && typeof initial === 'object' && Array.isArray(initial.seats)) {
      return {
        ...initial,
        seats: initial.seats.map((s, idx) => ({ ...s, id: s.id || generateId(), number: s.number ?? idx + 1 })),
        doors: (initial.doors || []).map(d => ({ ...d, id: d.id || generateId() })),
        driverArea: initial.driverArea || { x: 35, y: 35, width: 95, height: 75, label: 'Chauffeur' },
        showGrid: initial.showGrid ?? true,
        snapToGrid: initial.snapToGrid ?? true,
        gridSize: initial.gridSize ?? 15,
      };
    }
    const presetId = typeof initial === 'string' ? initial : 'hiace-15';
    const initialPreset = BUS_PRESETS.find(p => p.id === presetId) ?? BUS_PRESETS[0]!;
    return {
      id: generateId(),
      name: initialPreset.name,
      type: initialPreset.id === 'hiace-15' ? 'minibus' : initialPreset.id === 'tata-vip-50' ? 'standard' : 'custom',
      capacity: initialPreset.seats.length,
      width: initialPreset.width,
      height: initialPreset.height,
      seats: initialPreset.seats.map((s, idx) => ({ ...s, id: generateId(), number: s.number ?? idx + 1 })),
      doors: initialPreset.doors.map(d => ({ ...d, id: generateId() })),
      driverArea: { ...initialPreset.driverArea },
      showGrid: true,
      snapToGrid: true,
      gridSize: 15,
    };
  });

  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);

  // Compute next available seat number
  const nextSeatNumber = useMemo(() => {
    const numericNumbers = layout.seats
      .map(s => (typeof s.number === 'number' ? s.number : parseInt(s.number, 10)))
      .filter(n => !isNaN(n));
    if (numericNumbers.length === 0) return 1;
    return Math.max(...numericNumbers) + 1;
  }, [layout.seats]);

  // Add a single seat
  const addSeat = useCallback((customCategory: SeatCategory = 'standard') => {
    const num = nextSeatNumber;
    const newId = generateId();

    // Default position: center of the upper area, snapped
    const defaultX = snap(layout.width / 2 - 27, layout.gridSize, layout.snapToGrid);
    const defaultY = snap(150 + (layout.seats.length % 5) * 20, layout.gridSize, layout.snapToGrid);

    const newSeat: BusSeat = {
      id: newId,
      number: num,
      x: defaultX,
      y: defaultY,
      width: 55,
      height: 60,
      category: customCategory,
      status: 'available'
    };

    setLayout(prev => ({
      ...prev,
      seats: [...prev.seats, newSeat],
      capacity: prev.seats.length + 1
    }));

    setSelectedElement({ type: 'seat', id: newId });
    return newSeat;
  }, [layout.width, layout.gridSize, layout.snapToGrid, layout.seats.length, nextSeatNumber]);

  // Add a row of 4 seats
  const addRow = useCallback(() => {
    const startNum = nextSeatNumber;
    const currentSeats = [...layout.seats];
    const yPos = snap(140 + Math.floor(currentSeats.length / 4) * 70, layout.gridSize, layout.snapToGrid);

    const seat1: BusSeat = { id: generateId(), number: startNum, x: 35, y: yPos, width: 55, height: 60, category: 'window', status: 'available' };
    const seat2: BusSeat = { id: generateId(), number: startNum + 1, x: 100, y: yPos, width: 55, height: 60, category: 'aisle', status: 'available' };
    const seat3: BusSeat = { id: generateId(), number: startNum + 2, x: layout.width - 155, y: yPos, width: 55, height: 60, category: 'aisle', status: 'available' };
    const seat4: BusSeat = { id: generateId(), number: startNum + 3, x: layout.width - 90, y: yPos, width: 55, height: 60, category: 'window', status: 'available' };

    const newSeats = [seat1, seat2, seat3, seat4];

    setLayout(prev => ({
      ...prev,
      seats: [...prev.seats, ...newSeats],
      capacity: prev.seats.length + 4
    }));
  }, [layout.seats, layout.gridSize, layout.snapToGrid, layout.width, nextSeatNumber]);

  // Définir le nombre exact de places (génère ou ajuste les sièges automatiquement)
  const setCapacity = useCallback((targetCount: number) => {
    const count = Math.max(1, Math.min(80, Math.round(targetCount)));
    setLayout(prev => {
      let current = [...prev.seats];

      if (current.length < count) {
        const needed = count - current.length;
        const newSeats: BusSeat[] = [];
        let curNum = current.length + 1;

        for (let i = 0; i < needed; i++) {
          const totalIndex = current.length + i;
          const rowIndex = Math.floor(totalIndex / 4);
          const colIndex = totalIndex % 4;
          const y = snap(140 + rowIndex * 65, prev.gridSize, prev.snapToGrid);

          let x = 35;
          let cat: SeatCategory = 'window';
          if (colIndex === 0) { x = 35; cat = 'window'; }
          else if (colIndex === 1) { x = 100; cat = 'aisle'; }
          else if (colIndex === 2) { x = prev.width - 165; cat = 'aisle'; }
          else { x = prev.width - 100; cat = 'window'; }

          newSeats.push({
            id: generateId(),
            number: curNum++,
            x: Math.max(25, Math.min(prev.width - 80, x)),
            y,
            width: 55,
            height: 60,
            category: cat,
            status: 'available',
          });
        }
        current = [...current, ...newSeats];
      } else if (current.length > count) {
        current = current.slice(0, count);
      }

      const renumbered = current.map((s, idx) => ({ ...s, number: idx + 1 }));
      const maxSeatY = renumbered.length > 0 ? Math.max(...renumbered.map(s => s.y)) : 300;
      const neededHeight = Math.max(520, maxSeatY + 110);

      // Clamper les portes pour qu'elles restent toujours à l'intérieur du châssis
      const adjustedDoors = prev.doors.map(d => ({
        ...d,
        y: Math.min(d.y, neededHeight - 65)
      }));

      return {
        ...prev,
        seats: renumbered,
        capacity: count,
        height: neededHeight,
        doors: adjustedDoors,
      };
    });
  }, []);

  // Move a seat
  const moveSeat = useCallback((id: string, rawX: number, rawY: number) => {
    setLayout(prev => {
      const snappedX = snap(rawX, prev.gridSize, prev.snapToGrid);
      const snappedY = snap(rawY, prev.gridSize, prev.snapToGrid);

      // Clamp inside bus dimensions
      const seat = prev.seats.find(s => s.id === id);
      const width = seat?.width || 55;
      const height = seat?.height || 60;

      const clampedX = Math.max(15, Math.min(prev.width - width - 15, snappedX));
      const clampedY = Math.max(15, Math.min(prev.height - height - 15, snappedY));

      return {
        ...prev,
        seats: prev.seats.map(s => s.id === id ? { ...s, x: clampedX, y: clampedY } : s)
      };
    });
  }, []);

  // Update seat properties
  const updateSeat = useCallback((id: string, updates: Partial<BusSeat>) => {
    setLayout(prev => ({
      ...prev,
      seats: prev.seats.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, []);

  // Delete seat
  const deleteSeat = useCallback((id: string) => {
    setLayout(prev => {
      const remaining = prev.seats.filter(s => s.id !== id);
      return {
        ...prev,
        seats: remaining,
        capacity: remaining.length
      };
    });
    setSelectedElement(null);
  }, []);

  // Add door
  const addDoor = useCallback((side: 'left' | 'right' = 'right') => {
    const newDoor: BusDoor = {
      id: generateId(),
      x: side === 'right' ? layout.width - 65 : 15,
      y: snap(layout.height / 2, layout.gridSize, layout.snapToGrid),
      width: 50,
      height: 40,
      side,
      label: 'Porte'
    };

    setLayout(prev => ({
      ...prev,
      doors: [...prev.doors, newDoor]
    }));
    setSelectedElement({ type: 'door', id: newDoor.id });
  }, [layout.width, layout.height, layout.gridSize, layout.snapToGrid]);

  // Move door
  const moveDoor = useCallback((id: string, rawX: number, rawY: number) => {
    setLayout(prev => {
      const snappedX = snap(rawX, prev.gridSize, prev.snapToGrid);
      const snappedY = snap(rawY, prev.gridSize, prev.snapToGrid);
      return {
        ...prev,
        doors: prev.doors.map(d => d.id === id ? { ...d, x: snappedX, y: snappedY } : d)
      };
    });
  }, []);

  // Delete door
  const deleteDoor = useCallback((id: string) => {
    setLayout(prev => ({
      ...prev,
      doors: prev.doors.filter(d => d.id !== id)
    }));
    setSelectedElement(null);
  }, []);

  // Move driver
  const moveDriver = useCallback((rawX: number, rawY: number) => {
    setLayout(prev => ({
      ...prev,
      driverArea: {
        ...prev.driverArea,
        x: snap(rawX, prev.gridSize, prev.snapToGrid),
        y: snap(rawY, prev.gridSize, prev.snapToGrid)
      }
    }));
  }, []);

  // Renumber all seats automatically (from front to rear, left to right)
  const renumberSeatsAuto = useCallback(() => {
    setLayout(prev => {
      // Sort seats: first by Y (row position), then by X (left to right)
      const sorted = [...prev.seats].sort((a, b) => {
        const rowDiff = Math.floor(a.y / 40) - Math.floor(b.y / 40);
        if (rowDiff !== 0) return rowDiff;
        return a.x - b.x;
      });

      const renumbered = sorted.map((seat, idx) => ({
        ...seat,
        number: idx + 1
      }));

      return {
        ...prev,
        seats: renumbered
      };
    });
  }, []);

  // Load a preset
  const loadPreset = useCallback((preset: BusPreset) => {
    setLayout({
      id: generateId(),
      name: preset.name,
      type: preset.id === 'hiace-15' ? 'minibus' : preset.id === 'kingbus-50' ? 'standard' : 'custom',
      capacity: preset.seats.length,
      width: preset.width,
      height: preset.height,
      seats: preset.seats.map((s, idx) => ({ ...s, id: generateId(), number: s.number ?? idx + 1 })),
      doors: preset.doors.map(d => ({ ...d, id: generateId() })),
      driverArea: { ...preset.driverArea },
      showGrid: true,
      snapToGrid: true,
      gridSize: 15,
    });
    setSelectedElement(null);
  }, []);

  // Clear all seats
  const clearSeats = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      seats: [],
      capacity: 0
    }));
    setSelectedElement(null);
  }, []);

  // Load a full layout (from custom saved template)
  const loadLayout = useCallback((newLayout: BusLayout) => {
    setLayout({
      ...newLayout,
      id: newLayout.id || generateId(),
      seats: (newLayout.seats || []).map((s, idx) => ({
        ...s,
        id: s.id || generateId(),
        number: s.number ?? idx + 1,
      })),
      doors: (newLayout.doors || []).map((d) => ({
        ...d,
        id: d.id || generateId(),
      })),
      driverArea: newLayout.driverArea || { x: 35, y: 35, width: 95, height: 75, label: 'Chauffeur' },
    });
    setSelectedElement(null);
  }, []);

  // Toggle grid
  const toggleGrid = useCallback(() => {
    setLayout(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  // Toggle snap to grid
  const toggleSnap = useCallback(() => {
    setLayout(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  // Update bus dimensions
  const updateDimensions = useCallback((width: number, height: number) => {
    setLayout(prev => ({
      ...prev,
      width: Math.max(320, Math.min(600, width)),
      height: Math.max(480, Math.min(1400, height))
    }));
  }, []);

  const selectedSeat = useMemo(() => {
    if (!selectedElement || selectedElement.type !== 'seat') return null;
    return layout.seats.find(s => s.id === selectedElement.id) || null;
  }, [selectedElement, layout.seats]);

  const selectedDoor = useMemo(() => {
    if (!selectedElement || selectedElement.type !== 'door') return null;
    return layout.doors.find(d => d.id === selectedElement.id) || null;
  }, [selectedElement, layout.doors]);

  return {
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
    setCapacity,
    loadLayout,
  };
}
