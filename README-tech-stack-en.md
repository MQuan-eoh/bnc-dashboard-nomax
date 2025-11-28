# IoT Energy Dashboard - Tech Stack & Development Guide

## 1. Technology Stack

This project utilizes a modern, lightweight, and high-performance stack designed for real-time IoT monitoring.

- **Core Framework**: **React 19**
  - The latest version of the most popular JavaScript library for building user interfaces.
- **Build Tool & Bundler**: **Vite (Rolldown-Vite)**
  - Next-generation frontend tooling. We are using a version powered by Rolldown for extreme performance.
- **Language**: **JavaScript (ES Modules)**
  - Standard modern JavaScript.
- **Styling**: **Native CSS3**
  - Advanced CSS features including CSS Variables, Flexbox, Grid Layout, and Backdrop Filters (Glassmorphism).
- **Linting**: **ESLint**
  - Ensures code quality and catches errors early.

---

## 2. Why this Tech Stack?

### React 19

- **Component-Based**: Perfect for a dashboard where each "Panel" (Voltage, Current, Power) is a reusable component.
- **Virtual DOM**: Efficiently updates only the numbers that change (crucial for real-time energy data) without re-rendering the entire page.
- **Ecosystem**: Massive support and libraries available if we need to add complex charts later.

### Vite (Rolldown)

- **Speed**: Instant server start and lightning-fast Hot Module Replacement (HMR). When you tweak a glass effect, you see it instantly.
- **Optimized Build**: Produces highly optimized static assets for production deployment.

### Native CSS (Glassmorphism)

- **Performance**: We avoid heavy UI frameworks (like Bootstrap or MUI) to keep the bundle size minimal.
- **Customization**: Glassmorphism relies heavily on `backdrop-filter`, `rgba` colors, and complex shadows. Writing raw CSS gives us absolute control over these visual nuances to achieve the "Industry" look.

---

## 3. Application Architecture & Data Flow

### Data Flow Strategy

The application follows React's **Unidirectional Data Flow**:

1.  **Data Source (Mock/Real)**:
    - Currently, data is defined in `App.jsx` (`const data = ...`).
    - **Future State**: Data will come from a WebSocket connection or REST API polling.
2.  **State Management**:
    - Data enters the `App` component state.
    - State updates trigger a re-render.
3.  **Component Rendering**:
    - `App` passes specific data chunks (e.g., `data.voltage`) down to child components (Panels) via **Props**.
    - Panels are "pure" presentation components; they just display what they are given.

### Visual Structure

- **`index.html`**: Entry point.
- **`main.jsx`**: Bootstraps React.
- **`App.jsx`**: Main Layout & Logic Container.
  - **Header**: Dashboard Title.
  - **Grid Container**: Responsive layout for panels.
  - **Glass Panels**: Individual data cards.

---

## 4. Development Guidelines (Clean Code & Performance)

To maintain a high-quality codebase, follow these rules:

### Where to Code?

- **Logic & State**: Keep in `src/App.jsx` (or move to a custom hook `useEnergyData.js` if it gets complex).
- **Styles**: Keep in `src/App.css`. Use specific class names (e.g., `.glass-panel`) to avoid conflicts.
- **Global Styles**: `src/index.css` is for resets and body background only.

### Clean Code Principles

1.  **Component Extraction**:
    - _Current_: All HTML is in `App.jsx`.
    - _Goal_: As the app grows, extract the "Glass Panel" into its own component: `src/components/GlassPanel.jsx`.
    - _Rule_: If you copy-paste code more than twice, make it a component.
2.  **Naming Conventions**:
    - Variables: `camelCase` (e.g., `voltageValue`).
    - Components: `PascalCase` (e.g., `EnergyPanel`).
    - CSS Classes: `kebab-case` (e.g., `dashboard-container`).

### Performance Optimization

1.  **CSS Animations**:
    - ALWAYS use `transform` and `opacity` for animations (like the hover effect).
    - NEVER animate `top`, `left`, `width`, or `height` as they trigger layout recalculations (slow).
2.  **Re-renders**:
    - Ensure `key` props in lists are unique and stable.
    - Use `React.memo` for panels that don't update frequently.
3.  **Glassmorphism Cost**:
    - `backdrop-filter: blur()` is GPU intensive. Use it only on the main panels, not on every tiny element inside them.

---

## 5. Future Scalability

- **State Management**: If we add multiple dashboards, consider **Zustand** or **Redux Toolkit**.
- **Data Fetching**: Use **TanStack Query (React Query)** for API caching and state handling.
