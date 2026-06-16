self.onmessage = () => {
  self.postMessage({ ok: true, message: 'Raster export falls back to the main-thread canvas when OffscreenCanvas is unavailable.' });
};
