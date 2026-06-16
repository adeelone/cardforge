self.onmessage = () => {
  self.postMessage({ ok: false, message: 'Background removal is feature-flagged and not bundled in the default build.' });
};
