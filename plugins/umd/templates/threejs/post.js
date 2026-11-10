// Deterministic post-processing for a three.js film rendered by `umd capture`: bloom, miniature depth of field,
// grain and vignette, all driven by the film time `t` (never by a clock, never by Math.random).
// Needs three's addons; with an import map: "three": ".../three.module.js", "three/addons/": ".../examples/jsm/".
//
//   import { createPost } from "./post.js";
//   const post = createPost(renderer, scene, camera, { bloom: 0.6, focus: 6, aperture: 0.004, grain: 0.05, vignette: 0.35 });
//   window.umdRender = async (t) => { await ready; shot(t); post.render(t); };
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// grain from a hash of pixel and frame: the same frame always gets the same grain, two renders are identical
const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uGrain: { value: 0.05 }, uVignette: { value: 0.35 } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uFrame, uGrain, uVignette; varying vec2 vUv;
    float hash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float g = hash(vec3(gl_FragCoord.xy, uFrame)) - 0.5;
      c.rgb += g * uGrain;                                              // grain also hides banding in dark gradients
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - uVignette * smoothstep(0.35, 0.85, length(d * vec2(1.0, 0.8)));
      gl_FragColor = c;
    }`,
};

export function createPost(renderer, scene, camera, o = {}) {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let bokeh = null;
  if (o.focus) {                                                       // miniature look: short focus, small aperture value
    bokeh = new BokehPass(scene, camera, { focus: o.focus, aperture: o.aperture ?? 0.004, maxblur: o.maxblur ?? 0.01 });
    composer.addPass(bokeh);
  }
  if (o.bloom) composer.addPass(new UnrealBloomPass(size, o.bloom, o.bloomRadius ?? 0.4, o.bloomThreshold ?? 0.85));
  composer.addPass(new OutputPass());                                  // tone mapping and colour space, then the finish
  const finish = new ShaderPass(FinishShader);
  finish.uniforms.uGrain.value = o.grain ?? 0.05;
  finish.uniforms.uVignette.value = o.vignette ?? 0.35;
  composer.addPass(finish);
  const fps = o.fps ?? 30;
  return {
    composer,
    setFocus(distance) { if (bokeh) bokeh.uniforms.focus.value = distance; },  // animate a focus pull from t
    render(t) {
      finish.uniforms.uFrame.value = Math.round(t * fps);
      composer.render();
    },
  };
}
