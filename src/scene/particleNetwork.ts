import * as THREE from 'three';

const NODE_COUNT_DESKTOP = 160;
const NODE_COUNT_MOBILE = 80;
const CONNECT_DISTANCE = 2.2;
const MOBILE_BREAKPOINT = 768;
const BOUND = 8;

export function isMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT || 'ontouchstart' in window;
}

export class ParticleNetwork {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private nodes: THREE.Points;
  private nodePositions: Float32Array;
  private nodeVelocities: Float32Array;
  private lineGeometry: THREE.BufferGeometry;
  private lineSegments: THREE.LineSegments;
  private mobile: boolean;
  private raf = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.mobile = isMobile();
    const nodeCount = this.mobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070f);
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.06);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.z = 12;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.nodePositions = new Float32Array(nodeCount * 3);
    this.nodeVelocities = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      this.nodePositions[i * 3] = (Math.random() - 0.5) * 16;
      this.nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      this.nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      this.nodeVelocities[i * 3] = (Math.random() - 0.5) * 0.004;
      this.nodeVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      this.nodeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(this.nodePositions, 3));
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    this.nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    this.scene.add(this.nodes);

    const maxSegments = nodeCount * 8;
    this.lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxSegments * 2 * 3);
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.35,
    });
    this.lineSegments = new THREE.LineSegments(this.lineGeometry, lineMaterial);
    this.scene.add(this.lineSegments);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private updateNodes(): void {
    for (let i = 0; i < this.nodePositions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        this.nodePositions[i + axis] += this.nodeVelocities[i + axis];
        if (this.nodePositions[i + axis] > BOUND || this.nodePositions[i + axis] < -BOUND) {
          this.nodeVelocities[i + axis] *= -1;
        }
      }
    }
    (this.nodes.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateConnections(): void {
    const positions = this.nodePositions;
    const linePositions = this.lineGeometry.attributes.position.array as Float32Array;
    const nodeCount = positions.length / 3;
    const maxSegments = linePositions.length / 6;
    let segmentIndex = 0;

    for (let i = 0; i < nodeCount && segmentIndex < maxSegments; i++) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];
      for (let j = i + 1; j < nodeCount && segmentIndex < maxSegments; j++) {
        const dx = ix - positions[j * 3];
        const dy = iy - positions[j * 3 + 1];
        const dz = iz - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
          const base = segmentIndex * 6;
          linePositions[base] = ix;
          linePositions[base + 1] = iy;
          linePositions[base + 2] = iz;
          linePositions[base + 3] = positions[j * 3];
          linePositions[base + 4] = positions[j * 3 + 1];
          linePositions[base + 5] = positions[j * 3 + 2];
          segmentIndex++;
        }
      }
    }

    this.lineGeometry.setDrawRange(0, segmentIndex * 2);
    (this.lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.updateNodes();
    this.updateConnections();
    this.scene.rotation.y += 0.0006;
    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.nodes.geometry.dispose();
    (this.nodes.material as THREE.Material).dispose();
    this.lineGeometry.dispose();
    (this.lineSegments.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
