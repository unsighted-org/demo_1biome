import * as THREE from 'three';
import { colors } from './colors';
import { 
  createAdvancedGlowMaterial, 
  createImprovedEarthMaterial,
} from './globe-helpers';
import type { OptimizationLevel } from './types';

export interface RenderingOptions {
  quality: 'low' | 'medium' | 'high';
  enablePostProcessing?: boolean;
  enableAtmosphere?: boolean;
  textureType?: 'blue-marble' | 'day' | 'night' | 'topology' | 'water';
  enableClouds?: boolean;
}

export class RenderingPipeline {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private materials: Map<string, THREE.Material>;
  private optimizationLevel: OptimizationLevel;
  private disposed: boolean = false;
  private skybox!: THREE.Mesh;
  private earthMesh?: THREE.Mesh;
  private cloudsMesh?: THREE.Mesh;
  private textureCache: Map<string, THREE.Texture> = new Map();

  constructor(canvas: HTMLCanvasElement, options: RenderingOptions) {
    this.materials = new Map();
    this.optimizationLevel = 'balanced';
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: options.quality !== 'low',
      alpha: true,
      powerPreference: options.quality === 'high' ? 'high-performance' : 'default'
    });
    this.initializeCamera();
    this.initializeScene();
    this.initializeRenderer(canvas, options);
    this.setupEarth();
  }

  private initializeScene() {
    // Create skybox
    const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
    const skyTexture = new THREE.TextureLoader().load('/night-sky.png');
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
    });
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skybox);
  }

  private async loadTexture(path: string): Promise<THREE.Texture> {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }
    
    return new Promise<THREE.Texture>((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        path,
        (texture) => {
          this.textureCache.set(path, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  public async setTextureType(type: RenderingOptions['textureType']) {
    if (!this.earthMesh) {
      return;
    }

    const texture = await this.loadTexture(
      type === 'blue-marble' ? '/earth-blue-marble.jpg' :
      type === 'day' ? '/earth-day.jpg' :
      type === 'night' ? '/earth-night.jpg' :
      type === 'topology' ? '/earth-topology.png' :
      type === 'water' ? '/earth-water.png' :
      '/earth-blue-marble.jpg'
    );

    const material = this.earthMesh.material as THREE.MeshStandardMaterial;
    material.map = texture;
    material.needsUpdate = true;
  }

  private async setupEarth() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const texture = await this.loadTexture('/earth-blue-marble.jpg');
    
    // Earth mesh
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      normalScale: new THREE.Vector2(0.05, 0.05),
      metalness: 0.1,
      roughness: 0.8,
    });
    
    this.earthMesh = new THREE.Mesh(geometry, earthMaterial);
    this.scene.add(this.earthMesh);

    // Clouds mesh
    const cloudTexture = await this.loadTexture('/clouds.png');
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
    });
    
    this.cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 64, 64),
      cloudsMaterial
    );
    this.scene.add(this.cloudsMesh);
  }

  private initializeCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
  }

  private initializeRenderer(canvas: HTMLCanvasElement, options: RenderingOptions) {
    // Apply theme colors
    this.renderer.setClearColor(new THREE.Color(colors.background), 0);
    
    if (this.renderer.capabilities.isWebGL2) {
      this.setupAdvancedFeatures(options);
    }

    // Mobile optimizations
    // optimizeForMobile(this.renderer);
  }

  private setupAdvancedFeatures(options: RenderingOptions) {
    if (options.enablePostProcessing) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }

    // Create and cache materials
    this.materials.set('earth', createImprovedEarthMaterial());

    if (options.enableAtmosphere) {
      this.materials.set('atmosphere', createAdvancedGlowMaterial());
    }
  }

  public getRotation(): { x: number; y: number } {
    if (!this.earthMesh) {
      return { x: 0, y: 0 };
    }
    return {
      x: this.earthMesh.rotation.x,
      y: this.earthMesh.rotation.y,
    };
  }

  setOptimizationLevel(level: OptimizationLevel) {
    this.optimizationLevel = level;
    this.updateRendererSettings();
  }

  private updateRendererSettings() {
    if (this.disposed) return;

    switch (this.optimizationLevel) {
      case 'performance':
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(
          window.innerWidth * 0.8,
          window.innerHeight * 0.8
        );
        break;
      case 'balanced':
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        break;
      case 'quality':
        this.renderer.setPixelRatio(window.devicePixelRatio * 1.5);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        break;
    }
  }

  render() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(position: THREE.Vector3, target: THREE.Vector3) {
    if (this.disposed) return;
    this.camera.position.copy(position);
    this.camera.lookAt(target);
  }

  addToScene(object: THREE.Object3D) {
    if (this.disposed) return;
    this.scene.add(object);
  }

  removeFromScene(object: THREE.Object3D) {
    if (this.disposed) return;
    this.scene.remove(object);
  }

  handleResize() {
    if (this.disposed) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateRendererSettings();
  }

  dispose() {
    this.disposed = true;
    
    // Dispose of materials
    this.materials.forEach(material => {
      if (material.dispose) {
        material.dispose();
      }
    });
    this.materials.clear();

    // Dispose of renderer
    this.renderer.dispose();

    // Clear scene
    this.scene.clear();
  }

  getMaterial(name: string): THREE.Material | undefined {
    return this.materials.get(name);
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
