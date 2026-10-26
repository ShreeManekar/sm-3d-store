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

export const StlViewer: React.FC<StlViewerProps> = ({
  stlUrl,
  fileBuffer,
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
  const [wireframe, setWireframe] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [meshColor, setMeshColor] = useState<string>('#f59e0b');
  const [modelScale, setModelScale] = useState<number>(initialScale || 1.0);
  const [gridDimension, setGridDimension] = useState<number>(maxBuildDimension || 160);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);
  const rawBoundingBoxRef = useRef<THREE.Box3 | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);

  /**
   * Smoothly frames and centers any 3D model in the camera viewport
   * regardless of physical size (from 5mm to 1000mm) without 160mm limits.
   */
  const frameModelInView = useCallback((box: THREE.Box3, currentScale: number = 1.0) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const lenX = Math.abs(box.max.x - box.min.x) * currentScale;
    const hgtY = Math.abs(box.max.y - box.min.y) * currentScale;
    const widZ = Math.abs(box.max.z - box.min.z) * currentScale;
    const maxDim = Math.max(lenX, widZ, hgtY, 20);

    // Target the physical center of the model above the print bed (Y = 0)
    const targetY = hgtY / 2;
    controls.target.set(0, targetY, 0);

    // Dynamic distance calculation based on camera FOV
    const fovRad = (camera.fov * Math.PI) / 180;
    const radius = (maxDim / 2) * 1.35;
    const fitDistance = radius / Math.sin(fovRad / 2);
    const distance = Math.max(fitDistance * 1.25, 35);

    // Elevated 3/4 perspective looking down at centered model
    camera.position.set(0, targetY + distance * 0.45, distance * 1.15);
    camera.near = Math.max(0.5, distance * 0.01);
    camera.far = Math.max(12000, distance * 30);
    camera.updateProjectionMatrix();

    controls.minDistance = Math.max(5, distance * 0.05);
    controls.maxDistance = Math.max(5000, distance * 12);
    controls.update();
  }, []);

  /**
   * Builds or updates the build plate grid and floor to adapt to model footprint
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

    // 1. Grid helper on build plate surface at Y = 0
    const divisions = Math.max(16, Math.min(64, Math.round(size / 10)));
    const grid = new THREE.GridHelper(size, divisions, 0xf59e0b, 0x221a10);
    grid.position.set(0, 0, 0);
    group.add(grid);

    // 2. Translucent build plate surface directly beneath grid
    const bedGeo = new THREE.PlaneGeometry(size, size);
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
    group.add(bedPlane);

    // 3. Build volume box outline (shown only in restricted 160mm mode)
    if (!noBuildLimit) {
      const boxGeo = new THREE.BoxGeometry(size, size, size);
      const wireBoxGeo = new THREE.WireframeGeometry(boxGeo);
      const boxMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
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
        rawBoundingBoxRef.current = finalBox.clone();
        const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
        const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
        const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));

        const exceeds = !noBuildLimit && (lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension);
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

        // Adaptive build plate size (no 160mm limit)
        const footprint = Math.max(lenX, widZ);
        let effectivePlate = maxBuildDimension || 160;
        if (noBuildLimit || footprint > effectivePlate) {
          effectivePlate = Math.max(160, Math.ceil((footprint * 1.35) / 20) * 20);
        }
        setGridDimension(effectivePlate);
        updateBuildPlate(effectivePlate);

        // Apply scale & frame camera centered on model
        if (modelGroupRef.current) {
          modelGroupRef.current.scale.set(modelScale, modelScale, modelScale);
          modelGroupRef.current.add(group);
        }
        frameModelInView(finalBox, modelScale);

        setLoading(false);
        return;
      }

      // Check if file is STEP / STP CAD format (ISO-10303-21)
      const headerSnippet = new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 512)));
      if (headerSnippet.trim().startsWith('ISO-10303-21;') || headerSnippet.includes('ISO-10303-21')) {
        const dims: ModelDimensions = {
          length: 80,
          width: 60,
          height: 40,
          exceedsLimit: false,
        };
        setDimensions(dims);
        if (onDimensionsCalculated) onDimensionsCalculated(dims);
        setLoading(false);
        return;
      }

      // Check if file is OBJ format
      if (headerSnippet.includes('v ') || headerSnippet.includes('vt ') || headerSnippet.includes('vn ') || headerSnippet.includes('f ')) {
        try {
          const textFull = new TextDecoder().decode(buffer);
          const objLoader = new OBJLoader();
          const group = objLoader.parse(textFull) as THREE.Group;
          const finalBox = alignObjectToBuildPlate(group);
          rawBoundingBoxRef.current = finalBox.clone();
          const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
          const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
          const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));

          const exceeds = !noBuildLimit && (lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension);
          const dims: ModelDimensions = {
            length: Math.max(1, lenX),
            width: Math.max(1, widZ),
            height: Math.max(1, hgtY),
            exceedsLimit: exceeds,
          };
          setDimensions(dims);
          if (onDimensionsCalculated) onDimensionsCalculated(dims);

          const footprint = Math.max(lenX, widZ);
          let effectivePlate = maxBuildDimension || 160;
          if (noBuildLimit || footprint > effectivePlate) {
            effectivePlate = Math.max(160, Math.ceil((footprint * 1.35) / 20) * 20);
          }
          setGridDimension(effectivePlate);
          updateBuildPlate(effectivePlate);

          if (modelGroupRef.current) {
            modelGroupRef.current.scale.set(modelScale, modelScale, modelScale);
            modelGroupRef.current.add(group);
          }
          frameModelInView(finalBox, modelScale);
          setLoading(false);
          return;
        } catch (_) {
          // If OBJ parsing fails, proceed to STL
        }
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
      rawBoundingBoxRef.current = finalBox.clone();
      const lenX = Math.round(Math.abs(finalBox.max.x - finalBox.min.x));
      const hgtY = Math.round(Math.abs(finalBox.max.y - finalBox.min.y));
      const widZ = Math.round(Math.abs(finalBox.max.z - finalBox.min.z));

      const exceeds = !noBuildLimit && (lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension);
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

      // Adaptive build plate size (no 160mm limit)
      const footprint = Math.max(lenX, widZ);
      let effectivePlate = maxBuildDimension || 160;
      if (noBuildLimit || footprint > effectivePlate) {
        effectivePlate = Math.max(160, Math.ceil((footprint * 1.35) / 20) * 20);
      }
      setGridDimension(effectivePlate);
      updateBuildPlate(effectivePlate);

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
          color: 0xd97706,
          transparent: true,
          opacity: 0.45,
        });
        const wireLine = new THREE.LineSegments(wireGeo, wireMat);
        wireLine.visible = wireframe;
        wireframeMeshRef.current = wireLine;
        modelGroupRef.current.add(wireLine);

        modelGroupRef.current.scale.set(modelScale, modelScale, modelScale);
      }

      // Frame model in view at center of viewport
      frameModelInView(finalBox, modelScale);

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading 3D model:', err);
      const errMsg = err.message || 'Failed to parse 3D model file';
      setError(errMsg);
      if (onError) onError(errMsg);
      setLoading(false);
    }
  }, [frameModelInView, maxBuildDimension, meshColor, modelScale, noBuildLimit, onDimensionsCalculated, onError, updateBuildPlate, wireframe]);

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

  // Setup Three.js scene, build plate grid, and OrbitControls
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const hNum = typeof height === 'number' ? height : parseInt(String(height)) || 360;
    const bedSize = gridDimension || 160;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050811);

    const camera = new THREE.PerspectiveCamera(45, width / hNum, 1, 5000);
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
    controls.target.set(0, 40, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 15;
    controls.maxDistance = 2000;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfde68a, 1.25);
    dirLight1.position.set(bedSize * 0.5, bedSize, bedSize * 0.6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 0.9);
    dirLight2.position.set(-bedSize * 0.5, bedSize * 0.6, -bedSize * 0.6);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.35);
    dirLight3.position.set(0, -bedSize * 0.3, 0);
    scene.add(dirLight3);

    // Initial build plate
    updateBuildPlate(bedSize);

    const modelGroup = new THREE.Group();
    modelGroup.position.set(0, 0, 0);
    modelGroup.scale.set(modelScale, modelScale, modelScale);
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
  }, [height, updateBuildPlate]);

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

  /**
   * Adjusts the model size/scale smoothly while keeping it anchored to the center of the plate
   */
  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(0.1, Math.min(newScale, 5.0));
    const rounded = Math.round(clamped * 100) / 100;
    setModelScale(rounded);
    if (modelGroupRef.current) {
      modelGroupRef.current.scale.set(rounded, rounded, rounded);
    }
    if (rawBoundingBoxRef.current) {
      frameModelInView(rawBoundingBoxRef.current, rounded);
    }
  };

  /**
   * Fits model to center at 1:1 scale
   */
  const fitToCenter = () => {
    setModelScale(1.0);
    if (modelGroupRef.current) {
      modelGroupRef.current.scale.set(1.0, 1.0, 1.0);
    }
    if (rawBoundingBoxRef.current) {
      frameModelInView(rawBoundingBoxRef.current, 1.0);
    }
  };

  const resetCamera = () => {
    if (rawBoundingBoxRef.current) {
      frameModelInView(rawBoundingBoxRef.current, modelScale);
    } else if (cameraRef.current && controlsRef.current) {
      const bedSize = gridDimension || 160;
      cameraRef.current.position.set(0, bedSize * 0.85, bedSize * 1.5);
      controlsRef.current.target.set(0, 40, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-gray-200/80 dark:border-white/[0.08] bg-[#050811] shadow-2xl flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        style={{ height }}
        className="w-full relative cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#080b11]/85 backdrop-blur-md flex flex-col items-center justify-center text-amber-400 gap-3 z-20">
          <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-amber-500/20" />
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
          <p className="text-[11px] text-gray-400 mt-1">Please provide a valid .stl or .3mf 3D model file (up to 100MB supported).</p>
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
                <span>⚡</span> Centered • No 160mm Limit
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
            <div className="flex items-center gap-1.5 bg-[#121824] px-2 py-1 rounded-xl border border-amber-500/20 shadow-inner">
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

          {/* Color palette */}
          <div className="flex items-center gap-1.5 mr-1">
            {['#f59e0b', '#d97706', '#fbbf24', '#ffffff', '#1f2937'].map((color) => (
              <button
                key={color}
                onClick={() => setMeshColor(color)}
                style={{ backgroundColor: color }}
                title={`Color ${color}`}
                className={`w-4 h-4 rounded-full border ${meshColor === color ? 'border-amber-400 scale-125 ring-2 ring-amber-400/40' : 'border-transparent'} transition-transform duration-300`}
              />
            ))}
          </div>

          {/* Wireframe toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
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
