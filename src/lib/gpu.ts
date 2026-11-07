// One WebGL probe, shared by the badge and its 3D chunk.
//  - webgl: a hardware-accelerated context is available. `failIfMajorPerformanceCaveat`
//    refuses the CPU fallbacks (SwiftShader, llvmpipe, Microsoft Basic Render Driver) that
//    Chrome/Edge hand out when the GPU is blocklisted, where physics + PBR crawl at a few fps.
//  - integrated: an Intel iGPU, which gets the cheaper render settings.
// The probe context is released straight away: browsers cap live WebGL contexts, and a
// leaked probe would evict the badge's real canvas.

export type GpuInfo = { webgl: boolean; integrated: boolean };

const SOFTWARE = /swiftshader|llvmpipe|softpipe|basic render|software/i;
const INTEGRATED = /intel/i;

let cached: GpuInfo | null = null;

export function probeGpu(): GpuInfo {
  if (cached) return cached;
  cached = { webgl: false, integrated: false };
  if (typeof document === 'undefined') return cached;
  try {
    const c = document.createElement('canvas');
    const opts = { failIfMajorPerformanceCaveat: true };
    const gl = (c.getContext('webgl2', opts) || c.getContext('webgl', opts)) as WebGLRenderingContext | null;
    if (gl) {
      // Firefox reports the (sanitized) GPU directly and warns if the debug extension is
      // used; Chromium/Safari mask it as "WebKit WebGL" and need the extension
      let renderer = String(gl.getParameter(gl.RENDERER) ?? '');
      if (/webkit webgl/i.test(renderer)) {
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '') : '';
      }
      cached = { webgl: !SOFTWARE.test(renderer), integrated: INTEGRATED.test(renderer) };
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    // no WebGL at all: keep the static badge
  }
  return cached;
}
