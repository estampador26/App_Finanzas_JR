# Bitácora Técnica - FinanzasJR v3

### 26/06/2025 - 23:01 - Ajuste Visual Final Calendario Móvil

- **OBJETIVO:** Reducir el tamaño del texto "+ X más" en la vista móvil del calendario, como ajuste final para dar por cerrado el módulo.
- **ACCIÓN PREVISTA:** Se añadirá una regla para el selector `.rbc-show-more` dentro de la media query existente en `src/styles/Calendar.css`.
- **RESULTADO:** Cambio implementado y validado por el usuario. El calendario queda cerrado a nivel de desarrollo visual.

---

### 26/06/2025 - 22:58 - Ajuste Visual Calendario Móvil

- **OBJETIVO:** Reducir el tamaño de los eventos en la vista móvil del calendario para mejorar la legibilidad y evitar el amontonamiento visual, atendiendo a la solicitud del usuario.
- **ACCIÓN PREVISTA:** Se añadirá una media query específica en `src/styles/Calendar.css` para aplicar estilos más compactos (menor `font-size` y `padding`) a los elementos `.rbc-event` en pantallas pequeñas. La modificación es puramente de CSS y no presenta riesgos para la lógica de la aplicación.
- **RESULTADO:** Cambio implementado con éxito. El usuario confirma que el tamaño de los eventos en la vista móvil es ahora adecuado. La legibilidad ha mejorado sin afectar la funcionalidad.

---

### 25/06/2025 - Hito: Restauración Funcional y Visual

**Logros Principales:**

1.  **Calendario Restaurado y Mejorado:**
    - **Lógica de Vencidos:** Se implementó la detección y visualización de pagos recurrentes vencidos de meses anteriores, una función crítica que estaba ausente.
    - **Rediseño Visual:** Se aplicaron estilos personalizados (`Calendar.css`) para alinear el calendario con la UI/UX general de la aplicación, abandonando los estilos por defecto.
    - **Pop-up de Eventos:** Se rediseñó por completo el `EventPopover` para ofrecer una experiencia de usuario más rica, informativa y visualmente atractiva, incluyendo iconos y un `StatusBadge` claro.
    - **Vista Responsive:** Se creó una vista de lista (`MobileCalendarView`) para una experiencia óptima en dispositivos móviles, asegurando la usabilidad en cualquier pantalla.

2.  **Bugs Críticos Solucionados:**
    - **Actualización de Pagos del Dashboard:** Se corrigió el bug que impedía que los pagos recurrentes registrados desaparecieran de la lista de pendientes. La lógica de filtrado fue refactorizada usando un `Set` para mayor eficiencia y precisión, restaurando la confianza en los datos del dashboard.

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

---

### Fase 5: Estabilización y Refactorización del Dashboard (Fecha: 2025-06-24)

- **Entrada 52 (Diagnóstico):** Tras feedback del usuario, se confirma que la refactorización inicial del Dashboard fue incompleta. El componente `DashboardPage` fue modificado para centralizar los cálculos, pero los componentes hijos (`MonthlySummaryDashboard`, `PaymentModules`) no fueron actualizados para recibir estos datos, causando que siguieran usando su propia lógica de cálculo (errónea y estática). Esto explica por qué las métricas no se actualizaban y la clasificación de pagos fallaba.
- **Entrada 53 (Acción - `MonthlySummaryDashboard`):** Se refactoriza `MonthlySummaryDashboard.jsx` para convertirlo en un componente puramente presentacional. Se elimina toda su lógica de cálculo interna (`useMemo`). Ahora recibe una única prop `summaryData` desde `DashboardPage` y se limita a mostrar los valores pre-calculados. Esto asegura que los totales del resumen mensual son consistentes con el motor de cálculo central y se actualizan al navegar entre meses.
- **Entrada 54 (Acción - `DashboardPage`):** Se corrige la lógica de clasificación de pagos en el motor de cálculo del Dashboard. Un `if-else` defectuoso agrupaba incorrectamente todas las deudas en un solo módulo. La nueva lógica asegura que cada pago se asigne a su módulo correspondiente ('Bancos', 'Compras', 'Servicios'), solucionando el último gran bug de visualización.
- **Entrada 55 (FIX CRÍTICO - `CategoryChart`):** Se soluciona un error fatal que impedía la carga de la aplicación. El componente `CategoryChart` intentaba acceder a `viewedDate.getFullYear()` antes de que la prop `viewedDate` estuviera disponible, causando un crash. Se añade una guarda para asegurar que el código de filtrado solo se ejecute cuando `viewedDate` tenga un valor válido.

- **Entrada 47:** Se inicializa Firebase Hosting en el proyecto, configurándolo para servir los archivos desde el directorio `dist` como una Single-Page Application.
- **Entrada 48:** Se construye la aplicación para producción (`npm run build`).
- **Entrada 49:** Se despliega la aplicación a Firebase Hosting, obteniendo la URL pública: https://finanzasjrweb.web.app.

---


- **Entrada 37:** Se define una paleta de colores personalizada (primarios, neutrales, acentos) en `tailwind.config.js` para establecer una identidad visual coherente.
- **Entrada 38:** Se aplican los nuevos colores del sistema de diseño a los componentes existentes.
- **Entrada 39:** Se integra la fuente "Inter" desde Google Fonts para mejorar la legibilidad y la estética de la interfaz.
- **Entrada 40:** Se guarda el sistema de diseño base en un nuevo commit (`style: Establish design system`).

---

### Fase 6: Hito de Funcionalidad y Refinamiento (Fecha: 2025-06-25)

- **Entrada 56 (HITO CRÍTICO):** La aplicación alcanza un estado funcional clave. Se resuelve el último bug de diseño importante en el calendario (`CalendarPage.jsx`), reemplazando la barra de herramientas por defecto con un encabezado personalizado y responsivo. Esto soluciona los problemas de superposición en móviles y mejora la UX. La app es ahora estable y usable en sus módulos principales.
- **Entrada 57 (UX):** Se reordena la navegación principal para seguir un flujo de trabajo más lógico y funcional, según la solicitud del usuario (`Dashboard -> Calendario -> Pagos Recurrentes -> ...`).

---
