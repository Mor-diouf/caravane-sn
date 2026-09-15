import { BusPreset } from './types';

export const BUS_PRESETS: BusPreset[] = [
  {
    id: 'empty',
    name: 'Bus Vierge (Personnalisé)',
    description: 'Carrosserie vide prête pour une disposition libre',
    capacity: 0,
    width: 380,
    height: 640,
    driverArea: { x: 30, y: 35, width: 90, height: 75, label: 'Chauffeur' },
    doors: [
      { x: 310, y: 35, width: 55, height: 45, side: 'right', label: 'Porte' }
    ],
    seats: []
  },
  {
    id: 'hiace-15',
    name: 'Minibus HiAce (15 places)',
    description: 'Minibus standard 15 places très répandu au Sénégal',
    capacity: 15,
    width: 360,
    height: 560,
    driverArea: { x: 30, y: 30, width: 85, height: 70, label: 'Chauffeur' },
    doors: [
      { x: 290, y: 30, width: 55, height: 40, side: 'right', label: 'Porte' }
    ],
    seats: [
      // Rangée 1 (près du chauffeur)
      { number: 1, x: 240, y: 130, width: 55, height: 60, category: 'window', status: 'available' },
      
      // Rangée 2 (2 + 1)
      { number: 2, x: 35, y: 220, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 3, x: 105, y: 220, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 4, x: 270, y: 220, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 3 (2 + 1)
      { number: 5, x: 35, y: 310, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 6, x: 105, y: 310, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 7, x: 270, y: 310, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 4 (2 + 1)
      { number: 8, x: 35, y: 400, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 9, x: 105, y: 400, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 10, x: 270, y: 400, width: 55, height: 60, category: 'window', status: 'available' },

      // Banquette arrière (5 places)
      { number: 11, x: 25, y: 480, width: 50, height: 60, category: 'window', status: 'available' },
      { number: 12, x: 90, y: 480, width: 50, height: 60, category: 'standard', status: 'available' },
      { number: 13, x: 155, y: 480, width: 50, height: 60, category: 'standard', status: 'available' },
      { number: 14, x: 220, y: 480, width: 50, height: 60, category: 'standard', status: 'available' },
      { number: 15, x: 285, y: 480, width: 50, height: 60, category: 'window', status: 'available' },
    ]
  },
  {
    id: 'coaster-28',
    name: 'Coaster Midi-Bus (28 places)',
    description: 'Midi-bus confortable pour trajets régionaux',
    capacity: 28,
    width: 380,
    height: 720,
    driverArea: { x: 30, y: 30, width: 90, height: 70, label: 'Chauffeur' },
    doors: [
      { x: 305, y: 30, width: 60, height: 40, side: 'right', label: 'Porte' }
    ],
    seats: [
      // Rangée 1
      { number: 1, x: 35, y: 130, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 2, x: 100, y: 130, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 3, x: 290, y: 130, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 2
      { number: 4, x: 35, y: 210, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 5, x: 100, y: 210, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 6, x: 290, y: 210, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 3
      { number: 7, x: 35, y: 290, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 8, x: 100, y: 290, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 9, x: 290, y: 290, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 4
      { number: 10, x: 35, y: 370, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 11, x: 100, y: 370, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 12, x: 290, y: 370, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 5
      { number: 13, x: 35, y: 450, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 14, x: 100, y: 450, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 15, x: 290, y: 450, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 6
      { number: 16, x: 35, y: 530, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 17, x: 100, y: 530, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 18, x: 290, y: 530, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée 7
      { number: 19, x: 35, y: 610, width: 55, height: 60, category: 'window', status: 'available' },
      { number: 20, x: 100, y: 610, width: 55, height: 60, category: 'aisle', status: 'available' },
      { number: 21, x: 290, y: 610, width: 55, height: 60, category: 'window', status: 'available' },

      // Rangée Fond (5 places)
      { number: 22, x: 25, y: 650, width: 52, height: 55, category: 'window', status: 'available' },
      { number: 23, x: 92, y: 650, width: 52, height: 55, category: 'standard', status: 'available' },
      { number: 24, x: 160, y: 650, width: 52, height: 55, category: 'standard', status: 'available' },
      { number: 25, x: 228, y: 650, width: 52, height: 55, category: 'standard', status: 'available' },
      { number: 26, x: 298, y: 650, width: 52, height: 55, category: 'window', status: 'available' },
    ]
  },
  {
    id: 'tata-vip-50',
    name: 'Tata VIP 50 places',
    description: 'Grand autocar interurbain climatisé de grand luxe',
    capacity: 50,
    width: 430,
    height: 980,
    driverArea: { x: 35, y: 35, width: 95, height: 75, label: 'Chauffeur' },
    doors: [
      { x: 350, y: 35, width: 60, height: 45, side: 'right', label: 'Porte Avant' },
      { x: 350, y: 480, width: 60, height: 45, side: 'right', label: 'Porte Milieu' },
    ],
    seats: Array.from({ length: 13 }).flatMap((_, rowIndex) => {
      const y = 140 + rowIndex * 64;
      const baseNum = rowIndex * 4 + 1;
      // Rangée 5 avec la porte milieu : seulement 2 sièges à gauche
      if (rowIndex === 5) {
        return [
          { number: baseNum, x: 35, y, width: 55, height: 60, category: 'window' as const, status: 'available' as const },
          { number: baseNum + 1, x: 100, y, width: 55, height: 60, category: 'aisle' as const, status: 'available' as const },
        ];
      }
      return [
        { number: baseNum, x: 35, y, width: 55, height: 60, category: 'window' as const, status: 'available' as const },
        { number: baseNum + 1, x: 100, y, width: 55, height: 60, category: 'aisle' as const, status: 'available' as const },
        { number: baseNum + 2, x: 265, y, width: 55, height: 60, category: 'aisle' as const, status: 'available' as const },
        { number: baseNum + 3, x: 330, y, width: 55, height: 60, category: 'window' as const, status: 'available' as const },
      ];
    }).slice(0, 50)
  }
];
