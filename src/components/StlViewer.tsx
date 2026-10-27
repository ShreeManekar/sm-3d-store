import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
// @ts-ignore
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
// @ts-ignore
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ModelDimensions {
  length: number;
  width: number;
  height: number;
  exceedsLimit: boolean;
}

interface StlViewerProps {
  stlUrl?: string;
  fileBuffer?: ArrayBuffer | null;
  fileName?: string;
  height?: number | string;
  maxBuildDimension?: number;
  onDimensionsCalculated?: (dims: ModelDimensions) => void;
  showBuildVolume?: boolean;
  noBuildLimit?: boolean;
  allowScaleAdjustment?: boolean;
  initialScale?: number;
  onError?: (errorMessage: string) => void;
}

export const is3mfBuffer = (buffer: ArrayBuffer): boolean => {
  if (!buffer || buffer.byteLength < 4) return false;
  const b = new Uint8Array(buffer, 0, 4);
  return b[0] === 0x50 && b[1] === 0x4B && (b[2] === 0x03 || b[2] === 0x05) && (b[3] === 0x04 || b[3] === 0x06);
};

export const parseStlBuffer = (buffer: ArrayBuffer): THREE.BufferGeometry => {
  if (!buffer || buffer.byteLength < 84) {
    throw new Error('Invalid or incomplete STL file data');
  }

  const geometry = new THREE.BufferGeometry();

  // Test if ASCII
  const headerBytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 80));
  const headerText = new TextDecoder().decode(headerBytes);
  const isAscii = headerText.trim().startsWith('solid') && headerText.includes('facet');

  if (isAscii) {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n');
    const vertices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('vertex ')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            vertices.push(x, y, z);
          }
        }
      }
    }
    if (vertices.length === 0) throw new Error('No ASCII STL vertices found');
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
  } else {
    // Binary STL
    const dataView = new DataView(buffer);
    const rawTriangles = dataView.getUint32(80, true);
    const maxPossibleTriangles = Math.floor((buffer.byteLength - 84) / 50);
    const numTriangles = Math.min(rawTriangles, maxPossibleTriangles);
    if (numTriangles <= 0) throw new Error('Binary STL has 0 triangles');

    const vertices = new Float32Array(numTriangles * 9);
    const normals = new Float32Array(numTriangles * 9);
    let offset = 84;

    for (let i = 0; i < numTriangles; i++) {
      if (offset + 50 > buffer.byteLength) break;
      const nx = dataView.getFloat32(offset, true) || 0;
      const ny = dataView.getFloat32(offset + 4, true) || 0;
      const nz = dataView.getFloat32(offset + 8, true) || 0;
      offset += 12;

      for (let j = 0; j < 3; j++) {
        const vx = dataView.getFloat32(offset, true) || 0;
        const vy = dataView.getFloat32(offset + 4, true) || 0;
        const vz = dataView.getFloat32(offset + 8, true) || 0;
        offset += 12;

        const idx = i * 9 + j * 3;
        vertices[idx] = vx;
        vertices[idx + 1] = vy;
        vertices[idx + 2] = vz;

        normals[idx] = nx;
        normals[idx + 1] = ny;
        normals[idx + 2] = nz;
      }
      offset += 2; // Attribute byte count
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  }

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Aligns a geometry to standard 3D printer bed coordinates:
 * 1. Converts CAD Z-up to Three.js Y-up (-90° around X axis)
 * 2. Centers the model horizontally on the plate at (X = 0, Z = 0)
 * 3. Positions the bottom of the bounding box flush on top of the build plate surface (Y = 0)
 */
export const alignGeometryToBuildPlate = (geometry: THREE.BufferGeometry): THREE.Box3 => {
  const position = geometry.getAttribute('position');
  if (!position || position.count === 0) {
    throw new Error('3D model contains no valid triangle vertices');
  }
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  if (bbox.isEmpty() || !isFinite(bbox.min.x) || !isFinite(bbox.max.x)) {
    throw new Error('3D model bounding geometry is invalid or empty');
  }
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const bottomY = bbox.min.y;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;
  geometry.translate(-centerX, -bottomY, -centerZ);
  geometry.computeBoundingBox();
  return geometry.boundingBox || new THREE.Box3();
};

/**
 * Aligns a 3MF Object3D / Group to standard 3D printer bed coordinates:
 * 1. Converts CAD Z-up to Three.js Y-up (-90° around X axis)
 * 2. Centers horizontally at (X = 0, Z = 0)
 * 3. Positions bottom flush on the build plate surface (Y = 0)
 */
export const alignObjectToBuildPlate = (object: THREE.Object3D): THREE.Box3 => {
  object.rotation.x = -Math.PI / 2;
  object.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(object);
  if (bbox.isEmpty() || !isFinite(bbox.min.x) || !isFinite(bbox.max.x)) {
    throw new Error('3D model bounding geometry is invalid or empty');
  }
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const bottomY = bbox.min.y;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;
  object.position.x -= centerX;
  object.position.y -= bottomY;
  object.position.z -= centerZ;
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
};

// Global in-memory cache for parsed geometries to ensure instant loading when reopening models
interface CachedModel {
  geometry?: THREE.BufferGeometry;
  object?: THREE.Object3D;
  rawBbox: THREE.Box3;
  baseDims: { length: number; width: number; height: number };
}
const modelCache = new Map<string, CachedModel>();

// Studio finishes: Reduced to 2 refined studio materials (eliminating multi-color clutters)
export const STUDIO_FINISHES = [
  { id: 'gold', name: 'Studio Gold', hex: '#f59e0b', ring: 'ring-amber-400' },
  { id: 'titanium', name: 'Titanium', hex: '#94a3b8', ring: 'ring-slate-400' },
];

export const StlViewer: React.FC<StlViewerProps> = ({
  stlUrl,
  fileBuffer,
  fileName,
  height = 360,
  maxBuildDimension = 160,
  onDimensionsCalculated,
  showBuildVolume = true,
  noBuildLimit = false,
  allowScaleAdjustment = true,
  initialScale = 1.0,
  onError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<ModelDimensions | null>(null);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [meshColor, setMeshColor] = useState<string>('#f59e0b');
  const [modelScale, setModelScale] = useState<number>(initialScale || 1.0);
  const [gridDimension, setGridDimension] = useState<number>(maxBuildDimension || 160);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);
  const rawBoundingBoxRef = useRef<THREE.Box3 | null>(null);
  const baseDimsRef = useRef<{ length: number; width: number; height: number } | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);

  // Stable callback refs to prevent effect recreation
  const onDimensionsCalculatedRef = useRef(onDimensionsCalculated);
  onDimensionsCalculatedRef.current = onDimensionsCalculated;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const modelScaleRef = useRef(modelScale);
  modelScaleRef.current = modelScale;

  const meshColorRef = useRef(meshColor);
  meshColorRef.current = meshColor;

  const wireframeRef = useRef(wireframe);
  wireframeRef.current = wireframe;

  /**
   * Helper to create the refined studio material (metallic satin finish)
   */
  const createStudioMaterial = useCallback((colorHex: string, isWire: boolean): THREE.Material => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.38,
      metalness: 0.72,
      wireframe: isWire,
      side: THREE.DoubleSide,
    });
  }, []);

  /**
   * Smoothly frames and centers any 3D model in the camera viewport
   */
  const frameModelInView = useCallback((box: THREE.Box3, currentScale: number = 1.0) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const lenX = Math.abs(box.max.x - box.min.x) * currentScale;
    const hgtY = Math.abs(box.max.y - box.min.y) * currentScale;
    const widZ = Math.abs(box.max.z - box.min.z) * currentScale;
    const maxDim = Math.max(lenX, widZ, hgtY, 20);

    const targetY = hgtY / 2;
    controls.target.set(0, targetY, 0);

    const fovRad = (camera.fov * Math.PI) / 180;
    const radius = (maxDim / 2) * 1.35;
    const fitDistance = radius / Math.sin(fovRad / 2);
    const distance = Math.max(fitDistance * 1.25, 35);

    camera.position.set(0, targetY + distance * 0.45, distance * 1.15);
    camera.near = Math.max(0.5, distance * 0.01);
    camera.far = Math.max(12000, distance * 30);
    camera.updateProjectionMatrix();

    controls.minDistance = Math.max(5, distance * 0.05);
    controls.maxDistance = Math.max(5000, distance * 12);
    controls.update();
  }, []);

  /**
   * Builds or updates the sleek dark carbon build plate grid without rebuilding scene
   */
  const updateBuildPlate = useCallback((size: number) => {
    if (!sceneRef.current || !showBuildVolume) return;
    const scene = sceneRef.current;

    if (gridGroupRef.current) {
      scene.remove(gridGroupRef.current);
      gridGroupRef.current.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    const group = new THREE.Group();

    // 1. Subtle, elegant slate grid helper (slate-600 center, slate-800 grid lines)
    const divisions = Math.max(16, Math.min(64, Math.round(size / 10)));
    const grid = new THREE.GridHelper(size, divisions, 0x475569, 0x1e293b);
    grid.position.set(0, 0, 0);
    group.add(grid);

    // 2. Dark matte carbon build plate surface
    const bedGeo = new THREE.PlaneGeometry(size, size);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0x0e131d,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bedPlane = new THREE.Mesh(bedGeo, bedMat);
    bedPlane.rotation.x = -Math.PI / 2;
    bedPlane.position.set(0, -0.05, 0);
    group.add(bedPlane);

    // 3. Subtle build volume outline if restricted
    if (!noBuildLimit) {
      const boxGeo = new THREE.BoxGeometry(size, size, size);
      const wireBoxGeo = new THREE.WireframeGeometry(boxGeo);
      const boxMat = new THREE.LineBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0.22,
      });
      const wireBox = new THREE.LineSegments(wireBoxGeo, boxMat);
      wireBox.position.set(0, size / 2, 0);
      group.add(wireBox);
    }

    scene.add(group);
    gridGroupRef.current = group;
  }, [noBuildLimit, showBuildVolume]);

  /**
   * One-time setup of Three.js Scene, Camera, WebGLRenderer, Lights, and OrbitControls
   */
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const hNum = typeof height === 'number' ? height : parseInt(String(height)) || 360;
    const bedSize = gridDimension || 160;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);

    const camera = new THREE.PerspectiveCamera(45, width / hNum, 1, 5000);
    camera.position.set(0, bedSize * 0.85, bedSize * 1.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    renderer.setSize(width, hNum);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.target.set(0, 40, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 15;
    controls.maxDistance = 2000;
    controlsRef.current = controls;

    // Clean Studio 3-Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.3);
    keyLight.position.set(bedSize * 0.6, bedSize * 1.2, bedSize * 0.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    fillLight.position.set(-bedSize * 0.6, bedSize * 0.8, -bedSize * 0.6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef3c7, 0.45);
    rimLight.position.set(0, -bedSize * 0.4, -bedSize * 0.8);
    scene.add(rimLight);

    // Initial build plate
    updateBuildPlate(bedSize);

    // Model root group
    const modelGroup = new THREE.Group();
    modelGroup.position.set(0, 0, 0);
    modelGroup.scale.set(modelScaleRef.current, modelScaleRef.current, modelScaleRef.current);
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation Loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    // Fast, responsive ResizeObserver (handles container/modal resizes without recreating WebGL)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []); // Run once on mount

  // Sync autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Handle height prop changes dynamically without tearing down scene
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
    const w = mountRef.current.clientWidth || 400;
    const hNum = typeof height === 'number' ? height : parseInt(String(height)) || 360;
    cameraRef.current.aspect = w / hNum;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(w, hNum, false);
  }, [height]);

  /**
   * Fast Model Loader & Parser with In-Memory Caching
   */
  const loadModelData = useCallback(async (buffer: ArrayBuffer, cacheKey: string, nameHint?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Clean existing children from modelGroup
      if (modelGroupRef.current) {
        while (modelGroupRef.current.children.length > 0) {
          const child = modelGroupRef.current.children[0] as any;
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
          modelGroupRef.current.remove(child);
        }
      }

      // Check Cache
      let cached = modelCache.get(cacheKey);

      if (!cached) {
        const lowerName = (nameHint || fileName || stlUrl || '').toLowerCase();
        const is3mf = lowerName.endsWith('.3mf') || is3mfBuffer(buffer);
        const isStep = lowerName.endsWith('.step') || lowerName.endsWith('.stp');
        const isObj = lowerName.endsWith('.obj');
        const isStl = lowerName.endsWith('.stl');

        if (is3mf) {
          const loader = new ThreeMFLoader();
          const group = loader.parse(buffer) as THREE.Group;
          const finalBox = alignObjectToBuildPlate(group);
          const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
          const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
          const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));
          cached = {
            object: group,
            rawBbox: finalBox.clone(),
            baseDims: { length: Math.max(1, lenX), width: Math.max(1, widZ), height: Math.max(1, hgtY) },
          };
          modelCache.set(cacheKey, cached);
        } else if (isStep) {
          const stepWidth = 80;
          const stepLength = 60;
          const stepHeight = 40;
          const boxGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepLength);
          const cadBbox = new THREE.Box3(
            new THREE.Vector3(-stepWidth / 2, 0, -stepLength / 2),
            new THREE.Vector3(stepWidth / 2, stepHeight, stepLength / 2)
          );
          cached = {
            geometry: boxGeo,
            rawBbox: cadBbox,
            baseDims: { length: stepWidth, width: stepLength, height: stepHeight },
          };
          modelCache.set(cacheKey, cached);
        } else if (isObj || (!isStl && !is3mf)) {
          let parsedGeo: THREE.BufferGeometry | null = null;
          try {
            const textFull = new TextDecoder().decode(buffer);
            const objLoader = new OBJLoader();
            const group = objLoader.parse(textFull) as THREE.Group;
            const finalBox = alignObjectToBuildPlate(group);
            const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
            const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
            const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));
            cached = {
              object: group,
              rawBbox: finalBox.clone(),
              baseDims: { length: Math.max(1, lenX), width: Math.max(1, widZ), height: Math.max(1, hgtY) },
            };
            modelCache.set(cacheKey, cached);
          } catch (_) {
            // fallback to STL
          }
        }

        // Default or Fallback: STL parsing
        if (!cached) {
          let geometry: THREE.BufferGeometry;
          try {
            const stlLoader = new STLLoader();
            geometry = stlLoader.parse(buffer);
          } catch (_) {
            geometry = parseStlBuffer(buffer);
          }
          const finalBox = alignGeometryToBuildPlate(geometry);
          const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
          const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
          const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));
          cached = {
            geometry,
            rawBbox: finalBox.clone(),
            baseDims: { length: Math.max(1, lenX), width: Math.max(1, widZ), height: Math.max(1, hgtY) },
          };
          modelCache.set(cacheKey, cached);
        }
      }

      // Model is parsed/cached: instantiate in scene
      rawBoundingBoxRef.current = cached.rawBbox.clone();
      baseDimsRef.current = { ...cached.baseDims };

      const curScale = modelScaleRef.current;
      const scaledLen = Math.round(cached.baseDims.length * curScale);
      const scaledWid = Math.round(cached.baseDims.width * curScale);
      const scaledHgt = Math.round(cached.baseDims.height * curScale);
      const exceeds = !noBuildLimit && (scaledLen > maxBuildDimension || scaledWid > maxBuildDimension || scaledHgt > maxBuildDimension);

      const calculatedDims: ModelDimensions = {
        length: Math.max(1, scaledLen),
        width: Math.max(1, scaledWid),
        height: Math.max(1, scaledHgt),
        exceedsLimit: exceeds,
      };
      setDimensions(calculatedDims);
      onDimensionsCalculatedRef.current?.(calculatedDims);

      // Adaptive build plate size (no 160mm limit)
      const footprint = Math.max(scaledLen, scaledWid);
      let effectivePlate = maxBuildDimension || 160;
      if (noBuildLimit || footprint > effectivePlate) {
        effectivePlate = Math.max(160, Math.ceil((footprint * 1.35) / 20) * 20);
      }
      setGridDimension(effectivePlate);
      updateBuildPlate(effectivePlate);

      if (modelGroupRef.current) {
        modelGroupRef.current.scale.set(curScale, curScale, curScale);
        if (cached.object) {
          const clonedObj = cached.object.clone();
          // Apply studio material if needed
          clonedObj.traverse((child: any) => {
            if (child.isMesh) {
              child.material = createStudioMaterial(meshColorRef.current, wireframeRef.current);
            }
          });
          modelGroupRef.current.add(clonedObj);
        } else if (cached.geometry) {
          const mat = createStudioMaterial(meshColorRef.current, wireframeRef.current);
          const mesh = new THREE.Mesh(cached.geometry, mat);
          modelGroupRef.current.add(mesh);
        }
      }

      frameModelInView(cached.rawBbox, curScale);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading 3D model:', err);
      const errMsg = err.message || 'Failed to parse 3D model file';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      setLoading(false);
    }
  }, [createStudioMaterial, fileName, frameModelInView, maxBuildDimension, noBuildLimit, stlUrl, updateBuildPlate]);

  // Load geometry only when source data (fileBuffer or stlUrl) changes
  useEffect(() => {
    let active = true;

    if (fileBuffer) {
      const key = `${fileName || 'upload'}_${fileBuffer.byteLength}`;
      loadModelData(fileBuffer, key, fileName);
    } else if (stlUrl) {
      setLoading(true);
      fetch(stlUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ${stlUrl}`);
          return res.arrayBuffer();
        })
        .then((buf) => {
          if (active) loadModelData(buf, stlUrl, fileName || stlUrl);
        })
        .catch((err) => {
          if (!active) return;
          console.error(err);
          setError(`Could not load STL model: ${err.message}`);
          onErrorRef.current?.(err.message);
          setLoading(false);
        });
    } else {
      // Default sample model
      const sampleUrl = '/assets/models/sample_dragon.stl';
      fetch(sampleUrl)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buf) => {
          if (active && buf) loadModelData(buf, sampleUrl, 'sample_dragon.stl');
          else if (active) setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [fileBuffer, stlUrl, fileName, loadModelData]);

  /**
   * Instantaneous Real-Time Size / Scale Adjustment (Zero re-parse, Zero reload)
   */
  const handleScaleChange = useCallback((newScale: number) => {
    const clamped = Math.max(0.1, Math.min(newScale, 5.0));
    const rounded = Math.round(clamped * 100) / 100;
    setModelScale(rounded);
    modelScaleRef.current = rounded;

    // Direct Three.js scale update (60fps buttery smooth)
    if (modelGroupRef.current) {
      modelGroupRef.current.scale.set(rounded, rounded, rounded);
    }

    // Update dimensions state instantly without re-parsing geometry
    if (baseDimsRef.current) {
      const base = baseDimsRef.current;
      const lenX = Math.round(base.length * rounded);
      const widZ = Math.round(base.width * rounded);
      const hgtY = Math.round(base.height * rounded);
      const exceeds = !noBuildLimit && (lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension);

      const scaledDims: ModelDimensions = {
        length: Math.max(1, lenX),
        width: Math.max(1, widZ),
        height: Math.max(1, hgtY),
        exceedsLimit: exceeds,
      };
      setDimensions(scaledDims);
      onDimensionsCalculatedRef.current?.(scaledDims);
    }
  }, [maxBuildDimension, noBuildLimit]);

  /**
   * Handle color change instantly across mesh without reloading
   */
  const handleColorChange = useCallback((newColor: string) => {
    setMeshColor(newColor);
    meshColorRef.current = newColor;

    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => {
              if (m.color) m.color.set(newColor);
            });
          } else if (child.material.color) {
            child.material.color.set(newColor);
          }
        }
      });
    }
  }, []);

  /**
   * Handle wireframe toggle instantly without recreating geometry
   */
  const toggleWireframe = useCallback(() => {
    const next = !wireframe;
    setWireframe(next);
    wireframeRef.current = next;

    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => {
              m.wireframe = next;
            });
          } else {
            child.material.wireframe = next;
          }
        }
      });
    }
  }, [wireframe]);

  /**
   * Auto-fit and center model in view
   */
  const fitToCenter = useCallback(() => {
    setModelScale(1.0);
    modelScaleRef.current = 1.0;
    if (modelGroupRef.current) {
      modelGroupRef.current.scale.set(1.0, 1.0, 1.0);
    }
    if (baseDimsRef.current) {
      const base = baseDimsRef.current;
      const exceeds = !noBuildLimit && (base.length > maxBuildDimension || base.width > maxBuildDimension || base.height > maxBuildDimension);
      const dims: ModelDimensions = {
        length: base.length,
        width: base.width,
        height: base.height,
        exceedsLimit: exceeds,
      };
      setDimensions(dims);
      onDimensionsCalculatedRef.current?.(dims);
    }
    if (rawBoundingBoxRef.current) {
      frameModelInView(rawBoundingBoxRef.current, 1.0);
    }
  }, [frameModelInView, maxBuildDimension, noBuildLimit]);

  const resetCamera = useCallback(() => {
    if (rawBoundingBoxRef.current) {
      frameModelInView(rawBoundingBoxRef.current, modelScaleRef.current);
    } else if (cameraRef.current && controlsRef.current) {
      const bedSize = gridDimension || 160;
      cameraRef.current.position.set(0, bedSize * 0.85, bedSize * 1.5);
      controlsRef.current.target.set(0, 40, 0);
      controlsRef.current.update();
    }
  }, [frameModelInView, gridDimension]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-gray-200/80 dark:border-white/[0.08] bg-[#060913] shadow-2xl flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        style={{ height }}
        className="w-full relative cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#080b11]/85 backdrop-blur-md flex flex-col items-center justify-center text-amber-400 gap-3 z-20">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-amber-500/20" />
          <p className="text-xs font-semibold tracking-wider uppercase text-amber-300">Loading 3D Model...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-950/85 backdrop-blur-md flex flex-col items-center justify-center text-red-200 p-6 text-center z-20">
          <svg className="w-8 h-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs font-bold">{error}</p>
          <p className="text-[11px] text-gray-400 mt-1">Please provide a valid .stl or .3mf 3D model file (up to 200MB supported).</p>
        </div>
      )}

      {/* Toolbar & Detected Dimensions Header */}
      <div className="p-3.5 apple-glass border-t border-gray-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Dimensions Pill & Size Info */}
        {dimensions && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500 dark:text-zinc-400 font-medium">Model Dimensions:</span>
            <span className="font-mono font-bold text-amber-500 dark:text-amber-300 bg-gray-100/80 dark:bg-black/40 px-3 py-1 rounded-full border border-gray-200/80 dark:border-white/[0.08] shadow-sm">
              {dimensions.length} × {dimensions.width} × {dimensions.height} mm
            </span>
            {noBuildLimit ? (
              <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25 rounded-full font-semibold text-[11px] flex items-center gap-1">
                <span>⚡</span> Centered • Dynamic Plate
              </span>
            ) : dimensions.exceedsLimit ? (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-full font-semibold text-[11px]">
                ⚠️ Exceeds {maxBuildDimension}mm (Multi-part assembly recommended)
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-full font-semibold text-[11px]">
                ✓ Fits 160mm Plate
              </span>
            )}
          </div>
        )}

        {/* View & Size Controls */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Interactive Size / Scale Adjustment Controls */}
          {allowScaleAdjustment && (
            <div className="flex items-center gap-1.5 bg-[#0b0f19] px-2.5 py-1 rounded-xl border border-gray-800 shadow-inner">
              <span className="text-[11px] text-gray-300 font-medium">Size:</span>
              <button
                type="button"
                onClick={() => handleScaleChange(modelScale - 0.1)}
                disabled={modelScale <= 0.15}
                title="Decrease preview size"
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-800 text-gray-200 hover:text-white hover:bg-gray-700 disabled:opacity-40 text-xs font-bold transition"
              >
                −
              </button>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={modelScale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="w-14 sm:w-20 accent-amber-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
                title={`Preview scale: ${Math.round(modelScale * 100)}%`}
              />
              <button
                type="button"
                onClick={() => handleScaleChange(modelScale + 0.1)}
                disabled={modelScale >= 4.9}
                title="Increase preview size"
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-800 text-gray-200 hover:text-white hover:bg-gray-700 disabled:opacity-40 text-xs font-bold transition"
              >
                +
              </button>
              <span className="font-mono text-[11px] text-amber-300 font-bold min-w-[36px] text-center">
                {Math.round(modelScale * 100)}%
              </span>
              <button
                type="button"
                onClick={fitToCenter}
                title="Auto-fit and center model in view"
                className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/25 text-[11px] font-semibold flex items-center gap-1 transition-all duration-300 active:scale-95"
              >
                <span>⛶</span> Center & Fit
              </button>
            </div>
          )}

          {/* Color palette - Refined Clean Studio Finishes (Reduced clutter) */}
          <div className="flex items-center gap-1.5 bg-[#0b0f19] px-2 py-1 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 font-medium mr-0.5">Finish:</span>
            {STUDIO_FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleColorChange(f.hex)}
                style={{ backgroundColor: f.hex }}
                title={`${f.name} Finish`}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  meshColor.toLowerCase() === f.hex.toLowerCase()
                    ? 'border-white scale-125 ring-2 ring-amber-400/50'
                    : 'border-transparent opacity-75 hover:opacity-100 hover:scale-110'
                }`}
              />
            ))}
          </div>

          {/* Wireframe toggle */}
          <button
            type="button"
            onClick={toggleWireframe}
            className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-300 active:scale-95 ${
              wireframe
                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-400 border-gray-300 dark:border-zinc-700 hover:text-amber-500'
            }`}
          >
            Wireframe {wireframe ? 'ON' : 'OFF'}
          </button>

          {/* Auto-rotate toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-300 active:scale-95 ${
              autoRotate
                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-400 border-gray-300 dark:border-zinc-700 hover:text-amber-500'
            }`}
          >
            Rotate {autoRotate ? 'ON' : 'OFF'}
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={resetCamera}
            className="px-3 py-1 rounded-full border bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:text-amber-500 text-[11px] font-medium transition-all duration-300 active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default StlViewer;
