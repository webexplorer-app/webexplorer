import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  AmbientLight,
  MeshPhysicalMaterial,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type SupportedFormat = 'gltf' | '3mf' | 'stl' | 'obj';

@customElement('three-viewer')
export class ThreeViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .three-viewer {
      width: 100%;
      height: calc(100vh - 150px);
    }
    .canvas-container {
      width: 100%;
      height: 100%;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @property({ type: String })
  format: SupportedFormat = 'gltf';

  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.scene = null;
    this.camera = null;
  }

  firstUpdated() {
    this.initThree();
  }

  updated(changedProperties: Map<string, unknown>) {
    if ((changedProperties.has('file') || changedProperties.has('format')) && this.file) {
      this.loadModel();
    }
  }

  private initThree() {
    const container = this.shadowRoot?.querySelector('.canvas-container') as HTMLDivElement;
    if (!container) return;

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();
    controls.enablePan = true;
    controls.enableDamping = true;

    // Handle resize
    this.resizeObserver = new ResizeObserver(() => {
      if (this.renderer && this.camera && container) {
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
      }
    });
    this.resizeObserver.observe(container);

    // Animation loop
    const render = () => {
      if (!this.renderer || !this.scene || !this.camera) return;
      this.animationId = requestAnimationFrame(render);
      this.renderer.render(this.scene, this.camera);
    };
    render();

    if (this.file) {
      this.loadModel();
    }
  }

  private loadModel() {
    if (!this.file || !this.scene) return;

    const url = URL.createObjectURL(this.file);

    // Clear scene
    this.scene.clear();
    const light = new AmbientLight(0xffffff);
    light.position.set(0, 0, 50);
    this.scene.add(light);

    switch (this.format) {
      case 'gltf': {
        const loader = new GLTFLoader();
        loader.load(url, (model) => {
          this.scene?.add(model.scene);
        });
        break;
      }
      case 'stl': {
        const loader = new STLLoader();
        loader.load(url, (geometry) => {
          const material = new MeshPhysicalMaterial({
            color: 0xb2ffc8,
            metalness: 0.25,
            roughness: 0.1,
            opacity: 1.0,
            transparent: true,
            transmission: 0.99,
            clearcoat: 1.0,
            clearcoatRoughness: 0.25,
          });
          this.scene?.add(new Mesh(geometry, material));
        });
        break;
      }
      case '3mf': {
        const loader = new ThreeMFLoader();
        loader.load(url, (model) => {
          this.scene?.add(model);
        });
        break;
      }
      case 'obj': {
        const loader = new OBJLoader();
        loader.load(url, (model) => {
          this.scene?.add(model);
        });
        break;
      }
    }
  }

  render() {
    return html`
      <div class="three-viewer">
        <div class="canvas-container"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'three-viewer': ThreeViewer;
  }
}
