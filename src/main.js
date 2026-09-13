// ─── Visor BIM 3D — main.js ──────────────────────────────────────────
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader }     from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader }     from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader }     from 'three/addons/loaders/MTLLoader.js';
import QRCode            from 'qrcode';

// ── DOM References ──────────────────────────────────────────────────
const canvas           = document.getElementById('canvas3d');
const viewerWrap       = document.getElementById('viewer-wrap');
const loading          = document.getElementById('loading');
const loadingText      = document.getElementById('loading-text');
const progressFill     = document.getElementById('progress-fill');
const toast            = document.getElementById('toast');
const sidebar          = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const statsSummary     = document.getElementById('stats-summary');
const searchInput      = document.getElementById('search-input');
const btnClearSearch   = document.getElementById('btn-clear-search');
const treeContainer    = document.getElementById('tree-container');
const treeCount        = document.getElementById('tree-count');
const materialsCont    = document.getElementById('materials-container');
const dropZone         = document.getElementById('drop-zone');
const fileInput        = document.getElementById('file-input');

// Inspector DOM
const inspName         = document.getElementById('insp-name');
const inspCategory     = document.getElementById('insp-category');
const inspMaterial     = document.getElementById('insp-material');
const inspDimensions   = document.getElementById('insp-dimensions');
const inspElevation    = document.getElementById('insp-elevation');
const inspTriangles    = document.getElementById('insp-triangles');
const inspPos          = document.getElementById('insp-pos');
const btnInspFocus     = document.getElementById('btn-insp-focus');
const btnInspIsolate   = document.getElementById('btn-insp-isolate');
const projTotalObjs    = document.getElementById('proj-total-objs');
const projTotalFaces   = document.getElementById('proj-total-faces');
const projTotalMats    = document.getElementById('proj-total-mats');
const projFootprint    = document.getElementById('proj-footprint');

// Tools DOM
const sectionEnable    = document.getElementById('section-enable');
const sectionSlider    = document.getElementById('section-slider');
const sectionVal       = document.getElementById('section-val');
const sectionInvert    = document.getElementById('section-invert');
const explodeSlider    = document.getElementById('explode-slider');
const explodeVal       = document.getElementById('explode-val');
const sunSlider        = document.getElementById('sun-slider');
const sunVal           = document.getElementById('sun-val');

// Measurement DOM
const measureInfo      = document.getElementById('measure-info');
const measureText      = document.getElementById('measure-text');
const measureDist      = document.getElementById('measure-dist');
const btnClearMeasure  = document.getElementById('btn-clear-measure');

// QR Modal DOM
const qrModal          = document.getElementById('qr-modal');
const btnOpenQr        = document.getElementById('btn-open-qr');
const btnCloseQr       = document.getElementById('btn-close-qr');
const qrCanvasWrap     = document.getElementById('qr-canvas-wrap');
const modalUrl         = document.getElementById('modal-url');
const btnCopyUrl       = document.getElementById('btn-copy-url');

// URL Modal DOM
const urlModal         = document.getElementById('url-modal');
const btnOpenUrl       = document.getElementById('btn-open-url');
const btnCloseUrl      = document.getElementById('btn-close-url');
const remoteModelUrl   = document.getElementById('remote-model-url');
const btnLoadRemote    = document.getElementById('btn-load-remote');
const shareModelUrl    = document.getElementById('share-model-url');
const btnCopyShareUrl  = document.getElementById('btn-copy-share-url');

// Top / Dock buttons
const btnFullscreen    = document.getElementById('btn-fullscreen');
const dockFit          = document.getElementById('dock-fit');
const dockModePbr      = document.getElementById('dock-mode-pbr');
const dockModeClay     = document.getElementById('dock-mode-clay');
const dockModeCat      = document.getElementById('dock-mode-cat');
const dockModeWire     = document.getElementById('dock-mode-wire');
const dockSection      = document.getElementById('dock-section');
const dockMeasure      = document.getElementById('dock-measure');
const dockGrid         = document.getElementById('dock-grid');
const dockScreenshot   = document.getElementById('dock-screenshot');
const dockQr           = document.getElementById('dock-qr');

// ── 3D Scene Initialization ─────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090d16);

const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 5000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.localClippingEnabled = true;

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 0.5;
controls.maxDistance = 2500;
controls.target.set(0, 5, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xdce7f5, 0.65);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
sunLight.position.set(60, 100, 70);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 800;
sunLight.shadow.bias = -0.0004;
const d = 120;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.45);
fillLight.position.set(-60, 30, -50);
scene.add(fillLight);

// Helpers
const gridHelper = new THREE.GridHelper(160, 60, 0x334155, 0x1e293b);
gridHelper.position.y = -0.02;
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(25);
axesHelper.visible = false;
scene.add(axesHelper);

// ── State Variables ──────────────────────────────────────────────────
let modelRoot = null;
let modelBBox = new THREE.Box3();
let modelCenter = new THREE.Vector3();
let modelSize = new THREE.Vector3();

// Elements and Hierarchy
let bimElements = []; // { id, name, category, mesh, originalMaterial, originalPos, color }
let categoriesMap = new Map(); // name -> { label, color, elements: [] }
let materialsMap = new Map(); // matName -> { elements: [] }
let selectedElement = null;

// Display Modes
let currentShadingMode = 'pbr'; // 'pbr', 'clay', 'category', 'wire'

// Section Plane
let sectionAxis = 'Z';
let sectionPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
let sectionActive = false;
let sectionInverted = false;

// Measurement Tool
let measureMode = false;
let measurePoints = [];
let measureLineObj = null;
let measureMarkers = [];

// Explode Mode
let explodeFactor = 0;

// Camera Animation
let cameraAnimating = false;
let camStartPos = new THREE.Vector3(), camTargetPos = new THREE.Vector3();
let camStartLook = new THREE.Vector3(), camTargetLook = new THREE.Vector3();
let camAnimProgress = 0;

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Materials for Shading Modes
const clayMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.85,
  metalness: 0.05,
  clippingPlanes: [],
  clipShadows: true,
});

const highlightMaterial = new THREE.MeshStandardMaterial({
  color: 0x3b82f6,
  emissive: 0x2563eb,
  emissiveIntensity: 0.6,
  roughness: 0.3,
  metalness: 0.2,
  transparent: true,
  opacity: 0.85,
  clippingPlanes: [],
});

// Category Color Palette & Definitions
const CATEGORY_DEFS = [
  { key: 'estructura', label: 'Estructura Portante', color: '#3b82f6', patterns: ['columna', 'viga', 'mastil', 'cercha', 'placa', 'perno', 'metalic', 'apoyo'] },
  { key: 'cimentacion', label: 'Cimentación & Dados', color: '#64748b', patterns: ['dado', 'hormigon', 'cimiento', 'base'] },
  { key: 'circulacion', label: 'Rampas & Circulación', color: '#10b981', patterns: ['rampa', 'desembarco', 'pavimento', 'canto', 'zocalo', 'circulacion'] },
  { key: 'miradores', label: 'Miradores & Terrazas', color: '#f59e0b', patterns: ['mirador', 'galeria', 'vortice', 'coronacion'] },
  { key: 'cerramientos', label: 'Cerramientos & Barandas', color: '#8b5cf6', patterns: ['panel', 'marco', 'junta', 'baranda', 'pasamano', 'montante'] },
  { key: 'iluminacion', label: 'Instalaciones & Iluminación LED', color: '#06b6d4', patterns: ['led', 'canal', 'rotulo', 'flecha', 'emblema', 'cartel'] },
  { key: 'terreno', label: 'Entorno & Terreno', color: '#84cc16', patterns: ['terreno', 'sendero', 'borde', 'implantacion'] },
  { key: 'otros', label: 'Otros Componentes', color: '#94a3b8', patterns: [] },
];

// ── Helpers ──────────────────────────────────────────────────────────
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function updateLoading(percent, text) {
  loading.classList.remove('hidden');
  progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (text) loadingText.textContent = text;
  if (percent >= 100) {
    setTimeout(() => loading.classList.add('hidden'), 400);
  }
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function countTriangles(obj) {
  let count = 0;
  obj.traverse(c => {
    if (c.isMesh && c.geometry) {
      count += c.geometry.index ? c.geometry.index.count / 3 : (c.geometry.attributes.position?.count || 0) / 3;
    }
  });
  return Math.round(count);
}

function classifyObject(name, matName) {
  const text = `${name} ${matName}`.toLowerCase();
  for (const cat of CATEGORY_DEFS) {
    if (cat.patterns.some(p => text.includes(p))) {
      return cat;
    }
  }
  return CATEGORY_DEFS[CATEGORY_DEFS.length - 1]; // 'otros'
}

// ── Model Setup & Parsing ────────────────────────────────────────────
function setupLoadedModel(root, modelName = 'Modelo BIM') {
  if (modelRoot) {
    scene.remove(modelRoot);
    modelRoot = null;
  }
  modelRoot = root;
  scene.add(modelRoot);

  // Calculate bounding box
  modelBBox.setFromObject(modelRoot);
  modelBBox.getCenter(modelCenter);
  modelBBox.getSize(modelSize);

  // Center model at origin if far away
  modelRoot.position.sub(new THREE.Vector3(modelCenter.x, modelBBox.min.y, modelCenter.z));
  modelBBox.setFromObject(modelRoot);
  modelBBox.getCenter(modelCenter);
  modelBBox.getSize(modelSize);

  // Reset collections
  bimElements = [];
  categoriesMap.clear();
  materialsMap.clear();
  CATEGORY_DEFS.forEach(c => categoriesMap.set(c.key, { ...c, elements: [] }));

  let totalTriangles = 0;
  let elemIndex = 0;

  // Traverse all meshes
  modelRoot.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Extract material name
      let matName = 'Estándar';
      if (child.material) {
        if (Array.isArray(child.material)) {
          matName = child.material[0]?.name || 'Múltiple';
        } else {
          matName = child.material.name || 'Estándar';
        }
      }

      // Ensure clipping planes applied to material
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m => {
        if (m) {
          m.clippingPlanes = sectionActive ? [sectionPlane] : [];
          m.clipShadows = true;
          // Special emissive boost for LED materials
          if (m.name && m.name.toLowerCase().includes('led')) {
            m.emissive = new THREE.Color(0x06b6d4);
            m.emissiveIntensity = 0.8;
          }
        }
      });

      const cleanName = (child.name || `Elemento_${elemIndex + 1}`)
        .replace(/^BIM_/, '')
        .replace(/_/g, ' ');

      const category = classifyObject(cleanName, matName);
      const tris = countTriangles(child);
      totalTriangles += tris;

      const elem = {
        id: `elem-${elemIndex++}`,
        name: cleanName,
        category: category,
        matName: matName,
        mesh: child,
        originalMaterial: child.material,
        originalPos: child.position.clone(),
        visible: true,
        triangles: tris,
      };

      bimElements.push(elem);
      categoriesMap.get(category.key).elements.push(elem);

      if (!materialsMap.has(matName)) {
        materialsMap.set(matName, { name: matName, elements: [] });
      }
      materialsMap.get(matName).elements.push(elem);
    }
  });

  // Fit camera & grid
  fitCameraToModel();
  updateSectionPlaneBounds();

  // Populate UI
  buildBimTree();
  buildMaterialsList();
  updateProjectSummary(totalTriangles);

  statsSummary.textContent = `${formatNum(bimElements.length)} elem. · ${formatNum(totalTriangles)} △`;
  showToast(`✅ ${modelName} cargado exitosamente`);
}

function fitCameraToModel() {
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 50;
  const dist = maxDim * 1.6;

  animateCameraTo(
    new THREE.Vector3(modelCenter.x + dist * 0.7, modelCenter.y + dist * 0.5, modelCenter.z + dist * 0.9),
    modelCenter.clone()
  );

  camera.near = Math.max(0.1, maxDim * 0.001);
  camera.far = maxDim * 50;
  camera.updateProjectionMatrix();

  gridHelper.scale.setScalar(Math.max(1, maxDim / 60));
  gridHelper.position.y = modelBBox.min.y - 0.05;
}

function updateProjectSummary(totalTris) {
  projTotalObjs.textContent = formatNum(bimElements.length);
  projTotalFaces.textContent = formatNum(totalTris);
  projTotalMats.textContent = materialsMap.size.toString();
  projFootprint.textContent = `${modelSize.x.toFixed(1)} × ${modelSize.z.toFixed(1)} m (Alto: ${modelSize.y.toFixed(1)} m)`;
  treeCount.textContent = `${formatNum(bimElements.length)} componentes`;
}

// ── Tree & UI Generation ─────────────────────────────────────────────
function buildBimTree(filterText = '') {
  treeContainer.innerHTML = '';
  const filter = filterText.trim().toLowerCase();

  categoriesMap.forEach(cat => {
    const matchingElems = filter
      ? cat.elements.filter(e => e.name.toLowerCase().includes(filter) || e.matName.toLowerCase().includes(filter))
      : cat.elements;

    if (matchingElems.length === 0) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'category-group open';
    groupEl.dataset.key = cat.key;

    // Header
    const allVis = matchingElems.every(e => e.visible);
    groupEl.innerHTML = `
      <div class="category-header">
        <span class="arrow">▶</span>
        <span class="color-tag" style="background:${cat.color}"></span>
        <span class="title">${cat.label}</span>
        <span class="count">${matchingElems.length}</span>
        <button class="btn-vis ${allVis ? '' : 'off'}" title="Ocultar / Mostrar grupo">👁</button>
      </div>
      <div class="category-items"></div>
    `;

    const itemsCont = groupEl.querySelector('.category-items');
    const header = groupEl.querySelector('.category-header');
    const groupVisBtn = groupEl.querySelector('.btn-vis');

    // Toggle collapse
    header.addEventListener('click', e => {
      if (e.target.closest('.btn-vis')) return;
      groupEl.classList.toggle('open');
    });

    // Toggle group visibility
    groupVisBtn.addEventListener('click', e => {
      e.stopPropagation();
      const currentVis = !groupVisBtn.classList.contains('off');
      const newVis = !currentVis;
      matchingElems.forEach(elem => {
        elem.visible = newVis;
        elem.mesh.visible = newVis;
      });
      groupVisBtn.classList.toggle('off', !newVis);
      itemsCont.querySelectorAll('.node-vis').forEach(nv => nv.classList.toggle('off', !newVis));
    });

    // Individual elements
    matchingElems.forEach(elem => {
      const nodeEl = document.createElement('div');
      nodeEl.className = `tree-node ${selectedElement === elem ? 'selected' : ''}`;
      nodeEl.dataset.id = elem.id;
      nodeEl.innerHTML = `
        <span class="node-name" title="${elem.name}">${elem.name}</span>
        <span class="node-tri">${formatNum(elem.triangles)}△</span>
        <span class="node-vis ${elem.visible ? '' : 'off'}" title="Visibilidad">👁</span>
      `;

      const visBtn = nodeEl.querySelector('.node-vis');
      visBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        elem.visible = !elem.visible;
        elem.mesh.visible = elem.visible;
        visBtn.classList.toggle('off', !elem.visible);
        if (!elem.visible && selectedElement === elem) deselectElement();
      });

      nodeEl.addEventListener('click', () => selectElement(elem));
      itemsCont.appendChild(nodeEl);
    });

    treeContainer.appendChild(groupEl);
  });
}

function buildMaterialsList() {
  materialsCont.innerHTML = '';
  materialsMap.forEach(mat => {
    const el = document.createElement('div');
    el.className = 'category-group open';
    el.innerHTML = `
      <div class="category-header">
        <span class="color-tag" style="background:#38bdf8"></span>
        <span class="title">${mat.name}</span>
        <span class="count">${mat.elements.length}</span>
        <button class="btn-vis" title="Visibilidad">👁</button>
      </div>
    `;

    const visBtn = el.querySelector('.btn-vis');
    visBtn.addEventListener('click', () => {
      const isOff = visBtn.classList.toggle('off');
      mat.elements.forEach(e => {
        e.visible = !isOff;
        e.mesh.visible = !isOff;
      });
    });

    materialsCont.appendChild(el);
  });
}

// ── Inspector & Selection ────────────────────────────────────────────
function selectElement(elem) {
  if (selectedElement === elem) return;
  deselectElement();

  selectedElement = elem;
  elem.mesh.material = highlightMaterial;

  // Highlight in tree
  treeContainer.querySelectorAll('.tree-node').forEach(node => {
    node.classList.toggle('selected', node.dataset.id === elem.id);
  });

  // Calculate bounding box for this element
  const box = new THREE.Box3().setFromObject(elem.mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Fill inspector
  inspName.textContent = elem.name;
  inspCategory.textContent = elem.category.label;
  inspMaterial.textContent = elem.matName;
  inspDimensions.textContent = `${size.x.toFixed(2)} × ${size.z.toFixed(2)} × ${size.y.toFixed(2)} m`;
  inspElevation.textContent = `+${box.min.y.toFixed(2)} m`;
  inspTriangles.textContent = formatNum(elem.triangles);
  inspPos.textContent = `${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)}`;

  // Switch to inspector tab automatically
  document.querySelector('.tab-btn[data-tab="inspector"]').click();
}

function deselectElement() {
  if (!selectedElement) return;
  applyShadingToMesh(selectedElement);
  selectedElement = null;
  treeContainer.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
  inspName.textContent = 'Ninguno';
  inspCategory.textContent = '—';
  inspMaterial.textContent = '—';
  inspDimensions.textContent = '—';
  inspElevation.textContent = '—';
  inspTriangles.textContent = '—';
  inspPos.textContent = '—';
}

function applyShadingToMesh(elem) {
  if (currentShadingMode === 'clay') {
    elem.mesh.material = clayMaterial;
  } else if (currentShadingMode === 'category') {
    const catMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(elem.category.color),
      roughness: 0.6,
      metalness: 0.1,
      clippingPlanes: sectionActive ? [sectionPlane] : [],
    });
    elem.mesh.material = catMat;
  } else if (currentShadingMode === 'wire') {
    elem.mesh.material = elem.originalMaterial;
    if (elem.mesh.material) {
      if (Array.isArray(elem.mesh.material)) elem.mesh.material.forEach(m => m.wireframe = true);
      else elem.mesh.material.wireframe = true;
    }
  } else {
    // PBR Realista
    elem.mesh.material = elem.originalMaterial;
    if (elem.mesh.material) {
      if (Array.isArray(elem.mesh.material)) elem.mesh.material.forEach(m => m.wireframe = false);
      else elem.mesh.material.wireframe = false;
    }
  }
}

function setShadingMode(mode) {
  currentShadingMode = mode;
  [dockModePbr, dockModeClay, dockModeCat, dockModeWire].forEach(b => b.classList.remove('active'));

  if (mode === 'pbr') dockModePbr.classList.add('active');
  if (mode === 'clay') dockModeClay.classList.add('active');
  if (mode === 'cat') dockModeCat.classList.add('active');
  if (mode === 'wire') dockModeWire.classList.add('active');

  bimElements.forEach(elem => {
    if (elem !== selectedElement) {
      applyShadingToMesh(elem);
    }
  });

  showToast(`Modo visual: ${mode.toUpperCase()}`);
}

// ── Section Plane ────────────────────────────────────────────────────
function updateSectionPlaneBounds() {
  if (sectionAxis === 'Z') {
    sectionSlider.min = Math.floor(modelBBox.min.y);
    sectionSlider.max = Math.ceil(modelBBox.max.y);
    sectionSlider.value = Math.round(modelCenter.y);
  } else if (sectionAxis === 'X') {
    sectionSlider.min = Math.floor(modelBBox.min.x);
    sectionSlider.max = Math.ceil(modelBBox.max.x);
    sectionSlider.value = Math.round(modelCenter.x);
  } else {
    sectionSlider.min = Math.floor(modelBBox.min.z);
    sectionSlider.max = Math.ceil(modelBBox.max.z);
    sectionSlider.value = Math.round(modelCenter.z);
  }
  updateSectionPlane();
}

function updateSectionPlane() {
  const val = parseFloat(sectionSlider.value);
  sectionVal.textContent = `${val.toFixed(1)} m`;

  let normal = new THREE.Vector3(0, -1, 0);
  if (sectionAxis === 'X') normal.set(-1, 0, 0);
  if (sectionAxis === 'Y') normal.set(0, 0, -1);

  if (sectionInverted) normal.negate();

  sectionPlane.normal.copy(normal);
  sectionPlane.constant = sectionInverted ? -val : val;

  const activePlanes = sectionActive ? [sectionPlane] : [];
  renderer.clippingPlanes = activePlanes;
  clayMaterial.clippingPlanes = activePlanes;
  highlightMaterial.clippingPlanes = activePlanes;

  bimElements.forEach(elem => {
    const mats = Array.isArray(elem.mesh.material) ? elem.mesh.material : [elem.mesh.material];
    mats.forEach(m => { if (m) m.clippingPlanes = activePlanes; });
  });
}

sectionEnable.addEventListener('change', e => {
  sectionActive = e.target.checked;
  dockSection.classList.toggle('active', sectionActive);
  updateSectionPlane();
  showToast(sectionActive ? 'Plano de corte activado' : 'Plano de corte desactivado');
});

sectionSlider.addEventListener('input', updateSectionPlane);
sectionInvert.addEventListener('change', e => {
  sectionInverted = e.target.checked;
  updateSectionPlane();
});

document.querySelectorAll('.axis-btn[data-axis]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.axis-btn[data-axis]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sectionAxis = btn.dataset.axis;
    updateSectionPlaneBounds();
  });
});

// ── Exploded View ────────────────────────────────────────────────────
explodeSlider.addEventListener('input', e => {
  explodeFactor = parseFloat(e.target.value) / 100;
  explodeVal.textContent = `${e.target.value}%`;

  bimElements.forEach(elem => {
    const mesh = elem.mesh;
    const offsetDir = elem.originalPos.clone().sub(modelCenter);
    offsetDir.y *= 2.0; // Expand height more for architectural clarity
    mesh.position.copy(elem.originalPos).addScaledVector(offsetDir, explodeFactor * 0.8);
  });
});

// ── Lighting & Environment Simulation ────────────────────────────────
sunSlider.addEventListener('input', e => {
  const angle = (parseFloat(e.target.value) * Math.PI) / 180;
  const radius = 100;
  sunLight.position.x = Math.cos(angle) * radius;
  sunLight.position.z = Math.sin(angle) * radius;
  sunVal.textContent = `${Math.round((e.target.value / 360) * 24)}:00`;
});

document.querySelectorAll('.axis-btn[data-light]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.axis-btn[data-light]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.light;

    if (mode === 'day') {
      scene.background.set(0x090d16);
      ambientLight.color.set(0xdce7f5);
      ambientLight.intensity = 0.65;
      sunLight.color.set(0xfffaed);
      sunLight.intensity = 1.4;
      sunLight.position.set(60, 100, 70);
    } else if (mode === 'sunset') {
      scene.background.set(0x160e1b);
      ambientLight.color.set(0xfca5a5);
      ambientLight.intensity = 0.5;
      sunLight.color.set(0xf97316);
      sunLight.intensity = 1.6;
      sunLight.position.set(120, 20, 40);
    } else if (mode === 'night') {
      scene.background.set(0x030712);
      ambientLight.color.set(0x1e293b);
      ambientLight.intensity = 0.3;
      sunLight.color.set(0x38bdf8);
      sunLight.intensity = 0.4;
      sunLight.position.set(-40, 60, -30);
      showToast('🌙 Modo Nocturno con iluminación LED');
    }
  });
});

// ── 3D Measurement Tool ──────────────────────────────────────────────
function toggleMeasureMode() {
  measureMode = !measureMode;
  dockMeasure.classList.toggle('active', measureMode);
  measureInfo.classList.toggle('visible', measureMode);
  clearMeasurements();

  if (measureMode) {
    measureText.textContent = 'Hacé clic en el primer punto...';
    measureDist.style.display = 'none';
    showToast('Modo medición activado');
  } else {
    showToast('Modo medición desactivado');
  }
}

function clearMeasurements() {
  measurePoints = [];
  measureMarkers.forEach(m => scene.remove(m));
  measureMarkers = [];
  if (measureLineObj) {
    scene.remove(measureLineObj);
    measureLineObj = null;
  }
  measureText.textContent = 'Hacé clic en el primer punto...';
  measureDist.style.display = 'none';
}

btnClearMeasure.addEventListener('click', clearMeasurements);

// ── Camera Animation (Smooth Fly-to) ─────────────────────────────────
function animateCameraTo(targetPosition, targetLookAt, duration = 1000) {
  camStartPos.copy(camera.position);
  camTargetPos.copy(targetPosition);
  camStartLook.copy(controls.target);
  camTargetLook.copy(targetLookAt);
  camAnimProgress = 0;
  cameraAnimating = true;
}

// Camera Presets
function setCameraPreset(view) {
  document.querySelectorAll('.view-chip').forEach(c => c.classList.toggle('active', c.dataset.view === view));
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 60;
  const dist = maxDim * 1.5;

  let pos = new THREE.Vector3();
  if (view === 'iso')   pos.set(modelCenter.x + dist * 0.7, modelCenter.y + dist * 0.6, modelCenter.z + dist * 0.9);
  if (view === 'top')   pos.set(modelCenter.x, modelCenter.y + dist * 1.8, modelCenter.z + 0.001);
  if (view === 'front') pos.set(modelCenter.x, modelCenter.y + dist * 0.2, modelCenter.z + dist * 1.6);
  if (view === 'side')  pos.set(modelCenter.x + dist * 1.6, modelCenter.y + dist * 0.2, modelCenter.z);
  if (view === 'back')  pos.set(modelCenter.x, modelCenter.y + dist * 0.2, modelCenter.z - dist * 1.6);

  animateCameraTo(pos, modelCenter);
}

document.querySelectorAll('.view-chip').forEach(btn => {
  btn.addEventListener('click', () => setCameraPreset(btn.dataset.view));
});

// ── Raycasting Click & Select ─────────────────────────────────────────
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0) return; // Only left click

  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (!modelRoot) return;

  const hits = raycaster.intersectObjects(modelRoot.children, true);
  if (hits.length > 0) {
    const hit = hits[0];

    // Measurement tool interaction
    if (measureMode) {
      if (measurePoints.length === 0) {
        measurePoints.push(hit.point.clone());
        const marker = createPointMarker(hit.point, 0xef4444);
        measureMarkers.push(marker);
        scene.add(marker);
        measureText.textContent = 'Hacé clic en el segundo punto...';
      } else if (measurePoints.length === 1) {
        measurePoints.push(hit.point.clone());
        const marker = createPointMarker(hit.point, 0x10b981);
        measureMarkers.push(marker);
        scene.add(marker);

        const dist = measurePoints[0].distanceTo(measurePoints[1]);
        measureDist.textContent = `${dist.toFixed(2)} m`;
        measureDist.style.display = 'inline-block';
        measureText.textContent = `Distancia:`;

        // Draw line
        const geom = new THREE.BufferGeometry().setFromPoints(measurePoints);
        const mat = new THREE.LineDashedMaterial({ color: 0x3b82f6, dashSize: 0.5, gapSize: 0.2, linewidth: 2 });
        measureLineObj = new THREE.Line(geom, mat);
        measureLineObj.computeLineDistances();
        scene.add(measureLineObj);
      } else {
        clearMeasurements();
      }
      return;
    }

    // Normal element selection
    const hitMesh = hit.object;
    const elem = bimElements.find(e => e.mesh === hitMesh);
    if (elem) selectElement(elem);
  } else {
    if (!measureMode) deselectElement();
  }
});

function createPointMarker(pos, color) {
  const geom = new THREE.SphereGeometry(0.35, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(pos);
  mesh.renderOrder = 999;
  return mesh;
}

// ── Inspector Button Handlers ────────────────────────────────────────
btnInspFocus.addEventListener('click', () => {
  if (!selectedElement) return;
  const box = new THREE.Box3().setFromObject(selectedElement.mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 5);
  animateCameraTo(
    new THREE.Vector3(center.x + maxDim * 1.5, center.y + maxDim * 1.2, center.z + maxDim * 1.5),
    center
  );
});

btnInspIsolate.addEventListener('click', () => {
  if (!selectedElement) return;
  const isIsolated = bimElements.filter(e => e.visible).length === 1 && selectedElement.visible;

  if (isIsolated) {
    // Restore all
    bimElements.forEach(e => {
      e.visible = true;
      e.mesh.visible = true;
    });
    showToast('Todas las capas visibles');
  } else {
    // Isolate only selected
    bimElements.forEach(e => {
      const show = e === selectedElement;
      e.visible = show;
      e.mesh.visible = show;
    });
    showToast(`Aislado: ${selectedElement.name}`);
  }
  buildBimTree(searchInput.value);
});

// ── Search & Filter ──────────────────────────────────────────────────
searchInput.addEventListener('input', e => buildBimTree(e.target.value));
btnClearSearch.addEventListener('click', () => {
  searchInput.value = '';
  buildBimTree();
});

document.getElementById('btn-show-all').addEventListener('click', () => {
  bimElements.forEach(e => {
    e.visible = true;
    e.mesh.visible = true;
  });
  buildBimTree(searchInput.value);
  showToast('Mostrando todo el modelo');
});

document.getElementById('btn-hide-all').addEventListener('click', () => {
  bimElements.forEach(e => {
    e.visible = false;
    e.mesh.visible = false;
  });
  buildBimTree(searchInput.value);
  showToast('Todas las capas ocultas');
});

// ── Bottom Dock Actions ──────────────────────────────────────────────
dockFit.addEventListener('click', () => {
  if (modelRoot) fitCameraToModel();
});

dockModePbr.addEventListener('click', () => setShadingMode('pbr'));
dockModeClay.addEventListener('click', () => setShadingMode('clay'));
dockModeCat.addEventListener('click', () => setShadingMode('category'));
dockModeWire.addEventListener('click', () => setShadingMode('wire'));

dockSection.addEventListener('click', () => {
  sectionEnable.checked = !sectionEnable.checked;
  sectionEnable.dispatchEvent(new Event('change'));
});

dockMeasure.addEventListener('click', toggleMeasureMode);

dockGrid.addEventListener('click', () => {
  gridHelper.visible = !gridHelper.visible;
  axesHelper.visible = gridHelper.visible;
  dockGrid.classList.toggle('active', gridHelper.visible);
});

dockScreenshot.addEventListener('click', () => {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = `captura_bim_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📸 Captura HD guardada');
});

let currentModelUrl = null;

function getCurrentShareUrl() {
  const u = new URL(window.location.href);
  if (currentModelUrl && (currentModelUrl.startsWith('http://') || currentModelUrl.startsWith('https://'))) {
    u.searchParams.set('model', currentModelUrl);
  }
  return u.toString();
}

function openQrModal() {
  const url = getCurrentShareUrl();
  modalUrl.textContent = url;
  qrCanvasWrap.innerHTML = '';
  const qrCanvas = document.createElement('canvas');
  QRCode.toCanvas(qrCanvas, url, {
    width: 220,
    margin: 2,
    color: { dark: '#090d16', light: '#ffffff' },
  }, err => {
    if (!err) qrCanvasWrap.appendChild(qrCanvas);
  });
  qrModal.classList.add('active');
}

dockQr.addEventListener('click', () => openQrModal());
btnOpenQr.addEventListener('click', () => openQrModal());
btnCloseQr.addEventListener('click', () => qrModal.classList.remove('active'));

btnCopyUrl.addEventListener('click', () => {
  navigator.clipboard.writeText(getCurrentShareUrl()).then(() => {
    showToast('📋 Enlace copiado al portapapeles');
  });
});

// URL Modal Handlers
function openUrlModal() {
  const currentShare = getCurrentShareUrl();
  shareModelUrl.textContent = currentShare;
  if (currentModelUrl && (currentModelUrl.startsWith('http://') || currentModelUrl.startsWith('https://'))) {
    remoteModelUrl.value = currentModelUrl;
  }
  urlModal.classList.add('active');
}

btnOpenUrl.addEventListener('click', openUrlModal);
btnCloseUrl.addEventListener('click', () => urlModal.classList.remove('active'));

btnLoadRemote.addEventListener('click', () => {
  const url = remoteModelUrl.value.trim();
  if (!url) {
    showToast('⚠ Ingrese una URL válida');
    return;
  }
  currentModelUrl = url;
  const share = getCurrentShareUrl();
  shareModelUrl.textContent = share;
  window.history.replaceState(null, '', share);
  urlModal.classList.remove('active');
  loadModelFromUrl(url, 'Modelo Remoto');
});

btnCopyShareUrl.addEventListener('click', () => {
  const text = shareModelUrl.textContent;
  if (text && text !== '—') {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Enlace con modelo copiado para compartir');
    });
  }
});

// ── Sidebar Tabs & Toggle ────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  setTimeout(resize, 320);
});

btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// ── Loaders (GLTF, FBX, OBJ) ─────────────────────────────────────────
function loadModelFromUrl(url, name) {
  updateLoading(10, `Cargando ${name}...`);
  const loader = new GLTFLoader();

  loader.load(
    url,
    gltf => {
      updateLoading(90, 'Construyendo jerarquía BIM...');
      setTimeout(() => {
        setupLoadedModel(gltf.scene, name);
        updateLoading(100, 'Listo');
      }, 50);
    },
    xhr => {
      if (xhr.lengthComputable) {
        const pct = Math.round((xhr.loaded / xhr.total) * 80) + 10;
        updateLoading(pct, `Descargando: ${(xhr.loaded / 1024 / 1024).toFixed(1)} MB / ${(xhr.total / 1024 / 1024).toFixed(1)} MB`);
      }
    },
    err => {
      console.warn('Error loading preferred model:', err);
      // Fallback
      if (url.includes('paravisor_bim.glb')) {
        console.log('Falling back to paravisor.glb...');
        loadModelFromUrl('/paravisor.glb', 'Modelo Completo');
      } else {
        updateLoading(100, 'Error');
        showToast('❌ Error al cargar modelo 3D');
      }
    }
  );
}

function handleFileSelection(files) {
  const fileArr = Array.from(files);
  const glbFile = fileArr.find(f => /\.(glb|gltf)$/i.test(f.name));
  const fbxFile = fileArr.find(f => /\.fbx$/i.test(f.name));
  const objFile = fileArr.find(f => /\.obj$/i.test(f.name));
  const mtlFile = fileArr.find(f => /\.mtl$/i.test(f.name));

  if (glbFile) {
    updateLoading(20, `Procesando ${glbFile.name}...`);
    const url = URL.createObjectURL(glbFile);
    new GLTFLoader().load(url, gltf => {
      setupLoadedModel(gltf.scene, glbFile.name);
      updateLoading(100, 'Listo');
      URL.revokeObjectURL(url);
    });
    return;
  }

  if (fbxFile) {
    updateLoading(20, `Cargando FBX (${(fbxFile.size / 1024 / 1024).toFixed(1)} MB)...`);
    const url = URL.createObjectURL(fbxFile);
    const fbxLoader = new FBXLoader();
    fbxLoader.load(
      url,
      obj => {
        setupLoadedModel(obj, fbxFile.name);
        updateLoading(100, 'Listo');
        URL.revokeObjectURL(url);
      },
      xhr => {
        if (xhr.lengthComputable) {
          updateLoading(Math.round((xhr.loaded / xhr.total) * 80) + 10, 'Parseando FBX...');
        }
      },
      err => {
        updateLoading(100, 'Error');
        showToast('❌ Error al procesar archivo FBX');
        console.error(err);
      }
    );
    return;
  }

  if (objFile) {
    updateLoading(20, `Cargando OBJ...`);
    const objUrl = URL.createObjectURL(objFile);
    const loadObj = materials => {
      const objLoader = new OBJLoader();
      if (materials) objLoader.setMaterials(materials);
      objLoader.load(objUrl, obj => {
        setupLoadedModel(obj, objFile.name);
        updateLoading(100, 'Listo');
        URL.revokeObjectURL(objUrl);
      });
    };

    if (mtlFile) {
      const mtlUrl = URL.createObjectURL(mtlFile);
      new MTLLoader().load(mtlUrl, mats => {
        mats.preload();
        URL.revokeObjectURL(mtlUrl);
        loadObj(mats);
      });
    } else {
      loadObj(null);
    }
    return;
  }

  showToast('⚠ Formato no soportado. Usá .FBX, .GLB, .GLTF o .OBJ');
}

// Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => handleFileSelection(e.target.files));

window.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
window.addEventListener('dragleave', e => { if (e.relatedTarget === null) dropZone.classList.remove('drag-over'); });
window.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length > 0) handleFileSelection(e.dataTransfer.files);
});

// ── Window Resize ────────────────────────────────────────────────────
function resize() {
  const w = viewerWrap.clientWidth;
  const h = viewerWrap.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(viewerWrap);

// ── Animation Loop ───────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  // Smooth camera fly-to transition
  if (cameraAnimating) {
    camAnimProgress += 0.04;
    if (camAnimProgress >= 1) {
      cameraAnimating = false;
      camera.position.copy(camTargetPos);
      controls.target.copy(camTargetLook);
    } else {
      const ease = 1 - Math.pow(1 - camAnimProgress, 3); // Cubic ease out
      camera.position.lerpVectors(camStartPos, camTargetPos, ease);
      controls.target.lerpVectors(camStartLook, camTargetLook, ease);
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ── Initial Boot ─────────────────────────────────────────────────────
const DEFAULT_MODEL_URL = '/paravisor.glb';

const urlParams = new URLSearchParams(window.location.search);
const modelParam = urlParams.get('model');

if (modelParam) {
  currentModelUrl = modelParam;
  loadModelFromUrl(modelParam, 'Modelo Remoto');
} else {
  currentModelUrl = DEFAULT_MODEL_URL;
  loadModelFromUrl(DEFAULT_MODEL_URL, 'Mirador BIM');
}

