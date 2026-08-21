# Campus Caravan Connect

{

  "project": {

    "name": "Caravane Étudiants",

    "version": "2.0.0",

    "description": "Plateforme moderne, minimaliste et fluide de réservation de caravanes et de transports universitaires au Sénégal.",

    "stack": {

      "framework": ["Next.js 14+ (App Router)", "React Native (Expo)"],

      "styling": ["Tailwind CSS / NativeWind", "Framer Motion (Web)", "Reanimated (Mobile)"],

      "components": ["Shadcn UI", "Lucide Icons"],

      "state_management": "Zustand",

      "payments": ["PayTech API", "Wave Mobile Money API", "Orange Money API"]

    }

  },

  "design_system": {

    "style": "Modern Clean Minimalist with Glassmorphism Accent",

    "color_palette": {

      "primary": "#1E3A8A",

      "primary_accent": "#2563EB",

      "secondary_accent": "#F59E0B",

      "background_light": "#F8FAFC",

      "surface_card": "#FFFFFF",

      "text_dark": "#0F172A",

      "text_muted": "#64748B",

      "badge_available": "#10B981",

      "badge_warning": "#EF4444"

    },

    "typography": {

      "font_family": "Inter / Plus Jakarta Sans",

      "headings": "Bold, Sans-Serif, high readability",

      "body": "Medium / Regular"

    },

    "border_radius": "xl (16px) to 2xl (24px) for cards, full for badges",

    "shadows": "Soft ambient elevation (0 10px 30px -10px rgba(0, 0, 0, 0.05))"

  },

  "key_features_to_implement": [

    "Carousel d'universités avec filtrage dynamique (UASZ, UCAD, UGB, UIDT, UADB)",

    "Cartes de trajets interactives avec places restantes en direct (Badges dynamique)",

    "Barre de recherche rapide avec filtres (Origine, Destination, Date)",

    "Fiche trajet détaillée avec équipements (Wi-Fi, Prises, AC) et infos amicale organisatrice",

    "Modal & Flow de paiement instantané sécurisé par PayTech (Wave, Orange Money, Free Money)",

    "Génération de Billet Électronique avec QR Code dynamique pour validation à l'embarquement",

    "Navigation Drawer / Bottom Bar élégante et rétractable"

  ],

  "component_structure": {

    "Header": {

      "elements": ["User Greeting", "Notification Bell with badge", "Search Bar input"]

    },

    "UniversitySelector": {

      "type": "Horizontal Scroll Bar",

      "items": ["University Logo", "Abbreviation Label", "Active State Ring"]

    },

    "CaravanCard": {

      "layout": "Grid 2-columns (Mobile) / 3-columns (Desktop)",

      "elements": [

        "Banner Image with remaining seats badge",

        "Route Title (e.g., UASZ -> Dakar)",

        "Departure Time & Pickup Point",

        "Price Tag in FCFA",

        "Favorite Button (Heart)"

      ]

    },

    "TicketView": {

      "elements": [

        "Status Indicator (Confirmed)",

        "High-density SVG QR Code",

        "Route & Passanger Details",

        "Apple/Google Wallet Save Button"

      ]

    }

  },

  "ui_improvements_over_v1": [

    "Remplacer la sidebar sombre lourde par un Drawer moderne ou une Bottom Navigation épurée avec flou d'arrière-plan (backdrop-blur).",

    "Optimiser l'espace visuel avec un padding plus aéré et des typographies mieux hiérarchisées.",

    "Ajouter des animations de transition fluides (Layout Animations) lors du passage de la liste au détail du trajet.",

    "Rendre le processus d'achat en 2 clics avec pré-remplissage des données de l'étudiant."

  ],

  "prompt_instruction": "Développe une interface utilisateur réactive, moderne et ultra-performante basée sur ce JSON. Utilise des composants modulaires réutilisables, un code propre et typé avec TypeScript, et applique les règles du design system indiqué ci-dessus."

}

Voilà, euh, bonjour. Voilà, je vous ai donné ce design prompt-là pour construire cette application. Maintenant, euh, c'est à vous, par exemple, de me construire quelque chose, voire même qui est meilleur que ce design prompt que je vous ai donné là. Voilà, je veux que ça soit simple. Vous avez une image en visuel. Voilà, si l'image aussi n'est pas parfaite pour-- voilà, vous pouvez le changer. Voilà, et vous pouvez directement co-- voilà, vous pouvez directement travailler sur le projet, voilà, en modifiant ce que vous voulez, voilà, en le rendant beaucoup plus professionnel. Voilà, je veux qu'il soit ultra-professionnel. Voilà, à vous de faire le front endd

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ride-route-senegal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac12a89f-3fd0-4a38-b9d9-1905e03e26cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
