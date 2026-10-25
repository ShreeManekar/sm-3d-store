import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
// @ts-ignore
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
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
  height?: number | string;
  maxBuildDimension?: number;
  onDimensionsCalculated?: (dims: ModelDimensions) => void;
  showBuildVolume?: boolean;
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
    const vertices: number[] = [];
    const patternVertex = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;
    let match;
    while ((match = patternVertex.exec(text)) !== null) {
      vertices.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
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
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
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
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const bottomY = bbox.min.y;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;
  object.position.x -= centerX;
  object.position.y -= bottomY;
  object.position.z -= centerZ;
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
};

export const StlViewer: React.FC<StlViewerProps> = ({
  stlUrl,
  fileBuffer,
  height = 360,
  maxBuildDimension = 160,
  onDimensionsCalculated,
  showBuildVolume = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<ModelDimensions | null>(null);
  const [wireframe, setWireframe] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [meshColor, setMeshColor] = useState<string>('#00f0ff');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);

  const loadGeometry = useCallback(async (buffer: ArrayBuffer) => {
    try {
      setLoading(true);
      setError(null);

      // Clean existing children
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

      // Check if file is 3MF format
      if (is3mfBuffer(buffer)) {
        const loader = new ThreeMFLoader();
        const group = loader.parse(buffer) as THREE.Group;

        // Align 3MF group to build plate:
        // 1. Convert CAD Z-up to Three.js Y-up (-90° around X axis)
        // 2. Center horizontally on plate at (X = 0, Z = 0)
        // 3. Position bottom flush on top of build plate surface (Y = 0)
        const finalBox = alignObjectToBuildPlate(group);
        const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
        const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
        const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));

        const exceeds = lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension;
        const dims: ModelDimensions = {
          length: Math.max(1, lenX),
          width: Math.max(1, widZ),
          height: Math.max(1, hgtY),
          exceedsLimit: exceeds,
        };
        setDimensions(dims);
        if (onDimensionsCalculated) {
          onDimensionsCalculated(dims);
        }

        // Harmonize OrbitControls target with model height
        if (controlsRef.current) {
          const targetY = Math.max(15, Math.min(hgtY / 2, (maxBuildDimension || 160) * 0.45));
          controlsRef.current.target.set(0, targetY, 0);
          controlsRef.current.update();
        }

        if (modelGroupRef.current) {
          modelGroupRef.current.add(group);
        }
        setLoading(false);
        return;
      }

      // STL format parsing (binary or ASCII)
      let geometry: THREE.BufferGeometry;
      try {
        const stlLoader = new STLLoader();
        geometry = stlLoader.parse(buffer);
      } catch (_) {
        geometry = parseStlBuffer(buffer);
      }

      // Align geometry to build plate:
      // 1. Convert CAD Z-up to Three.js Y-up (-90° around X axis)
      // 2. Center horizontally on plate at (X = 0, Z = 0)
      // 3. Position bottom flush on top of build plate surface (Y = 0)
      const finalBox = alignGeometryToBuildPlate(geometry);
      const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
      const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
      const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));

      const exceeds = lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension;
      const dims: ModelDimensions = {
        length: Math.max(1, lenX),
        width: Math.max(1, widZ),
        height: Math.max(1, hgtY),
        exceedsLimit: exceeds,
      };
      setDimensions(dims);
      if (onDimensionsCalculated) {
        onDimensionsCalculated(dims);
      }

      // Harmonize OrbitControls target with model height
      if (controlsRef.current) {
        const targetY = Math.max(15, Math.min(hgtY / 2, (maxBuildDimension || 160) * 0.45));
        controlsRef.current.target.set(0, targetY, 0);
        controlsRef.current.update();
      }

      if (modelGroupRef.current) {
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(meshColor),
          specular: 0xffffff,
          shininess: 60,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        modelGroupRef.current.add(mesh);

        const wireGeo = new THREE.WireframeGeometry(geometry);
        const wireMat = new THREE.LineBasicMaterial({
          color: 0x8a2be2,
          transparent: true,
          opacity: 0.45,
        });
        const wireLine = new THREE.LineSegments(wireGeo, wireMat);
        wireLine.visible = wireframe;
        wireframeMeshRef.current = wireLine;
        modelGroupRef.current.add(wireLine);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading 3D model:', err);
      setError(err.message || 'Failed to parse 3D model file');
      setLoading(false);
    }
  }, [maxBuildDimension, meshColor, onDimensionsCalculated, wireframe]);

  // Handle color change across mesh and group
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshPhongMaterial).color.set(meshColor);
    }
    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((child: any) => {
        if (child.isMesh && child.material && !child.isLineSegments) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => {
              if (m.color) m.color.set(meshColor);
            });
          } else if (child.material.color) {
            child.material.color.set(meshColor);
          }
        }
      });
    }
  }, [meshColor]);

  // Handle wireframe toggle across mesh and group
  useEffect(() => {
    if (wireframeMeshRef.current) {
      wireframeMeshRef.current.visible = wireframe;
    }
    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((child: any) => {
        if (child.isLineSegments && child !== wireframeMeshRef.current) {
          child.visible = wireframe;
        } else if (child.isMesh && child !== meshRef.current && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => {
              m.wireframe = wireframe;
            });
          } else {
            child.material.wireframe = wireframe;
          }
        }
      });
    }
  }, [wireframe]);

  // Setup Three.js scene, build plate grid, build volume cage, and OrbitControls
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const hNum = typeof height === 'number' ? height : parseInt(String(height)) || 360;
    const bedSize = maxBuildDimension || 160;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050811);

    const camera = new THREE.PerspectiveCamera(45, width / hNum, 1, 3000);
    // Harmonized elevated view of the 160mm printer bed
    camera.position.set(0, bedSize * 0.85, bedSize * 1.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, hNum);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls for smooth, professional camera inspection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    // Target is centered on the print bed in the lower third of build volume
    controls.target.set(0, 40, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // allows viewing slightly below bed edge
    controls.minDistance = 25;
    controls.maxDistance = 800;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight1.position.set(bedSize * 0.5, bedSize, bedSize * 0.6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8a2be2, 0.85);
    dirLight2.position.set(-bedSize * 0.5, bedSize * 0.6, -bedSize * 0.6);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.35);
    dirLight3.position.set(0, -bedSize * 0.3, 0);
    scene.add(dirLight3);

    // Build volume plate (160x160mm grid representation with 160x160x160mm box)
    if (showBuildVolume) {
      // 1. Grid helper representing the 160x160mm printer bed surface at Y = 0
      const grid = new THREE.GridHelper(bedSize, 16, 0x00f0ff, 0x1e293b);
      grid.position.set(0, 0, 0);
      scene.add(grid);

      // 2. Translucent build plate surface directly beneath grid
      const bedGeo = new THREE.PlaneGeometry(bedSize, bedSize);
      const bedMat = new THREE.MeshBasicMaterial({
        color: 0x070c18,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });
      const bedPlane = new THREE.Mesh(bedGeo, bedMat);
      bedPlane.rotation.x = -Math.PI / 2;
      bedPlane.position.set(0, -0.05, 0);
      scene.add(bedPlane);

      // 3. Build volume box outline (160x160x160mm) resting flush on plate at Y = 0
      const boxGeo = new THREE.BoxGeometry(bedSize, bedSize, bedSize);
      const wireBoxGeo = new THREE.WireframeGeometry(boxGeo);
      const boxMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.16,
      });
      const wireBox = new THREE.LineSegments(wireBoxGeo, boxMat);
      wireBox.position.set(0, bedSize / 2, 0);
      scene.add(wireBox);
    }

    const modelGroup = new THREE.Group();
    modelGroup.position.set(0, 0, 0);
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation Loop with OrbitControls update
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      cameraRef.current.aspect = w / hNum;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, hNum);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [height, maxBuildDimension, showBuildVolume]);

  // Sync autoRotate state with OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Fetch or load model when props change
  useEffect(() => {
    if (fileBuffer) {
      loadGeometry(fileBuffer);
    } else if (stlUrl) {
      setLoading(true);
      fetch(stlUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ${stlUrl}`);
          return res.arrayBuffer();
        })
        .then((buf) => loadGeometry(buf))
        .catch((err) => {
          console.error(err);
          setError(`Could not load STL model: ${err.message}`);
          setLoading(false);
        });
    } else {
      // Load fallback sample model if neither provided
      fetch('/assets/models/sample_dragon.stl')
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buf) => {
          if (buf) loadGeometry(buf);
          else setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [fileBuffer, stlUrl, loadGeometry]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      const bedSize = maxBuildDimension || 160;
      cameraRef.current.position.set(0, bedSize * 0.85, bedSize * 1.5);
      const targetY = dimensions ? Math.max(15, Math.min(dimensions.height / 2, bedSize * 0.45)) : 40;
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#050811] shadow-2xl flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        style={{ height }}
        className="w-full relative cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#090d16]/80 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-400 gap-3 z-20">
          <div className="w-9 h-9 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase">Loading 3D Model...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-red-200 p-6 text-center z-20">
          <svg className="w-8 h-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs font-bold">{error}</p>
          <p className="text-[11px] text-gray-400 mt-1">Please provide a valid .stl or .3mf 3D model file (up to 100MB supported).</p>
        </div>
      )}

      {/* Toolbar & Detected Dimensions Header */}
      <div className="p-3 bg-gray-900/90 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Dimensions Pill */}
        {dimensions && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Dimensions:</span>
            <span className="font-mono font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
              {dimensions.length} × {dimensions.width} × {dimensions.height} mm
            </span>
            {dimensions.exceedsLimit ? (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold text-[11px]">
                ⚠️ Exceeds {maxBuildDimension}mm (Multi-part assembly recommended)
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold text-[11px]">
                ✓ Fits 160mm Plate
              </span>
            )}
          </div>
        )}

        {/* View Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Color palette */}
          <div className="flex items-center gap-1 mr-1">
            {['#00f0ff', '#8a2be2', '#f59e0b', '#ffffff'].map((color) => (
              <button
                key={color}
                onClick={() => setMeshColor(color)}
                style={{ backgroundColor: color }}
                title={`Color ${color}`}
                className={`w-4 h-4 rounded-full border ${meshColor === color ? 'border-white scale-125' : 'border-transparent'} transition`}
              />
            ))}
          </div>

          {/* Wireframe toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              wireframe
                ? 'bg-purple-900/40 text-purple-300 border-purple-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
            }`}
          >
            Wireframe {wireframe ? 'ON' : 'OFF'}
          </button>

          {/* Auto-rotate toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              autoRotate
                ? 'bg-cyan-900/40 text-cyan-300 border-cyan-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
            }`}
          >
            Rotate {autoRotate ? 'ON' : 'OFF'}
          </button>

          {/* Reset View */}
          <button
            onClick={resetCamera}
            className="px-2 py-1 rounded border bg-gray-800 text-gray-300 border-gray-700 hover:text-white text-[11px] font-medium transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default StlViewer;
