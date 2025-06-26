# Bitácora Técnica - FinanzasJR v3

Este documento registra cronológicamente las decisiones técnicas, los pasos de desarrollo y los hitos importantes en la reconstrucción de la aplicación FinanzasJR.

---

### Fase 1: Fundación del Proyecto (Fecha: 2025-06-23)

- **Entrada 1-5:** Se decide crear un nuevo proyecto (`AppFinanzasJR-v3`) para evitar conflictos con el código legado. Se inicializa un proyecto Vite + React.
- **Entrada 6-9:** Se instala y configura Tailwind CSS v4, incluyendo la creación manual de archivos de configuración iniciales debido a problemas con `npx`.
- **Entrada 10-14:** Se integra el SDK de Firebase. La configuración se externaliza a un archivo `.env.local` (ignorado por Git) para proteger las claves de API.
- **Entrada 15-17:** Se limpia la plantilla por defecto de Vite y se verifica que la configuración de Tailwind funciona correctamente mostrando un componente de prueba.
- **Entrada 18-20:** Se resuelve un problema de compatibilidad con PostCSS migrando a la configuración moderna de Tailwind v4 con el plugin `@tailwindcss/vite`, eliminando la necesidad de `postcss.config.js`.
- **Entrada 21-23:** Se inicializa un repositorio de Git y se realiza el primer commit (`feat: Initial project setup...`), estableciendo una línea base segura para el proyecto.

---

### Fase 2: Autenticación (Fecha: 2025-06-23)

- **Entrada 24-25:** Se crea una estructura de carpetas profesional (`src/components`, `src/pages`). Se crea el componente `LoginPage.jsx`.
- **Entrada 26:** Se implementa la funcionalidad de inicio de sesión con Google a través de Firebase Authentication.
- **Entrada 27-32:** Se soluciona un bug visual con el icono de Google instalando y utilizando la librería `react-icons`.
- **Entrada 33:** Se crea un componente `DashboardPage.jsx` como marcador de posición para usuarios autenticados.
- **Entrada 34:** Se implementa un listener de estado de autenticación (`onAuthStateChanged`) en el componente principal `App.jsx` para gestionar la sesión del usuario y renderizar condicionalmente `LoginPage` o `DashboardPage`.
- **Entrada 35:** Se implementa la funcionalidad de cierre de sesión en el `DashboardPage`.
- **Entrada 36:** Se guarda el flujo de autenticación completo en un nuevo commit (`feat: Implement full authentication flow`).

---

### Fase 3: Sistema de Diseño (Fecha: 2025-06-23)

- **Entrada 42-46:** Se crea y se integra un componente `Layout` reutilizable para definir la estructura de las páginas autenticadas, incluyendo una barra de navegación y un menú de usuario con la funcionalidad de cierre de sesión centralizada. Se guarda en el commit (`feat: Create and integrate main Layout component`).

---

### Fase 4: Despliegue y QA (Fecha: 2025-06-23)

- **Entrada 47:** Se inicializa Firebase Hosting en el proyecto, configurándolo para servir los archivos desde el directorio `dist` como una Single-Page Application.
- **Entrada 48:** Se construye la aplicación para producción (`npm run build`).
- **Entrada 49:** Se despliega la aplicación a Firebase Hosting, obteniendo la URL pública: https://finanzasjrweb.web.app.

---


- **Entrada 37:** Se define una paleta de colores personalizada (primarios, neutrales, acentos) en `tailwind.config.js` para establecer una identidad visual coherente.
- **Entrada 38:** Se aplican los nuevos colores del sistema de diseño a los componentes existentes.
- **Entrada 39:** Se integra la fuente "Inter" desde Google Fonts para mejorar la legibilidad y la estética de la interfaz.
- **Entrada 40:** Se guarda el sistema de diseño base en un nuevo commit (`style: Establish design system`).

---
