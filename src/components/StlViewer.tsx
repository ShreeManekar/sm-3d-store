import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

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
  const animFrameId = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const autoRotateRef = useRef<boolean>(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const loadGeometry = useCallback(async (buffer: ArrayBuffer) => {
    try {
      setLoading(true);
      setError(null);
      const geometry = parseStlBuffer(buffer);

      // Measure original bounding box dimensions before scaling
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox || new THREE.Box3();
      const rawLen = Math.round(Math.abs(bbox.max.x - bbox.min.x));
      const rawWid = Math.round(Math.abs(bbox.max.y - bbox.min.y));
      const rawHgt = Math.round(Math.abs(bbox.max.z - bbox.min.z));

      const exceeds = rawLen > maxBuildDimension || rawWid > maxBuildDimension || rawHgt > maxBuildDimension;
      const dims: ModelDimensions = {
        length: Math.max(1, rawLen),
        width: Math.max(1, rawWid),
        height: Math.max(1, rawHgt),
        exceedsLimit: exceeds,
      };
      setDimensions(dims);
      if (onDimensionsCalculated) {
        onDimensionsCalculated(dims);
      }

      // Center geometry at origin
      geometry.center();

      // Normalize scale for comfortable viewport display (target radius ~28 units)
      geometry.computeBoundingSphere();
      const radius = geometry.boundingSphere?.radius || 30;
      const targetRadius = 26;
      const autoScale = radius > 0 ? targetRadius / radius : 1;
      geometry.scale(autoScale, autoScale, autoScale);

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
      console.error('Error loading STL:', err);
      setError(err.message || 'Failed to parse STL geometry');
      setLoading(false);
    }
  }, [maxBuildDimension, meshColor, onDimensionsCalculated, wireframe]);

  // Handle color change
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshPhongMaterial).color.set(meshColor);
    }
  }, [meshColor]);

  // Handle wireframe toggle
  useEffect(() => {
    if (wireframeMeshRef.current) {
      wireframeMeshRef.current.visible = wireframe;
    }
  }, [wireframe]);

  // Setup Three scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const hNum = typeof height === 'number' ? height : parseInt(String(height)) || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050811);

    const camera = new THREE.PerspectiveCamera(45, width / hNum, 0.1, 1000);
    camera.position.set(0, 35, 75);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, hNum);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.0);
    dirLight1.position.set(50, 80, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8a2be2, 0.7);
    dirLight2.position.set(-50, -40, -50);
    scene.add(dirLight2);

    // Build volume plate (160mm grid representation scaled to scene units)
    if (showBuildVolume) {
      const grid = new THREE.GridHelper(52, 16, 0x00f0ff, 0x1e293b);
      grid.position.y = -18;
      scene.add(grid);

      // Build volume box outline
      const boxGeo = new THREE.BoxGeometry(52, 52, 52);
      const wireBoxGeo = new THREE.WireframeGeometry(boxGeo);
      const boxMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.3 });
      const wireBox = new THREE.LineSegments(wireBoxGeo, boxMat);
      wireBox.position.y = 8;
      scene.add(wireBox);
    }

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Mouse drag interaction
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !modelGroupRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      modelGroupRef.current.rotation.y += dx * 0.01;
      modelGroupRef.current.rotation.x += dy * 0.01;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.05;
      cameraRef.current.position.z = Math.max(30, Math.min(180, cameraRef.current.position.z + zoomDelta));
    };

    // Touch support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !modelGroupRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMousePos.current.x;
      const dy = e.touches[0].clientY - prevMousePos.current.y;
      modelGroupRef.current.rotation.y += dx * 0.015;
      modelGroupRef.current.rotation.x += dy * 0.015;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    const animate = () => {
      if (autoRotateRef.current && modelGroupRef.current && !isDragging.current) {
        modelGroupRef.current.rotation.y += 0.008;
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
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [height, showBuildVolume]);

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
    if (cameraRef.current && modelGroupRef.current) {
      cameraRef.current.position.set(0, 35, 75);
      cameraRef.current.lookAt(0, 0, 0);
      modelGroupRef.current.rotation.set(0, 0, 0);
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
          <p className="text-[11px] text-gray-400 mt-1">Please provide a valid binary or ASCII .stl file.</p>
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
