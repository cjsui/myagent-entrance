import './style.css';
import { ParticleNetwork } from './scene/particleNetwork';
import { initOverlay } from './ui/overlay';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const network = new ParticleNetwork(canvas);
network.start();

initOverlay();
