# Event Map App

A mobile-first web application designed for event navigation, providing an interactive map with detailed exhibitor information and an admin dashboard for comprehensive event management.

## 🗺️ Features

### For Event Visitors
- **Interactive Map**: Explore the event venue with detailed markers for exhibitors, parking, food, and other points of interest.
- **Search Functionality**: Quickly find exhibitors, booths, or specific locations on the map.
- **Exhibitor Listings**: Browse a comprehensive list of all exhibitors with detailed information.
- **Event Schedule**: View the event schedule and plan your visit.
- **Offline Support**: Access cached map tiles and marker data for a seamless experience even with an unstable internet connection.
- **Responsive Design**: Optimized for mobile devices, ensuring a great user experience on smartphones and tablets.
- **Accessibility**: Features like high-contrast mode, larger text options, and keyboard navigation for improved accessibility.
- **Favorites**: Save your favorite exhibitors for quick access.

### For Event Admins
- **Secure Login**: A secure, role-based admin panel to manage all event data.
- **Dashboard**: Get an overview of key event metrics, including total markers, companies, subscriptions, and assignments.
- **Map Management**: Easily add, edit, and delete map markers. Drag-and-drop functionality for precise positioning.
- **Company Management**: Add and manage companies, logos, and contact details.
- **Booth Assignments**: Assign companies to specific booth locations on the map.
- **Event Subscriptions**: Manage event subscriptions, including meal counts, booth numbers, and special requirements.
- **Program Management**: Create and manage the event schedule with activities and exhibitor presentations.
- **Category Management**: Organize exhibitors into categories for better filtering and organization on the public-facing map.
- **Branding & Settings**: Customize the event's visual appearance, manage organization profiles, and configure system settings.
- **Data Import/Export**: Import and export event data using CSV/Excel/JSON files for seamless data management.
- **Real-time Updates**: All changes made by admins are reflected in real-time on the public map.
- **User Feedback System**: Collect and manage user feedback and feature requests directly within the admin panel.
- **Multi-language Support**: Manage event content in multiple languages (English and Dutch currently supported).

## 🛠️ Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/) for building the user interface.
  - [React Router](https://reactrouter.com/) for handling navigation.
  - [Vite](https://vitejs.dev/) for fast development and building.
  - [Tailwind CSS](https://tailwindcss.com/) for styling.
  - [Leaflet](https://leafletjs.com/) for the interactive map.
  - [Supabase](https://supabase.com/) for the backend and database.
  - [i18next](https://www.i18next.com/) for internationalization.
  - [Material Design Icons](https://fonts.google.com/icons) for icons.

- **Backend**:
  - [Supabase](https://supabase.com/) - A Firebase alternative, providing a PostgreSQL database with real-time capabilities and authentication.

- **Development & Testing**:
  - [ESLint](https://eslint.org/) for code linting.
  - [Prettier](https://prettier.io/) for code formatting.
  - [Jest](https://jestjs.io/) for testing.
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Tomplan/Map.git
    cd Map
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project with the following variables:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Set up the Supabase Database:**
    -   Navigate to your Supabase project dashboard.
    -   Go to the **SQL Editor** and run the `migrations/COMPLETE_MIGRATION.sql` script. This will create all the necessary tables, set up Row Level Security (RLS), and migrate any existing data.
    -   You can also run individual migration scripts from the `migrations/` folder if you prefer a more granular approach.

5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

6.  **Stop dev servers cleanly:**
        We added a small helper script to stop `vite`/`node`/`npm` processes that belong to this repository.

        - Convenience (one-liner):
            ```bash
            npm run kill:dev
            ```

        - More options:
            ```bash
            # graceful stop (TERM then KILL if needed)
            bash scripts/kill-dev-servers.sh

            # force kill immediately
            bash scripts/kill-dev-servers.sh --force

            # target a specific port (default 5173)
            bash scripts/kill-dev-servers.sh --port 5173
            ```

6.  **Build for production:**
    ```bash
    npm run build
    ```
    The built files will be in the `dist` folder, ready for deployment.

## 📁 Project Structure

```
Map/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, icons, and other assets
│   ├── components/        # React components
│   │   ├── admin/         # Admin dashboard components
│   │   ├── common/        # Shared components
│   │   └── EventMap/      # Map-related components
│   ├── config/            # Configuration files
│   ├── contexts/          # React contexts for state management
│   ├── data/              # Static data files
│   ├── hooks/             # Custom React hooks
│   ├── i18n.js            # i18next configuration
│   ├── index.css          # Global styles
│   ├── lib/               # Third-party library files
│   ├── locales/           # Translation files (en.json, nl.json)
│   ├── services/          # API service functions
│   ├── styles/            # CSS stylesheets
│   ├── supabaseClient.js  # Supabase client instance
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── migrations/            # Supabase database migration scripts
├── scripts/               # Helper scripts
├── .env                   # Environment variables (not committed)
├── .gitignore            # Git ignore rules
├── jest.config.cjs       # Jest configuration
├── package.json           # Project dependencies and scripts
├── tailwind.config.cjs   # Tailwind CSS configuration
├── vite.config.js        # Vite configuration
└── README.md             # This file
```

## 🗺️ Map Features

The interactive map is built with [Leaflet](https://leafletjs.com/) and offers a rich set of features:

-   **Multiple Map Layers**: Users can switch between different map styles, such as Carto Voyager and Esri World Imagery.
-   **Custom Markers**: Different marker types for exhibitors, parking, food, and more, with custom icons and colors.
-   **Zoom Controls**: Custom zoom buttons with Material Design icons.
-   **Home Button**: A button to quickly return to the map's default view.
-   **Search Bar**: Integrated search functionality to find markers by name, booth number, or other attributes.
-   **Tooltips & Popups**: Hovering over a marker shows a tooltip with basic info, while clicking opens a detailed popup.
-   **Minimap**: A minimap in the bottom-right corner provides an overview of the entire map.
-   **Rectangle Overlays**: For exhibitor booths, a 6x6 meter rectangle can be displayed, which can be rotated and repositioned by admins.
-   **Marker Clustering**: Markers are clustered at lower zoom levels for better performance and user experience.
-   **Offline Support**: Map tiles are cached, allowing the map to be viewed offline.

## 👤 Admin Dashboard

The admin dashboard provides a comprehensive set of tools for event management:

-   **Role-Based Access Control**: Different user roles (Super Admin, System Manager, Event Manager) with varying levels of access.
-   **Dashboard**: An overview page with key statistics and quick actions.
-   **Map Management**: Add, edit, and delete markers. Drag markers to reposition them and rotate booth rectangles. Lock marker positions to prevent changes before the event.
-   **Company Management**: View, add, and edit company information, including logos, websites, and descriptions.
-   **Event Subscriptions**: Manage company registrations, including booth counts, meal preferences, and special requirements.
-   **Booth Assignments**: Assign companies to specific map markers (booths) and manage these assignments.
-   **Program Management**: Create and manage the event schedule, with support for multilingual content and drag-and-drop reordering.
-   **Category Management**: Define and manage categories for exhibitors to improve organization and filtering on the public map.
-   **Settings**: Configure organization profiles, branding, UI language, map defaults, and event-specific settings.
-   **User Management (Super Admin)**: Invite and manage other admin users, assign roles, and control access to different parts of the admin panel.
-   **Feedback & Feature Requests**: A built-in system for submitting, tracking, and managing user feedback and feature requests.
-   **Data Import/Export**: Easily bulk import or export event data using spreadsheet files or JSON.
-   **Help System**: Integrated help panel with contextual guidance, a "What's New" section, and a quick-start guide.

## 🌐 Localization

The application is built with internationalization in mind:

-   **UI Language**: The language of the admin panel and public-facing app can be changed by users and admins.
-   **Content Translation**: Event content, such as company descriptions and event schedules, can be managed in multiple languages. Currently, English and Dutch are supported.
-   **Translation Files**: All translations are stored in JSON files located in the `src/locales/` directory.
-   **i18next**: The [i18next](https://www.i18next.com/) library is used to manage translations and provide a seamless multilingual experience.

## ♿ Accessibility

The Event Map App is designed to be accessible to all users:

-   **Semantic HTML**: Uses proper HTML5 elements for better screen reader support.
-   **Keyboard Navigation**: All interactive elements are accessible via the keyboard.
-   **High-Contrast Mode**: Users can switch to a high-contrast color scheme for better visibility.
-   **Large Text Mode**: Provides an option to increase the font size for improved readability.
-   **ARIA Attributes**: Uses ARIA roles and attributes to enhance the experience for users of assistive technologies.
-   **Focus Management**: Ensures that keyboard focus is handled correctly, especially in modals and dialogs.

## 🔄 Offline Support

The application provides a degree of offline functionality:

-   **Service Worker**: A service worker (`public/service-worker.js`) caches map tiles and static assets.
-   **Marker Data**: Marker data is cached in `localStorage` and loaded when the user is offline.
-   **Offline Indicator**: A banner at the bottom of the screen indicates when the user is offline.
-   **Limited Functionality**: While offline, users can view the map and marker data but cannot make changes or perform searches that require a network connection.

## 📊 Database Schema

The application uses a PostgreSQL database managed by Supabase. The schema is defined in a series of migration scripts in the `migrations/` folder. Key tables include:

-   `companies`: Stores information about the exhibiting companies.
-   `Markers_Core`, `Markers_Appearance`, `Markers_Content`: Separates marker data into core, appearance, and content-related fields.
-   `assignments`: Links companies to specific map markers for each event year.
-   `event_subscriptions`: Manages company registrations and their specific requirements.
-   `event_activities`: Stores the event schedule and program.
-   `categories`: Defines exhibitor categories.
-   `organization_profile`: Contains general event and organization information.
-   `user_roles`: Manages user roles and permissions.

## 🔧 Configuration

-   **Vite**: The build tool and development server are configured in `vite.config.js`.
-   **Tailwind CSS**: The styling framework is configured in `tailwind.config.cjs`.
-   **ESLint & Prettier**: Code quality and formatting are enforced using ESLint and Prettier, with configurations in `.eslintrc.js` and `.prettierrc`.

## 🚀 Deployment

### GitHub Pages

The application is configured for easy deployment to GitHub Pages:

1.  **Build the application**:
    ```bash
    npm run build
    ```
2.  **Deploy to GitHub Pages**:
    ```bash
    npm run deploy
    ```
    This command will automatically build the application and deploy it to the `gh-pages` branch, which is then served by GitHub Pages.

### Other Static Hosting

The `dist` folder created by `npm run build` contains static files that can be hosted on any static web hosting service, such as Netlify, Vercel, or AWS S3.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

### Development Guidelines

-   Follow the existing code style.
-   Write tests for new features and bug fixes.
-   Update documentation as needed.
-   Run the linter and formatter before committing.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 🙏 Acknowledgments

-   [Leaflet](https://leafletjs.com/) for the excellent mapping library.
-   [Supabase](https://supabase.com/) for the powerful backend-as-a-service.
-   [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework.
-   [Vite](https://vitejs.dev/) for the fast and modern build tool.

## 📞 Contact

For questions, support, or feedback, please open an issue on GitHub or contact the development team.

---

**Note**: This is a living document and will be updated as the project evolves.
