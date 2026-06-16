import { paletteFromSeed } from '../lib/contrast';

self.onmessage = (event: MessageEvent<{ seed: string }>) => {
  self.postMessage({ palette: paletteFromSeed(event.data.seed) });
};
