# Visor BIM 3D — Mirador & Centro de Interpretación

Visor web arquitectónico e interactivo **BIM (Building Information Modeling)** de alto rendimiento, optimizado para visualización en tiempo real, análisis estructural y presentación ante jurados.

Desarrollado con **Three.js** y **Vite**, 100% compatible con **Vercel** y preparado para cargar modelos 3D locales o remotos (mediante enlace o GitHub Releases).

---

## 🚀 Características del Visor BIM

### 1. Visualización y Carga de Modelos
- **Carga Automática**: Al ingresar a la web, carga el modelo optimizado por defecto o cualquier modelo pasado por URL (`?model=...`).
- **🔗 Carga por URL / Repositorio**: Botón en cabecera para pegar cualquier enlace directo a archivos `.GLB`, `.GLTF`, `.FBX` u `.OBJ`.
- **Compartir con el Jurado**: Genera automáticamente enlaces únicos con el modelo cargado para compartir por WhatsApp, correo o código QR.
- **Soporte Drag & Drop**: Arrastrá cualquier archivo `.fbx`, `.glb`, `.gltf` u `.obj` directamente a la ventana del navegador.

### 2. Árbol BIM y Clasificación por Disciplinas
- Clasificación de los componentes en grupos constructivos:
  - **Estructura Portante** (Columnas, Vigas, Mástil, Cerchas, Placas, Pernos).
  - **Cimentación & Apoyos** (Dados de hormigón y zapatas).
  - **Circulación Peatonal** (Rampa helicoidal, Desembarcos, Pavimento continuo, Zócalos).
  - **Miradores & Observatorios** (Miradores 01 al 10, Galería central, Coronación vórtice).
  - **Cerramientos & Seguridad** (Paneles perforados, Marcos, Juntas, Pasamanos, Montantes de baranda).
  - **Instalaciones & Señalética** (Canales LED, Tiras LED cian, Rótulo, Flechas, Emblema).
  - **Entorno & Paisajismo** (Terreno topográfico, Senderos peatonales).
- **Buscador Dinámico**: Filtrado instantáneo por texto.
- **Controles de Visibilidad**: Ocultar/mostrar por elemento y por disciplina (👁).

### 3. Inspector de Propiedades BIM
- Selección al hacer clic sobre cualquier pieza 3D o en el árbol con halo emisivo.
- Métricas métricas: Dimensiones (X × Y × Z en metros), Cota de nivel base (+Z m), Triángulos, Vértices, Material y Centroide.
- Acciones rápidas: **🎯 Enfocar** (centrar cámara) y **⚡ Aislar** (ocultar el resto).

### 4. Herramientas de Análisis BIM
- **✂ Plano de Corte BIM**: Secciones en ejes Z (Planta), X (Longitudinal) e Y (Transversal) con control deslizante en metros e inversión de corte.
- **📏 Cinta Métrica / Medición 3D**: Clic en dos puntos sobre el modelo para medir cotas exactas en metros con línea 3D.
- **💥 Despiece Explosionado**: Slider de 0% a 100% para separar componentes radial y verticalmente.
- **☀️ Simulación Solar & Modo Noche**: Control de luz solar y modo nocturno con brillo emisivo cian en los canales LED.

### 5. Modos de Representación (Shading)
- **🎨 Realista (PBR)**: Materiales originales y sombras suaves.
- **🏛 Maqueta Arquitectónica Blanca (Clay)**: Yeso monocromático arquitectónico con oclusión ambiental.
- **🏷 Colores por Categoría**: Diferenciación cromática por disciplina técnica.
- **◇ Wireframe**: Alambre estructural.

---

## 🌐 Despliegue en Vercel (Paso a Paso)

El proyecto está configurado y optimizado para que el repositorio pese **menos de 1 MB** (sin exceder el límite de 100 MB de GitHub/Vercel).

### Paso 1: Subir el código a GitHub
En tu terminal:
```bash
# Si aún no vinculaste tu repositorio remoto:
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar a Vercel
1. Entra en [vercel.com/new](https://vercel.com/new).
2. Conecta tu cuenta de GitHub y selecciona el repositorio.
3. Vercel detectará **Vite** automáticamente. Haz clic en **Deploy**.
4. ¡En 20 segundos tendrás tu enlace oficial `https://tu-visor.vercel.app`!

---

## 📦 Conectar el Modelo 3D al Visor en Vercel

Como los modelos 3D complejos pesan más de 100 MB, la forma recomendada y estándar es alojar el archivo en un almacenamiento gratuito y conectarlo al visor:

### Opción A (La más fácil): Subirlo a GitHub Releases (Hasta 2 GB gratis)
1. En tu repositorio de GitHub, ve a la sección **Releases** (a la derecha) -> **Draft a new release**.
2. Pon una versión (ej. `v1.0`).
3. Adjunta tu archivo `paravisor_rapido.glb` (ubicado en la carpeta `modelo-rapido\`).
4. Haz clic en **Publish release**.
5. Copia el enlace directo de descarga del archivo `.glb`.
6. En tu visor de Vercel, haz clic en **"🔗 Cargar URL"**, pega el enlace y haz clic en **Cargar Modelo**.
7. Haz clic en **"Copiar Enlace con Modelo"**: obtendrás una URL como:
   `https://tu-visor.vercel.app/?model=https://github.com/.../releases/download/.../paravisor_rapido.glb`
8. ¡Cualquiera que abra esa URL (o escanee el QR) verá el modelo cargado de inmediato!

### Opción B: Cloudflare R2 / Supabase Storage / Google Drive
Puedes subir `paravisor_rapido.glb` a cualquier servicio con soporte HTTPS público y pasarlo por el parámetro `?model=URL`.

---

## 💻 Ejecución en Red Local (Presentación en Vivo)

Para presentar en vivo sin internet o en una red cerrada:
```bash
npm run build
npm run preview -- --host
```
Accede desde:
- Tu PC: `http://localhost:4173/`
- Móviles / Jurado en la misma red: `http://<TU_IP_LOCAL>:4173/`
