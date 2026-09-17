import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  MEASURED_GIF_TIMELINES,
  type MeasuredGifBlob,
  type MeasuredGifFrame,
} from './sidekick-icon-shader-timeline';

export type SidekickIconState =
  | 'idle'
  | 'focused'
  | 'typing'
  | 'thinking'
  | 'active'
  | 'loading';

export type SidekickIconTheme = 'light' | 'dark';

type CanonicalSidekickState = 'idle' | 'focused' | 'typing' | 'thinking';
type FaceTimelineName = 'gif-black' | 'gif-blue' | 'gif-white';

type StateConfig = {
  orbSpeed: number;
  orbRadius: number;
  faceRate: number;
  lerpSpeed: number;
  orbSize: number;
  fieldOrbScale: number;
  c1: string;
  c2: string;
  c3: string;
  blobMixMode: number;
  blobHueHold: number;
  overlapBoost: number;
  fieldFill: number;
  blobSize: number;
  blobSoft: number;
  blobOpacity: number;
  maskEdge: number;
  maskSoft: number;
  innerGlow: number;
  noiseAmt: number;
  particleStyle: number;
  particleCount: number;
  particleTint: string;
  particleOpacity: number;
  particleGlow: number;
  particleBlend: number;
  particleScale: number;
  particlePointSize: number;
  particleSpread: number;
  particleSpeed: number;
  particleDrift: number;
  faceScale: number;
  faceOpacity: number;
  faceOffsetY: number;
  faceBlendMode: number;
  faceColor: string;
  faceColorMix: number;
  faceTimeline: FaceTimelineName;
  faceRoundness: number;
  faceSoftness: number;
  faceLoaderScale: number;
  tiltAx: number;
  tiltAy: number;
  tiltBx: number;
  tiltBy: number;
  tiltCx: number;
  tiltCy: number;
};

const LIGHT_STATE_CONFIGS = {
  idle: {
    orbSpeed: 1.1,
    orbRadius: 0.22,
    faceRate: 1,
    lerpSpeed: 5,
    orbSize: 290,
    fieldOrbScale: 0.23,
    c1: '#d35cff',
    c2: '#6f5cff',
    c3: '#6647ff',
    blobMixMode: 3,
    blobHueHold: 0.1,
    overlapBoost: 0,
    fieldFill: 0.28,
    blobSize: 0.17,
    blobSoft: 0.24,
    blobOpacity: 0.27,
    maskEdge: 0.29,
    maskSoft: 0.2,
    innerGlow: 1,
    noiseAmt: 0,
    particleStyle: 0,
    particleCount: 890,
    particleTint: '#f2f7ff',
    particleOpacity: 0.83,
    particleGlow: 0.16,
    particleBlend: 0,
    particleScale: 1.8,
    particlePointSize: 4.25,
    particleSpread: 2.1,
    particleSpeed: 0.45,
    particleDrift: 3.55,
    faceScale: 1.25,
    faceOpacity: 0.94,
    faceOffsetY: 0,
    faceBlendMode: 0,
    faceColor: '#3a2a5a',
    faceColorMix: 1,
    faceTimeline: 'gif-blue',
    faceRoundness: 1,
    faceSoftness: 0.75,
    faceLoaderScale: 1,
    tiltAx: 2,
    tiltAy: 0.67,
    tiltBx: 2.4,
    tiltBy: 0.4,
    tiltCx: 2.1,
    tiltCy: 1.5,
  },
  focused: {
    orbSpeed: 3.3,
    orbRadius: 0.22,
    faceRate: 1,
    lerpSpeed: 5,
    orbSize: 290,
    fieldOrbScale: 0.23,
    c1: '#5c61ff',
    c2: '#5c67ff',
    c3: '#8847ff',
    blobMixMode: 3,
    blobHueHold: 0.1,
    overlapBoost: 0,
    fieldFill: 0.28,
    blobSize: 0.17,
    blobSoft: 0.24,
    blobOpacity: 0.66,
    maskEdge: 0.29,
    maskSoft: 0.2,
    innerGlow: 1,
    noiseAmt: 0,
    particleStyle: 0,
    particleCount: 1120,
    particleTint: '#f2f7ff',
    particleOpacity: 0.43,
    particleGlow: 1,
    particleBlend: 0,
    particleScale: 2.4,
    particlePointSize: 5,
    particleSpread: 1.65,
    particleSpeed: 1,
    particleDrift: 1,
    faceScale: 1.25,
    faceOpacity: 0.95,
    faceOffsetY: 0,
    faceBlendMode: 0,
    faceColor: '#3a2a5a',
    faceColorMix: 1,
    faceTimeline: 'gif-blue',
    faceRoundness: 1,
    faceSoftness: 0.75,
    faceLoaderScale: 1,
    tiltAx: 2,
    tiltAy: 0.67,
    tiltBx: 2.4,
    tiltBy: 0.4,
    tiltCx: 2.1,
    tiltCy: 1.5,
  },
  typing: {
    orbSpeed: 3.3,
    orbRadius: 0.22,
    faceRate: 1,
    lerpSpeed: 5,
    orbSize: 290,
    fieldOrbScale: 0.23,
    c1: '#5c61ff',
    c2: '#5c67ff',
    c3: '#8847ff',
    blobMixMode: 3,
    blobHueHold: 0.1,
    overlapBoost: 0,
    fieldFill: 0.28,
    blobSize: 0.17,
    blobSoft: 0.24,
    blobOpacity: 0.66,
    maskEdge: 0.29,
    maskSoft: 0.2,
    innerGlow: 1,
    noiseAmt: 0,
    particleStyle: 0,
    particleCount: 1120,
    particleTint: '#f2f7ff',
    particleOpacity: 0.43,
    particleGlow: 1,
    particleBlend: 0,
    particleScale: 2.4,
    particlePointSize: 5,
    particleSpread: 1.65,
    particleSpeed: 1,
    particleDrift: 1,
    faceScale: 1.25,
    faceOpacity: 0.95,
    faceOffsetY: 0,
    faceBlendMode: 0,
    faceColor: '#3a2a5a',
    faceColorMix: 1,
    faceTimeline: 'gif-blue',
    faceRoundness: 1,
    faceSoftness: 0.75,
    faceLoaderScale: 1,
    tiltAx: 2,
    tiltAy: 0.67,
    tiltBx: 2.4,
    tiltBy: 0.4,
    tiltCx: 2.1,
    tiltCy: 1.5,
  },
  thinking: {
    orbSpeed: 4.7,
    orbRadius: 0.22,
    faceRate: 1,
    lerpSpeed: 5,
    orbSize: 290,
    fieldOrbScale: 0.23,
    c1: '#d35cff',
    c2: '#5f5cff',
    c3: '#6647ff',
    blobMixMode: 3,
    blobHueHold: 0.1,
    overlapBoost: 0,
    fieldFill: 0.28,
    blobSize: 0.17,
    blobSoft: 0.24,
    blobOpacity: 0.66,
    maskEdge: 0.31,
    maskSoft: 0.2,
    innerGlow: 1,
    noiseAmt: 0,
    particleStyle: 0,
    particleCount: 1210,
    particleTint: '#f2f7ff',
    particleOpacity: 1,
    particleGlow: 1,
    particleBlend: 0,
    particleScale: 3.95,
    particlePointSize: 4.8,
    particleSpread: 1.65,
    particleSpeed: 1.6,
    particleDrift: 3.4,
    faceScale: 1.25,
    faceOpacity: 0.95,
    faceOffsetY: 0,
    faceBlendMode: 0,
    faceColor: '#3a2a5a',
    faceColorMix: 1,
    faceTimeline: 'gif-blue',
    faceRoundness: 1,
    faceSoftness: 0.75,
    faceLoaderScale: 1,
    tiltAx: 2,
    tiltAy: 0.67,
    tiltBx: 2.4,
    tiltBy: 0.4,
    tiltCx: 2.1,
    tiltCy: 1.5,
  },
} satisfies Record<CanonicalSidekickState, StateConfig>;

const DARK_FOCUSED_STATE = {
  ...LIGHT_STATE_CONFIGS.focused,
  c1: '#441c59',
  c2: '#3d1075',
  c3: '#1b0f75',
  fieldFill: 0.22,
  blobSize: 0.26,
  blobOpacity: 1,
  innerGlow: 0.88,
  particleTint: '#dfe8ff',
  particleOpacity: 0.52,
  particleGlow: 1.15,
  faceScale: 1.25,
  faceOpacity: 0.95,
  faceColor: '#111217',
  faceColorMix: 0.78,
  faceTimeline: 'gif-black',
  faceRoundness: 1,
  faceSoftness: 0.75,
  faceLoaderScale: 1,
} satisfies StateConfig;

const DARK_STATE_CONFIGS = {
  idle: {
    ...LIGHT_STATE_CONFIGS.idle,
    orbRadius: 0.15,
    c1: '#892c9b',
    c2: '#3836ab',
    c3: '#1a1f37',
    fieldFill: 0.2,
    blobOpacity: 0.69,
    maskEdge: 0.33,
    innerGlow: 0.82,
    particleTint: '#dfe8ff',
    particleOpacity: 0.21,
    particleGlow: 0.34,
    faceScale: 1.25,
    faceOpacity: 0.88,
    faceColor: '#000000',
    faceColorMix: 0.72,
    faceTimeline: 'gif-black',
    faceRoundness: 1,
    faceSoftness: 0.75,
    faceLoaderScale: 1,
  },
  focused: DARK_FOCUSED_STATE,
  typing: { ...DARK_FOCUSED_STATE },
  thinking: {
    ...LIGHT_STATE_CONFIGS.thinking,
    c1: '#902191',
    c2: '#4c1eb8',
    c3: '#341d86',
    fieldFill: 0.24,
    blobSize: 0.23,
    blobOpacity: 0.76,
    innerGlow: 0.95,
    particleTint: '#e5edff',
    particleOpacity: 0.88,
    particleGlow: 1.2,
    faceScale: 1.25,
    faceOpacity: 0.95,
    faceColor: '#111217',
    faceColorMix: 0.82,
    faceTimeline: 'gif-black',
    faceRoundness: 1,
    faceSoftness: 0.75,
    faceLoaderScale: 1,
  },
} satisfies Record<CanonicalSidekickState, StateConfig>;

const STATE_CONFIGS = {
  light: LIGHT_STATE_CONFIGS,
  dark: DARK_STATE_CONFIGS,
} satisfies Record<
  SidekickIconTheme,
  Record<CanonicalSidekickState, StateConfig>
>;

const LERP_KEYS = [
  'orbSpeed',
  'orbRadius',
  'faceRate',
  'orbSize',
  'fieldOrbScale',
  'blobSize',
  'blobSoft',
  'blobOpacity',
  'blobHueHold',
  'overlapBoost',
  'fieldFill',
  'maskEdge',
  'maskSoft',
  'innerGlow',
  'noiseAmt',
  'particleCount',
  'particleOpacity',
  'particleGlow',
  'particleScale',
  'particlePointSize',
  'particleSpread',
  'particleSpeed',
  'particleDrift',
  'faceScale',
  'faceOpacity',
  'faceOffsetY',
  'faceColorMix',
  'faceRoundness',
  'faceSoftness',
  'faceLoaderScale',
  'tiltAx',
  'tiltAy',
  'tiltBx',
  'tiltBy',
  'tiltCx',
  'tiltCy',
] as const;

const COLOR_KEYS = ['c1', 'c2', 'c3', 'faceColor', 'particleTint'] as const;
const IDLE_BLINK = {
  blinkStart: 0,
  blinkEnd: 0.35,
  pauseMin: 2,
  pauseMax: 3.5,
};
const FACE_PLAYBACK_PRESETS: Partial<
  Record<
    CanonicalSidekickState,
    {
      play: 'segment' | 'loop';
      segmentStartSeconds?: number;
      segmentEndSeconds?: number;
      phaseSeconds: number;
      speed: number;
    }
  >
> = {
  focused: {
    play: 'segment',
    segmentStartSeconds: 0.4,
    segmentEndSeconds: 3.5,
    phaseSeconds: 0,
    speed: 1,
  },
  typing: {
    play: 'segment',
    segmentStartSeconds: 0.4,
    segmentEndSeconds: 3.5,
    phaseSeconds: 0,
    speed: 1,
  },
  thinking: {
    play: 'segment',
    segmentStartSeconds: 5.6,
    segmentEndSeconds: 10,
    phaseSeconds: 0,
    speed: 1,
  },
};

const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUV;
void main() {
  vUV = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec2 vUV;
uniform sampler2D uParticles;
uniform float uTime;
uniform vec3 uBlobA, uBlobB, uBlobC;
uniform float uOrbRadius, uBlobSize, uBlobSoft, uBlobOpacity;
uniform float uBlobHueHold, uOverlapBoost, uFieldFill;
uniform int uBlobMixMode;
uniform vec2 uTiltA, uTiltB, uTiltC;
uniform float uFaceScale, uFaceOpacity, uFaceOffsetY;
uniform vec2 uFaceOffset;
uniform float uFaceRotation;
uniform vec3 uFaceColor;
uniform float uFaceColorMix;
uniform int uBlendMode;
uniform vec4 uFaceMeta;
uniform vec4 uFaceLeft;
uniform vec4 uFaceRight;
uniform vec4 uFaceMouth;
uniform vec4 uFaceRaw0;
uniform vec4 uFaceRaw1;
uniform vec4 uFaceRaw2;
uniform vec4 uFaceRawRot;
uniform vec4 uFaceBends;
uniform float uMaskEdge, uMaskSoft, uInnerGlow, uNoiseAmt;
uniform float uParticleOpacity;
uniform int uParticleBlend;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float blob(vec2 uv, vec2 center, float size, float soft) {
  float d = length(uv - center);
  float inner = max(size - soft * 0.5, 0.0);
  float outer = size + soft;
  return 1.0 - smoothstep(inner, outer, d);
}

vec2 rotate2(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float sdRoundBox(vec2 p, vec2 halfSize, float radius) {
  radius = min(radius, min(halfSize.x, halfSize.y));
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float shapeAlpha(float d, float softness) {
  float aa = max(fwidth(d), softness);
  return 1.0 - smoothstep(-aa, aa, d);
}

float measuredBlobDistance(vec2 p, vec2 center, vec2 size, float rotation, float roundness, float bend) {
  vec2 halfSize = max(size * 0.5, vec2(0.7));
  float radius = min(halfSize.x, halfSize.y) * roundness;
  return sdRoundBox(rotate2(p - center, -rotation), halfSize, radius);
}

float shaderFaceAlpha(vec2 faceUV) {
  vec2 p = (faceUV - 0.5) * 500.0;
  p -= uFaceOffset;
  p = rotate2(p, -uFaceRotation) / max(uFaceScale, 0.0001);

  float roundness = max(uFaceMeta.x, 0.05);
  float softness = max(uFaceMeta.y, 0.001);
  float rawMode = uFaceMeta.z;
  float rawCount = uFaceMeta.w;
  float leftEyeBend = uFaceBends.x;
  float rightEyeBend = uFaceBends.y;
  float mouthBend = uFaceBends.z;

  float dLeft = 9999.0;
  float dRight = 9999.0;
  float dMouth = 9999.0;

  if (rawMode > 0.5) {
    if (rawCount > 0.5) dLeft = measuredBlobDistance(p, uFaceRaw0.xy, uFaceRaw0.zw, uFaceRawRot.x, roundness, 0.0);
    if (rawCount > 1.5) dMouth = measuredBlobDistance(p, uFaceRaw1.xy, uFaceRaw1.zw, uFaceRawRot.y, roundness, 0.0);
    if (rawCount > 2.5) dRight = measuredBlobDistance(p, uFaceRaw2.xy, uFaceRaw2.zw, uFaceRawRot.z, roundness, 0.0);
  } else {
    dLeft = measuredBlobDistance(p, uFaceLeft.xy, uFaceLeft.zw, uFaceRawRot.x, roundness, leftEyeBend);
    dRight = measuredBlobDistance(p, uFaceRight.xy, uFaceRight.zw, uFaceRawRot.z, roundness, rightEyeBend);
    dMouth = measuredBlobDistance(p, uFaceMouth.xy, uFaceMouth.zw, uFaceRawRot.y, roundness, mouthBend);
  }

  float faceBounds = 1.0 - smoothstep(118.0, 124.0, length(p));
  return max(max(shapeAlpha(dLeft, softness), shapeAlpha(dRight, softness)), shapeAlpha(dMouth, softness)) * faceBounds;
}

vec3 orbit3D(float t, float phase, float tiltX, float tiltY) {
  float x = cos(t + phase) * uOrbRadius;
  float y = sin(t + phase) * uOrbRadius;
  float z = 0.0;
  float cx = cos(tiltX), sx = sin(tiltX);
  float y2 = y * cx - z * sx;
  float z2 = y * sx + z * cx;
  y = y2; z = z2;
  float cy = cos(tiltY), sy = sin(tiltY);
  float x2 = x * cy + z * sy;
  float z3 = -x * sy + z * cy;
  return vec3(x2 + 0.5, y + 0.5, z3);
}

vec3 blendScreen(vec3 base, vec3 top) { return 1.0 - (1.0 - base) * (1.0 - top); }
vec3 blendOverlay(vec3 base, vec3 top) {
  return mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
}
vec3 blendMultiply(vec3 base, vec3 top) { return base * top; }
vec3 blendSoftLight(vec3 base, vec3 top) {
  return mix(
    2.0 * base * top + base * base * (1.0 - 2.0 * top),
    sqrt(base) * (2.0 * top - 1.0) + 2.0 * base * (1.0 - top),
    step(0.5, top)
  );
}
vec3 pickBlobMix(int mode, vec3 fluidColor, vec3 softAddColor, vec3 screenColor, vec3 additiveColor, vec3 dominantMix) {
  if (mode == 1) return softAddColor;
  if (mode == 2) return screenColor;
  if (mode == 3) return additiveColor;
  if (mode == 4) return dominantMix;
  return fluidColor;
}
vec3 blendParticles(int mode, vec3 base, vec3 particles, float orbAlpha) {
  float pBright = max(max(particles.r, particles.g), particles.b);
  if (mode == 1) return blendScreen(base, particles);
  if (mode == 2) return mix(particles, base, orbAlpha);
  if (mode == 3) return mix(base, particles, clamp(pBright, 0.0, 1.0));
  if (mode == 4) return blendOverlay(max(base, vec3(0.001)), particles);
  if (mode == 5) return blendMultiply(base + vec3(0.5), particles + vec3(0.5));
  return base + particles;
}

void main() {
  vec2 uv = vUV;
  float t = uTime;
  float distFromCenter = length(uv - 0.5);
  float mask = 1.0 - smoothstep(uMaskEdge - uMaskSoft, uMaskEdge, distFromCenter);
  if (mask <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec3 pos0 = orbit3D(t, 0.0, uTiltA.x, uTiltA.y);
  vec3 pos1 = orbit3D(t, 2.094, uTiltB.x, uTiltB.y);
  vec3 pos2 = orbit3D(t, 4.189, uTiltC.x, uTiltC.y);
  float depth0 = (pos0.z / max(uOrbRadius, 0.01)) * 0.5 + 0.5;
  float depth1 = (pos1.z / max(uOrbRadius, 0.01)) * 0.5 + 0.5;
  float depth2 = (pos2.z / max(uOrbRadius, 0.01)) * 0.5 + 0.5;

  float b0 = blob(uv, pos0.xy, uBlobSize * (0.8 + depth0 * 0.4), uBlobSoft);
  float b1 = blob(uv, pos1.xy, uBlobSize * (0.8 + depth1 * 0.4), uBlobSoft);
  float b2 = blob(uv, pos2.xy, uBlobSize * (0.8 + depth2 * 0.4), uBlobSoft);

  float totalBlob = b0 + b1 + b2;
  float huePower = mix(1.0, 4.0, uBlobHueHold);
  float w0 = pow(max(b0, 0.0), huePower);
  float w1 = pow(max(b1, 0.0), huePower);
  float w2 = pow(max(b2, 0.0), huePower);
  float weightTotal = max(w0 + w1 + w2, 0.0001);
  float coverage = 1.0 - (1.0 - b0) * (1.0 - b1) * (1.0 - b2);
  float overlap = smoothstep(0.85, 2.1, totalBlob);

  vec3 weightedColor = (uBlobA * w0 + uBlobB * w1 + uBlobC * w2) / weightTotal;
  vec3 avgColor = (uBlobA + uBlobB + uBlobC) / 3.0;
  vec3 additiveColor = uBlobA * b0 + uBlobB * b1 + uBlobC * b2;
  vec3 screenColor = 1.0 - (1.0 - uBlobA * b0) * (1.0 - uBlobB * b1) * (1.0 - uBlobC * b2);
  vec3 softAddColor = 1.0 - exp(-additiveColor * (1.0 + uOverlapBoost));
  vec3 dominantColor = uBlobA;
  if (b1 >= b0 && b1 >= b2) dominantColor = uBlobB;
  if (b2 >= b0 && b2 >= b1) dominantColor = uBlobC;

  vec3 fluidColor = weightedColor * (0.96 + coverage * 0.08 + overlap * uOverlapBoost);
  vec3 dominantMix = mix(weightedColor, dominantColor, 0.68) * (0.96 + coverage * 0.08 + overlap * uOverlapBoost);
  vec3 orbColor = pickBlobMix(uBlobMixMode, fluidColor, softAddColor, screenColor, additiveColor, dominantMix);

  float coreFill = 1.0 - smoothstep(0.0, uMaskEdge, distFromCenter);
  float fieldPresence = clamp(uFieldFill * (0.62 + coreFill * 0.38), 0.0, 1.0);
  vec3 fieldColor = mix(avgColor, weightedColor, clamp(totalBlob * 0.9, 0.0, 1.0));
  orbColor = mix(fieldColor, orbColor, clamp(coverage * 1.2, 0.0, 1.0));
  float orbAlpha = max(coverage * uBlobOpacity, fieldPresence);

  vec3 particles = texture2D(uParticles, vec2(uv.x, 1.0 - uv.y)).rgb * uParticleOpacity;
  float particleA = max(max(particles.r, particles.g), particles.b);
  orbColor = blendParticles(uParticleBlend, orbColor, particles, orbAlpha);

  vec2 faceCenter = vec2(0.5, 0.5 + uFaceOffsetY);
  vec2 faceUV = uv - faceCenter + 0.5;
  float faceA = 0.0;
  vec3 faceRgb = vec3(0.0);
  vec3 faceTinted = vec3(0.0);
  if (faceUV.x >= 0.0 && faceUV.x <= 1.0 && faceUV.y >= 0.0 && faceUV.y <= 1.0) {
    faceA = shaderFaceAlpha(faceUV) * uFaceOpacity;
    faceTinted = mix(vec3(0.0), uFaceColor, uFaceColorMix);
    faceRgb = faceTinted;
  }

  vec3 color = orbColor;

  if (uBlendMode == 0) color = mix(color, faceTinted, faceA);
  else if (uBlendMode == 1) color = mix(color, blendScreen(color, faceRgb), faceA);
  else if (uBlendMode == 2) color = mix(color, blendOverlay(color, faceRgb), faceA);
  else if (uBlendMode == 3) color = mix(color, blendMultiply(color, faceRgb), faceA);
  else color = mix(color, blendSoftLight(color, faceRgb), faceA);

  float glowInner = smoothstep(0.15, max(uMaskEdge - 0.02, 0.151), distFromCenter);
  float glowOuter = 1.0 - smoothstep(max(uMaskEdge - 0.1, 0.0), uMaskEdge, distFromCenter);
  float glowRing = glowInner * glowOuter;
  color = mix(color, avgColor, glowRing * uInnerGlow * 0.26);
  color += avgColor * glowRing * uInnerGlow * 0.08;
  color += (hash(uv * 800.0 + uTime * 100.0) - 0.5) * uNoiseAmt;

  float alpha = max(max(orbAlpha, faceA), particleA) * mask;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
}
`;

const PARTICLE_GLOW_VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUV;
void main() {
  vUV = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const PARTICLE_GLOW_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUV;
uniform float uTime;
uniform vec3 uParticleTint;
uniform float uParticleGlow;
float colorSaturation(vec3 c) {
  float hi = max(max(c.r, c.g), c.b);
  float lo = min(min(c.r, c.g), c.b);
  return hi - lo;
}
void main() {
  float r = length(vUV);
  float core = exp(-r * r * 100.0) * 0.40;
  float mid = exp(-r * r * 18.0) * 0.05;
  float sat = colorSaturation(uParticleTint);
  float tintMix = clamp(sat * 1.35, 0.0, 1.0);
  float glow = (core * mix(1.0, 0.14, tintMix) + mid) * uParticleGlow;
  glow *= 0.94 + 0.06 * sin(uTime * 0.8);
  vec3 tint = mix(vec3(0.92, 0.94, 1.0), uParticleTint, tintMix);
  gl_FragColor = vec4(tint * glow, glow);
}
`;

const PARTICLE_VERTEX_SHADER = `
precision highp float;
attribute float aId;
varying vec3 vColor;
varying float vAlpha;
varying float vBlur;
varying float vStyle;
varying float vSparkle;
uniform float uTime;
uniform vec2 uViewportSize;
uniform float uPitch, uYaw, uRoll;
uniform vec3 uParticleTint;
uniform float uParticleStyle;
uniform float uParticleScale;
uniform float uParticlePointSize;
uniform float uParticleSpread;
float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
vec3 hash3(float n) {
  return fract(sin(vec3(n, n + 1.0, n + 2.0) * 12.9898) * vec3(43758.5453, 22578.1459, 19642.3490));
}
vec3 unitVec(float u, float v) {
  float theta = u * 6.28318530718;
  float z = 2.0 * v - 1.0;
  float r = sqrt(max(0.0, 1.0 - z * z));
  return vec3(r * cos(theta), r * sin(theta), z);
}
vec3 rodrigues(vec3 v, vec3 ax, float angle) {
  float c = cos(angle), s = sin(angle);
  return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1.0 - c);
}
vec3 headRotate(vec3 v, float pitch, float yaw, float roll) {
  float cp = cos(pitch), sp = sin(pitch);
  vec3 v1 = vec3(v.x, cp * v.y - sp * v.z, sp * v.y + cp * v.z);
  float cy = cos(yaw), sy = sin(yaw);
  vec3 v2 = vec3(cy * v1.x + sy * v1.z, v1.y, -sy * v1.x + cy * v1.z);
  float cr = cos(roll), sr = sin(roll);
  return vec3(cr * v2.x - sr * v2.y, sr * v2.x + cr * v2.y, v2.z);
}
float colorSaturation(vec3 c) {
  float hi = max(max(c.r, c.g), c.b);
  float lo = min(min(c.r, c.g), c.b);
  return hi - lo;
}
void main() {
  float id = aId;
  vec3 r1 = hash3(id * 0.137 + 3.71);
  vec3 r2 = hash3(id * 0.731 + 17.13);
  vec3 r3 = hash3(id * 1.923 + 91.57);
  float style = clamp(floor(uParticleStyle + 0.5), 0.0, 4.0);
  vec3 base = unitVec(r1.x, r1.y);
  vec3 ax = unitVec(r2.x, r2.y);
  float dir = mix(-1.0, 1.0, step(0.5, r3.x));
  float phase = r3.y * 6.2831853;
  float radius = mix(0.10, 0.42, pow(r1.z, 1.4)) * uParticleSpread;
  radius *= 1.0 + 0.05 * sin(uTime * 0.6 + id * 0.37);
  float speed = mix(0.035, 0.52, r2.z);
  vec3 p = rodrigues(base, ax, uTime * speed * dir + phase) * radius;
  float sizeBase = 0.90;
  float sizeBlur = 18.4;
  float alphaNear = 0.80;
  float alphaFar = 0.10;
  float sparkle = 0.0;
  float sat = colorSaturation(uParticleTint);
  if (style > 0.5 && style < 1.5) {
    float fAngle = uTime * mix(0.12, 0.38, r2.z) * dir + phase;
    vec3 driftAx = normalize(mix(ax, vec3(0.0, 1.0, 0.0), 0.24));
    vec3 fDir = rodrigues(base, driftAx, fAngle);
    float bob = sin(uTime * 0.64 + id * 0.21) * 0.018;
    p = normalize(fDir + unitVec(r2.x, r3.z) * bob) * mix(0.18, 0.43, pow(r1.z, 1.25));
    sparkle = pow(0.5 + 0.5 * sin(uTime * 2.8 + id * 1.91), 5.0);
    sizeBase = 1.30 + sparkle * 2.20;
    sizeBlur = 10.0;
    alphaNear = 0.42 + sparkle * 0.82;
    alphaFar = 0.08 + sparkle * 0.22;
  } else if (style > 1.5 && style < 2.5) {
    float aAngle = uTime * mix(0.10, 0.28, r2.z) * dir + phase;
    float wave = sin(base.y * 9.0 + aAngle * 2.0 + uTime * 0.9);
    vec3 aDir = rodrigues(base, vec3(0.0, 1.0, 0.0), wave * 0.18);
    aDir = rodrigues(aDir, ax, aAngle * 0.34);
    p = normalize(aDir) * mix(0.16, 0.44, pow(r1.z, 1.15));
    sparkle = 0.5 + 0.5 * sin(aAngle * 3.0 - uTime * 1.4);
    sizeBase = 1.10; sizeBlur = 22.0; alphaNear = 0.38; alphaFar = 0.16;
  } else if (style > 2.5 && style < 3.5) {
    float snap = floor(r1.x * 12.0) / 12.0;
    vec3 cBase = normalize(mix(base, unitVec(snap, r1.y), 0.55));
    float cRadius = mix(0.16, 0.46, pow(r2.z, 1.8));
    p = rodrigues(cBase, ax, uTime * mix(0.025, 0.22, r3.x) * dir + phase) * cRadius;
    sparkle = pow(0.5 + 0.5 * sin(uTime * 2.2 + id * 2.6), 9.0);
    sizeBase = 0.65 + sparkle * 1.80;
    sizeBlur = 14.0; alphaNear = 0.76 + sparkle * 0.50; alphaFar = 0.12;
  } else if (style > 3.5 && style < 4.5) {
    float latTwist = base.y * 5.2 + uTime * mix(0.18, 0.34, r2.z) * dir;
    vec3 pDir = rodrigues(base, vec3(0.0, 1.0, 0.0), latTwist);
    pDir = rodrigues(pDir, ax, sin(uTime * 0.55 + id) * 0.16);
    float pRadius = mix(0.12, 0.43, pow(r1.z, 1.55)) + 0.012 * sin(uTime * 0.72 + id);
    p = normalize(pDir) * pRadius;
    sparkle = pow(0.5 + 0.5 * sin(uTime * 1.65 + id * 1.31), 4.0);
    sizeBase = 0.75 + sparkle * 2.60;
    sizeBlur = 16.0; alphaNear = 0.68 + sparkle * 0.62; alphaFar = 0.12 + sparkle * 0.12;
  }
  p = headRotate(p, uPitch, uYaw, uRoll);
  float camZ = 1.0;
  float focal = 1.5;
  float depth = max(camZ - p.z, 0.05);
  float ndcX = (p.x * focal / depth) * uParticleScale;
  float ndcY = (p.y * focal / depth) * uParticleScale;
  float defocus = clamp(abs(p.z) * 2.9 - 0.14, 0.0, 1.0);
  float scale = uViewportSize.y / 900.0;
  float sizeSeed = hash1(id * 0.419 + 8.17);
  float sizeJitter = mix(0.50, 2.28, pow(sizeSeed, 2.05));
  float sz = (sizeBase + defocus * sizeBlur) * scale * (0.7 / depth) * sizeJitter * uParticlePointSize;
  float tMix = clamp(sat * 4.0, 0.0, 1.0);
  vec3 activeColor = mix(vec3(1.0), uParticleTint, tMix);
  float brightness = mix(0.58, 1.22, 1.0 - defocus) + sparkle * 0.36;
  vec3 col = min(activeColor * brightness, vec3(1.0));
  float frontW = smoothstep(-0.05, 0.32, p.z);
  col = mix(col, uParticleTint, clamp(frontW * sat * 1.05, 0.0, 0.75));
  float alpha = mix(alphaNear, alphaFar, defocus);
  alpha *= mix(1.14, 0.62, clamp(sizeJitter / 2.28, 0.0, 1.0));
  alpha *= mix(1.0, 0.70, smoothstep(0.0, 1.0, -p.z / 0.4));
  gl_Position = vec4(ndcX, ndcY, 0.5, 1.0);
  gl_PointSize = clamp(sz, 1.0, 180.0);
  vColor = col;
  vAlpha = alpha;
  vBlur = defocus;
  vStyle = style;
  vSparkle = sparkle;
}
`;

const PARTICLE_FRAGMENT_SHADER = `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
varying float vBlur;
varying float vStyle;
varying float vSparkle;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  float sharp = mix(5.5, 1.3, vBlur);
  float mask = exp(-d * d * sharp * 3.0);
  mask += (1.0 - vBlur) * exp(-d * d * 24.0) * 0.9;
  if (vStyle > 2.5 && vStyle < 3.5) {
    float ang = atan(c.y, c.x);
    float rays = pow(abs(cos(ang * 4.0)), 18.0) * smoothstep(1.0, 0.10, d);
    mask += rays * (0.18 + vSparkle * 0.62);
  } else if (vStyle > 3.5 && vStyle < 4.5) {
    float ang = atan(c.y, c.x);
    float rays = pow(abs(cos(ang * 5.0)), 10.0) * smoothstep(0.95, 0.05, d);
    mask += rays * (0.12 + vSparkle * 0.42);
    mask += exp(-d * d * 42.0) * vSparkle * 0.85;
  } else if (vStyle > 0.5 && vStyle < 1.5) {
    mask += exp(-d * d * 18.0) * vSparkle * 0.75;
  }
  float a = mask * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}
`;

const MAX_PARTICLES = 3000;

function canonicalState(state: SidekickIconState): CanonicalSidekickState {
  if (state === 'active') return 'focused';
  if (state === 'loading') return 'thinking';
  return state;
}

function getStateConfig(
  theme: SidekickIconTheme,
  state: CanonicalSidekickState,
) {
  return STATE_CONFIGS[theme][state];
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hexToGL(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}

function rgbToHex(r: number, g: number, b: number) {
  const clampByte = (value: number) =>
    Math.max(0, Math.min(255, Math.round(Number.isFinite(value) ? value : 0)));

  return `#${((1 << 24) + (clampByte(r) << 16) + (clampByte(g) << 8) + clampByte(b)).toString(16).slice(1)}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  let red = r / 255;
  let green = g / 255;
  let blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return [(hue + 360) % 360, saturation, lightness] as const;
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return [(red + m) * 255, (green + m) * 255, (blue + m) * 255] as const;
}

function lerpColor(from: string, to: string, factor: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const ah = rgbToHsl(a[0], a[1], a[2]);
  const bh = rgbToHsl(b[0], b[1], b[2]);
  let hueDelta = bh[0] - ah[0];
  const preferCoolPath = ah[0] > 180 && bh[0] < 160 && hueDelta < 0;

  if (!preferCoolPath) {
    if (hueDelta > 180) hueDelta -= 360;
    if (hueDelta < -180) hueDelta += 360;
  }

  const hue = (ah[0] + hueDelta * factor + 360) % 360;
  const saturation = ah[1] + (bh[1] - ah[1]) * factor;
  const lightness = ah[2] + (bh[2] - ah[2]) * factor;
  const rgb = hslToRgb(hue, saturation, lightness);

  return rgbToHex(rgb[0], rgb[1], rgb[2]);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function currentTimeMs() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

type FaceBlob = {
  bend: number;
  count: number;
  height: number;
  rotation: number;
  width: number;
  x: number;
  y: number;
};

type FaceFrame = {
  faceX: number;
  faceY: number;
  faceScale: number;
  faceRotation: number;
  leftBend: number;
  rightBend: number;
  mouthBend: number;
  leftX: number;
  leftY: number;
  leftWidth: number;
  leftHeight: number;
  leftRotation: number;
  rightX: number;
  rightY: number;
  rightWidth: number;
  rightHeight: number;
  rightRotation: number;
  mouthX: number;
  mouthY: number;
  mouthWidth: number;
  mouthHeight: number;
  mouthRotation: number;
  mouthCurve: number;
  measuredMode: number;
  rawBlobs: FaceBlob[];
  rawBlobCount: number;
  rawLoaderMode: boolean;
  frame: number;
  t: number;
  interpolated?: boolean;
  stabilized?: boolean;
};

type FaceTimeline = {
  duration: number;
  frames: FaceFrame[];
};

type FaceFrameNumericKey =
  | 'faceX'
  | 'faceY'
  | 'faceScale'
  | 'faceRotation'
  | 'leftX'
  | 'leftY'
  | 'leftWidth'
  | 'leftHeight'
  | 'leftRotation'
  | 'rightX'
  | 'rightY'
  | 'rightWidth'
  | 'rightHeight'
  | 'rightRotation'
  | 'mouthX'
  | 'mouthY'
  | 'mouthWidth'
  | 'mouthHeight'
  | 'mouthRotation'
  | 'mouthCurve';

const RAW_LOADER_START = 5.42;
const RAW_LOADER_END = 8.56;
const INTERPOLATED_FRAME_MAX_SPAN = 0.045;
const STABILIZED_FRAME_MAX_SPAN = 0.045;
const STABILIZE_SIDE_WEIGHT = 0.16;
const FACE_BEND_DEFAULTS = {
  leftEye: 0.42,
  rightEye: 0.42,
  mouth: -0.34,
  loader: 0.84,
};

const NEUTRAL_FACE_FRAME: FaceFrame = {
  faceX: 0,
  faceY: 0,
  faceScale: 0,
  faceRotation: 0,
  leftBend: 0,
  rightBend: 0,
  mouthBend: 0,
  leftX: -31.34,
  leftY: -19.32,
  leftWidth: 22.01,
  leftHeight: 35.45,
  leftRotation: 4.55,
  rightX: 31.81,
  rightY: -19.26,
  rightWidth: 21.98,
  rightHeight: 35.49,
  rightRotation: -5.06,
  mouthX: 1.36,
  mouthY: 34.51,
  mouthWidth: 39.04,
  mouthHeight: 16.09,
  mouthRotation: -0.51,
  mouthCurve: 0,
  measuredMode: 1,
  rawBlobs: [],
  rawBlobCount: 0,
  rawLoaderMode: false,
  frame: 0,
  t: 0,
};

const FACE_FRAME_NUMERIC_KEYS: FaceFrameNumericKey[] = [
  'faceX',
  'faceY',
  'faceScale',
  'faceRotation',
  'leftX',
  'leftY',
  'leftWidth',
  'leftHeight',
  'leftRotation',
  'rightX',
  'rightY',
  'rightWidth',
  'rightHeight',
  'rightRotation',
  'mouthX',
  'mouthY',
  'mouthWidth',
  'mouthHeight',
  'mouthRotation',
  'mouthCurve',
];
const STABILIZED_FACE_FRAME_KEYS = FACE_FRAME_NUMERIC_KEYS.filter(
  (key) => key !== 'mouthCurve',
);
const ROTATION_FRAME_KEYS = new Set<FaceFrameNumericKey>([
  'faceRotation',
  'leftRotation',
  'rightRotation',
  'mouthRotation',
]);
const RAW_BLOB_KEYS = [
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'bend',
] as const;

function getMeasuredBlobs(frame: MeasuredGifFrame | Partial<FaceFrame>) {
  const measuredBlobs = (frame as MeasuredGifFrame).blobs;
  if (Array.isArray(measuredBlobs)) return measuredBlobs;

  const rawBlobs = (frame as Partial<FaceFrame>).rawBlobs;
  return Array.isArray(rawBlobs) ? rawBlobs : [];
}

function normalizeFaceBlob(blob: MeasuredGifBlob | FaceBlob): FaceBlob {
  return {
    bend: finiteNumber(blob.bend),
    count: finiteNumber(blob.count),
    height: finiteNumber(blob.height),
    rotation: finiteNumber(blob.rotation),
    width: finiteNumber(blob.width),
    x: finiteNumber(blob.x),
    y: finiteNumber(blob.y),
  };
}

function faceFrameNumber(
  frame: MeasuredGifFrame | Partial<FaceFrame>,
  key: FaceFrameNumericKey,
  fallback: number,
) {
  return finiteNumber(
    (frame as Partial<Record<FaceFrameNumericKey, unknown>>)[key],
    fallback,
  );
}

function normalizeFaceFrame(frame: MeasuredGifFrame | Partial<FaceFrame> = {}) {
  const blobs = getMeasuredBlobs(frame).map(normalizeFaceBlob).slice(0, 3);
  const frameTime = finiteNumber(frame.t, NEUTRAL_FACE_FRAME.t);
  const frameIndex = Math.round(finiteNumber(frame.frame, 0));

  if (blobs.length < 3) {
    return {
      ...NEUTRAL_FACE_FRAME,
      t: frameTime,
      frame: frameIndex,
      measuredMode: finiteNumber(
        (frame as Partial<FaceFrame>).measuredMode,
        0,
      ),
      rawBlobs: blobs,
      rawBlobCount: blobs.length,
      rawLoaderMode: Boolean((frame as Partial<FaceFrame>).rawLoaderMode),
    };
  }

  const [left, mouth, right] = blobs;

  return {
    ...NEUTRAL_FACE_FRAME,
    t: frameTime,
    frame: frameIndex,
    measuredMode: 1,
    rawBlobs: blobs,
    rawBlobCount: blobs.length,
    rawLoaderMode: frameTime >= RAW_LOADER_START && frameTime <= RAW_LOADER_END,
    faceX: faceFrameNumber(frame, 'faceX', 0),
    faceY: faceFrameNumber(frame, 'faceY', 0),
    faceScale: faceFrameNumber(frame, 'faceScale', 0),
    faceRotation: faceFrameNumber(frame, 'faceRotation', 0),
    leftX: left.x,
    leftY: left.y,
    leftWidth: left.width,
    leftHeight: left.height,
    leftRotation: left.rotation,
    leftBend: left.bend,
    rightX: right.x,
    rightY: right.y,
    rightWidth: right.width,
    rightHeight: right.height,
    rightRotation: right.rotation,
    rightBend: right.bend,
    mouthX: mouth.x,
    mouthY: mouth.y,
    mouthWidth: mouth.width,
    mouthHeight: mouth.height,
    mouthRotation: mouth.rotation,
    mouthCurve: faceFrameNumber(frame, 'mouthCurve', 0),
    mouthBend: mouth.bend,
  };
}

function measuredFrameStats(frame: MeasuredGifFrame | Partial<FaceFrame>) {
  const blobs = getMeasuredBlobs(frame).map(normalizeFaceBlob);
  if (blobs.length !== 3) return { valid: false };

  const minX = Math.min(...blobs.map((blob) => blob.x - blob.width * 0.5));
  const maxX = Math.max(...blobs.map((blob) => blob.x + blob.width * 0.5));
  const minY = Math.min(...blobs.map((blob) => blob.y - blob.height * 0.5));
  const maxY = Math.max(...blobs.map((blob) => blob.y + blob.height * 0.5));
  const maxWidth = Math.max(...blobs.map((blob) => blob.width));
  const maxHeight = Math.max(...blobs.map((blob) => blob.height));
  const totalArea = blobs.reduce(
    (sum, blob) => sum + blob.width * blob.height,
    0,
  );

  return {
    valid:
      maxX - minX <= 170 &&
      maxY - minY <= 140 &&
      maxWidth <= 78 &&
      maxHeight <= 52 &&
      totalArea <= 2800 &&
      minX >= -125 &&
      maxX <= 125 &&
      minY >= -115 &&
      maxY <= 125,
  };
}

function lerp(a: number, b: number, factor: number) {
  return a + (b - a) * factor;
}

function smootherstep(factor: number) {
  const t = clamp(factor, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function angleDelta(a: number, b: number) {
  let delta = b - a;
  while (delta > 90) delta -= 180;
  while (delta < -90) delta += 180;
  return delta;
}

function lerpAngle(a: number, b: number, factor: number) {
  return a + angleDelta(a, b) * factor;
}

function faceFrameValue(frame: FaceFrame | undefined, key: FaceFrameNumericKey) {
  return finiteNumber(frame?.[key], NEUTRAL_FACE_FRAME[key]);
}

function faceFrameSpan(
  previous: FaceFrame | undefined,
  next: FaceFrame | undefined,
  duration: number,
) {
  if (!previous || !next) return 0;
  return next.t > previous.t
    ? next.t - previous.t
    : duration - previous.t + next.t;
}

function faceFrameOffset(previous: FaceFrame, time: number, duration: number) {
  return time >= previous.t ? time - previous.t : duration - previous.t + time;
}

function interpolateFaceFrames(
  previous: MeasuredGifFrame,
  next: MeasuredGifFrame,
  sourceFrame: MeasuredGifFrame,
) {
  const a = normalizeFaceFrame(previous);
  const b = normalizeFaceFrame(next);
  const sourceTime = finiteNumber(sourceFrame.t, a.t);
  const span = Math.max(0.001, b.t - a.t);
  const mix = smootherstep((sourceTime - a.t) / span);
  const blended = {
    ...a,
    t: sourceTime,
    frame: Math.round(finiteNumber(sourceFrame.frame, a.frame)),
    measuredMode: 1,
    rawLoaderMode:
      sourceTime >= RAW_LOADER_START && sourceTime <= RAW_LOADER_END,
    rawBlobs: [],
    rawBlobCount: 0,
  };

  FACE_FRAME_NUMERIC_KEYS.forEach((key) => {
    blended[key] = ROTATION_FRAME_KEYS.has(key)
      ? lerpAngle(a[key], b[key], mix)
      : lerp(a[key], b[key], mix);
  });

  return blended;
}

function smoothFaceFrameValue(
  key: FaceFrameNumericKey,
  previous: FaceFrame,
  current: FaceFrame,
  next: FaceFrame,
) {
  const previousValue = faceFrameValue(previous, key);
  const currentValue = faceFrameValue(current, key);
  const nextValue = faceFrameValue(next, key);

  if (ROTATION_FRAME_KEYS.has(key)) {
    return (
      currentValue +
      angleDelta(currentValue, previousValue) * STABILIZE_SIDE_WEIGHT +
      angleDelta(currentValue, nextValue) * STABILIZE_SIDE_WEIGHT
    );
  }

  return (
    currentValue * (1 - STABILIZE_SIDE_WEIGHT * 2) +
    previousValue * STABILIZE_SIDE_WEIGHT +
    nextValue * STABILIZE_SIDE_WEIGHT
  );
}

function shouldStabilizeFaceFrame(
  previous: FaceFrame,
  frame: FaceFrame,
  next: FaceFrame,
  duration: number,
) {
  if (previous.rawLoaderMode || frame.rawLoaderMode || next.rawLoaderMode) {
    return false;
  }

  return (
    faceFrameSpan(previous, frame, duration) <= STABILIZED_FRAME_MAX_SPAN &&
    faceFrameSpan(frame, next, duration) <= STABILIZED_FRAME_MAX_SPAN
  );
}

function stabilizeFaceFrames(frames: FaceFrame[], duration: number) {
  if (frames.length < 3) return frames;

  return frames.map((frame, index) => {
    const previous = frames[(index - 1 + frames.length) % frames.length];
    const next = frames[(index + 1) % frames.length];
    if (!shouldStabilizeFaceFrame(previous, frame, next, duration)) {
      return frame;
    }

    const stabilized = { ...frame, stabilized: true };
    STABILIZED_FACE_FRAME_KEYS.forEach((key) => {
      stabilized[key] = smoothFaceFrameValue(key, previous, frame, next);
    });
    return stabilized;
  });
}

function rawBlobCost(a: Partial<FaceBlob> = {}, b: Partial<FaceBlob> = {}) {
  const dx = finiteNumber(a.x) - finiteNumber(b.x);
  const dy = finiteNumber(a.y) - finiteNumber(b.y);
  const dw = finiteNumber(a.width) - finiteNumber(b.width);
  const dh = finiteNumber(a.height) - finiteNumber(b.height);
  const dr = angleDelta(finiteNumber(a.rotation), finiteNumber(b.rotation)) / 12;

  return dx * dx + dy * dy + dw * dw * 0.18 + dh * dh * 0.18 + dr * dr;
}

function permutations<T>(values: T[]): T[][] {
  if (values.length <= 1) return [values];
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += 1) {
    const rest = values.slice();
    const head = rest.splice(index, 1)[0];
    permutations(rest).forEach((tail) => output.push([head, ...tail]));
  }
  return output;
}

function matchRawBlobs(previousBlobs: FaceBlob[], nextBlobs: FaceBlob[]) {
  if (previousBlobs.length !== nextBlobs.length || previousBlobs.length > 3) {
    return nextBlobs;
  }

  let best = nextBlobs;
  let bestCost = Infinity;
  permutations(nextBlobs).forEach((candidate) => {
    const cost = candidate.reduce(
      (sum, blob, index) => sum + rawBlobCost(previousBlobs[index], blob),
      0,
    );
    if (cost < bestCost) {
      best = candidate;
      bestCost = cost;
    }
  });
  return best;
}

function blendRawBlob(
  previous: Partial<FaceBlob>,
  next: Partial<FaceBlob>,
  factor: number,
) {
  const blended = {
    count: Math.round(lerp(finiteNumber(previous.count), finiteNumber(next.count), factor)),
  } as FaceBlob;

  RAW_BLOB_KEYS.forEach((key) => {
    blended[key] =
      key === 'rotation'
        ? lerpAngle(finiteNumber(previous[key]), finiteNumber(next[key]), factor)
        : lerp(finiteNumber(previous[key]), finiteNumber(next[key]), factor);
  });

  return blended;
}

function blendRawBlobs(
  previousFrame: FaceFrame,
  nextFrame: FaceFrame,
  factor: number,
) {
  const previousBlobs = previousFrame.rawBlobs;
  const nextBlobs = nextFrame.rawBlobs;
  if (!previousBlobs.length || previousBlobs.length !== nextBlobs.length) {
    return previousBlobs;
  }

  const matchedNext = matchRawBlobs(previousBlobs, nextBlobs);
  return previousBlobs.map((blob, index) =>
    blendRawBlob(blob, matchedNext[index], factor),
  );
}

function blendFaceTimelineFrames(
  previous: FaceFrame,
  next: FaceFrame,
  time: number,
  duration: number,
) {
  const span = Math.max(0.001, faceFrameSpan(previous, next, duration));
  const factor = clamp(faceFrameOffset(previous, time, duration) / span, 0, 1);
  const blended: FaceFrame = {
    ...previous,
    t: time,
    frame: factor < 0.5 ? previous.frame : next.frame,
    interpolated: true,
  };

  STABILIZED_FACE_FRAME_KEYS.forEach((key) => {
    blended[key] = ROTATION_FRAME_KEYS.has(key)
      ? lerpAngle(faceFrameValue(previous, key), faceFrameValue(next, key), factor)
      : lerp(faceFrameValue(previous, key), faceFrameValue(next, key), factor);
  });

  if (previous.rawLoaderMode && next.rawLoaderMode) {
    blended.rawBlobs = blendRawBlobs(previous, next, factor);
    blended.rawBlobCount = blended.rawBlobs.length;
  } else {
    blended.rawBlobs = previous.rawBlobs;
    blended.rawBlobCount = previous.rawBlobCount;
  }

  return blended;
}

function shouldInterpolateFaceTimelineFrames(
  previous: FaceFrame,
  next: FaceFrame,
  span: number,
) {
  if (span > INTERPOLATED_FRAME_MAX_SPAN) return false;
  if (previous.rawLoaderMode !== next.rawLoaderMode) return false;
  if (previous.rawLoaderMode && previous.rawBlobCount !== next.rawBlobCount) {
    return false;
  }
  return true;
}

function sanitizeTimelineFrames(
  frames: MeasuredGifFrame[] = [],
  duration = 10,
) {
  const normalizedFrames = frames
    .map((frame, index) => {
      const frameTime = finiteNumber(frame.t);
      const inLoader =
        frameTime >= RAW_LOADER_START && frameTime <= RAW_LOADER_END;

      if (inLoader && getMeasuredBlobs(frame).length) {
        return { ...normalizeFaceFrame(frame), rawLoaderMode: true };
      }

      if (measuredFrameStats(frame).valid) return normalizeFaceFrame(frame);

      let previousValid: MeasuredGifFrame | null = null;
      for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        if (measuredFrameStats(frames[cursor]).valid) {
          previousValid = frames[cursor];
          break;
        }
      }

      let nextValid: MeasuredGifFrame | null = null;
      for (let cursor = index + 1; cursor < frames.length; cursor += 1) {
        if (measuredFrameStats(frames[cursor]).valid) {
          nextValid = frames[cursor];
          break;
        }
      }

      return previousValid && nextValid
        ? interpolateFaceFrames(previousValid, nextValid, frame)
        : normalizeFaceFrame(previousValid || nextValid || frame);
    })
    .sort((a, b) => a.t - b.t);

  return stabilizeFaceFrames(normalizedFrames, duration);
}

const FACE_TIMELINES: Record<string, FaceTimeline> = Object.fromEntries(
  Object.entries(MEASURED_GIF_TIMELINES).map(([key, timeline]) => {
    const duration = Math.max(0.001, finiteNumber(timeline.duration, 10));
    return [
      key,
      {
        duration,
        frames: sanitizeTimelineFrames(timeline.frames || [], duration),
      },
    ];
  }),
) as Record<string, FaceTimeline>;

function sampleFaceTimeline(mode: FaceTimelineName, time: number) {
  const timeline = FACE_TIMELINES[mode] || FACE_TIMELINES['gif-blue'];
  const frames = timeline?.frames || [];
  if (frames.length <= 1) return frames[0] || NEUTRAL_FACE_FRAME;

  const localTime = positiveModulo(time, timeline.duration);
  let low = 0;
  let high = frames.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (frames[mid].t <= localTime) low = mid + 1;
    else high = mid - 1;
  }

  const previousIndex = Math.max(0, high);
  const previous = frames[previousIndex] || frames[frames.length - 1];
  const next = frames[(previousIndex + 1) % frames.length] || frames[0];
  const span = faceFrameSpan(previous, next, timeline.duration);

  return shouldInterpolateFaceTimelineFrames(previous, next, span)
    ? blendFaceTimelineFrames(previous, next, localTime, timeline.duration)
    : previous;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}

type SidekickWebGLRefs = {
  orbRef: React.RefObject<HTMLSpanElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export function useSidekickFieldIcon(
  state: SidekickIconState,
  theme: SidekickIconTheme = 'light',
): SidekickWebGLRefs {
  return useSidekickWebGLAnimation(state, theme);
}

function useSidekickWebGLAnimation(
  state: SidekickIconState,
  theme: SidekickIconTheme = 'light',
): SidekickWebGLRefs {
  const orbRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextRevision, setContextRevision] = useState(0);
  const currentCanonicalState = canonicalState(state);
  const stateRef = useRef<CanonicalSidekickState>('idle');
  const themeRef = useRef(theme);
  stateRef.current = currentCanonicalState;
  themeRef.current = theme;

  const idleBlinkTimer = useRef(0);
  const idleBlinkStartMs = useRef<number | null>(null);
  const faceStateStartMs = useRef<number | null>(null);
  if (faceStateStartMs.current === null) {
    faceStateStartMs.current = currentTimeMs();
  }
  const liveRef = useRef<StateConfig>({
    ...getStateConfig(theme, currentCanonicalState),
  });

  const scheduleIdleBlink = useCallback(() => {
    window.clearTimeout(idleBlinkTimer.current);
    const pause =
      IDLE_BLINK.pauseMin +
      Math.random() * (IDLE_BLINK.pauseMax - IDLE_BLINK.pauseMin);
    idleBlinkTimer.current = window.setTimeout(() => {
      if (stateRef.current === 'idle') {
        idleBlinkStartMs.current = currentTimeMs();
      }
    }, pause * 1000);
  }, []);

  const finishIdleBlink = useCallback(() => {
    if (idleBlinkStartMs.current === null) return;
    idleBlinkStartMs.current = null;
    scheduleIdleBlink();
  }, [scheduleIdleBlink]);

  const faceTimeForState = useCallback(
    (stateForFace: CanonicalSidekickState, nowMs: number) => {
      const elapsed = Math.max(
        0,
        (nowMs - (faceStateStartMs.current ?? nowMs)) / 1000,
      );
      const live = liveRef.current;
      const timelineDuration =
        FACE_TIMELINES[live.faceTimeline]?.duration || 10;

      if (stateForFace === 'idle') {
        if (idleBlinkStartMs.current === null) return IDLE_BLINK.blinkStart;

        const blinkElapsed =
          Math.max(0, (nowMs - idleBlinkStartMs.current) / 1000) *
          Math.max(0, live.faceRate || 1);
        const blinkDuration = IDLE_BLINK.blinkEnd - IDLE_BLINK.blinkStart;

        if (blinkElapsed >= blinkDuration) {
          finishIdleBlink();
          return IDLE_BLINK.blinkStart;
        }

        return IDLE_BLINK.blinkStart + blinkElapsed;
      }

      const preset = FACE_PLAYBACK_PRESETS[stateForFace];
      const speed = Math.max(0, live.faceRate * finiteNumber(preset?.speed, 1));
      const phase = finiteNumber(preset?.phaseSeconds, 0);

      if (preset?.play === 'segment') {
        const start = finiteNumber(preset.segmentStartSeconds, 0);
        const end = Math.max(
          start + 0.001,
          finiteNumber(preset.segmentEndSeconds, timelineDuration),
        );
        return positiveModulo(
          start + positiveModulo(elapsed * speed + phase, end - start),
          timelineDuration,
        );
      }

      return positiveModulo(elapsed * speed + phase, timelineDuration);
    },
    [finishIdleBlink],
  );

  useEffect(() => {
    faceStateStartMs.current = currentTimeMs();
    idleBlinkStartMs.current = null;
    window.clearTimeout(idleBlinkTimer.current);
    if (currentCanonicalState === 'idle') {
      scheduleIdleBlink();
    }
    return () => {
      window.clearTimeout(idleBlinkTimer.current);
    };
  }, [currentCanonicalState, state, theme, scheduleIdleBlink]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const orb = orbRef.current;
    if (!canvas || !orb) return;

    const context = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
    });
    if (!context) return;
    const gl: WebGLRenderingContext = context;
    gl.getExtension('OES_standard_derivatives');
    const targetCanvas = canvas;
    const targetOrb = orb;
    const targetFallback = targetOrb.querySelector<HTMLElement>(
      '[data-sidekick-orb-fallback]',
    );
    let raf = 0;
    let contextLost = false;
    let contextRestoreTimeout = 0;

    function setCanvasReady(isReady: boolean) {
      targetCanvas.style.opacity = isReady ? '1' : '0';
      if (targetFallback) {
        targetFallback.style.opacity = isReady ? '0' : '1';
      }
    }

    function scheduleContextRestoreRetry() {
      window.clearTimeout(contextRestoreTimeout);
      contextRestoreTimeout = window.setTimeout(() => {
        if (gl.isContextLost()) {
          scheduleContextRestoreRetry();
          return;
        }
        setContextRevision((revision) => revision + 1);
      }, 250);
    }

    function handleContextLost(event: Event) {
      event.preventDefault();
      contextLost = true;
      setCanvasReady(false);
      cancelAnimationFrame(raf);
      scheduleContextRestoreRetry();
    }

    function handleContextRestored() {
      contextLost = false;
      window.clearTimeout(contextRestoreTimeout);
      setContextRevision((revision) => revision + 1);
    }

    setCanvasReady(false);

    const program = linkProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const particleGlowProgram = linkProgram(
      gl,
      PARTICLE_GLOW_VERTEX_SHADER,
      PARTICLE_GLOW_FRAGMENT_SHADER,
    );
    const particleProgram = linkProgram(
      gl,
      PARTICLE_VERTEX_SHADER,
      PARTICLE_FRAGMENT_SHADER,
    );
    if (!program || !particleGlowProgram || !particleProgram) return;
    const glProgram: WebGLProgram = program;
    const glParticleGlowProgram: WebGLProgram = particleGlowProgram;
    const glParticleProgram: WebGLProgram = particleProgram;

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const particleIdBuffer = gl.createBuffer();
    const particleIds = new Float32Array(MAX_PARTICLES);
    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      particleIds[index] = index;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, particleIdBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleIds, gl.STATIC_DRAW);

    const particleFramebuffer = gl.createFramebuffer();
    if (!particleFramebuffer) return;
    let particleTexture: WebGLTexture | null = null;
    let particleFramebufferWidth = 0;
    let particleFramebufferHeight = 0;

    function ensureParticleFramebuffer(width: number, height: number) {
      if (
        particleTexture &&
        particleFramebufferWidth === width &&
        particleFramebufferHeight === height
      ) {
        return;
      }

      if (particleTexture) {
        gl.deleteTexture(particleTexture);
      }

      particleTexture = gl.createTexture();
      if (!particleTexture) return;

      gl.bindTexture(gl.TEXTURE_2D, particleTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, particleFramebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        particleTexture,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      particleFramebufferWidth = width;
      particleFramebufferHeight = height;
    }

    const emptyParticleTexture = gl.createTexture();
    if (!emptyParticleTexture) return;
    gl.bindTexture(gl.TEXTURE_2D, emptyParticleTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );

    function createUniformGetter(programForUniforms: WebGLProgram) {
      const uniforms = new Map<string, WebGLUniformLocation | null>();
      return function uniform(name: string): WebGLUniformLocation | null {
        if (!uniforms.has(name)) {
          uniforms.set(name, gl.getUniformLocation(programForUniforms, name));
        }
        return uniforms.get(name) ?? null;
      };
    }

    const uniform = createUniformGetter(glProgram);
    const particleGlowUniform = createUniformGetter(glParticleGlowProgram);
    const particleUniform = createUniformGetter(glParticleProgram);
    const quadPosition = gl.getAttribLocation(glProgram, 'aPos');
    const particleGlowPosition = gl.getAttribLocation(
      glParticleGlowProgram,
      'aPos',
    );
    const particleIdAttribute = gl.getAttribLocation(glParticleProgram, 'aId');

    let lastTime = 0;
    let lastCanvasSize = 0;
    let orbPhase = 0;
    let particlePhase = 0;
    let particleDriftPhase = 0;

    function resizeCanvas(size: number) {
      if (size === lastCanvasSize) return;
      lastCanvasSize = size;
      const dpr = window.devicePixelRatio || 1;
      targetCanvas.width = size * dpr;
      targetCanvas.height = size * dpr;
      targetCanvas.style.width = `${size}px`;
      targetCanvas.style.height = `${size}px`;
      gl.viewport(0, 0, targetCanvas.width, targetCanvas.height);
      ensureParticleFramebuffer(targetCanvas.width, targetCanvas.height);
    }

    function faceRawSize(
      blob: Partial<FaceBlob>,
      fallbackWidth: number,
      fallbackHeight: number,
      loaderScale: number,
    ) {
      return [
        clamp(finiteNumber(blob.width, fallbackWidth) * loaderScale, 0.5, 120),
        clamp(finiteNumber(blob.height, fallbackHeight) * loaderScale, 0.5, 80),
      ] as const;
    }

    function frame(timestamp: number) {
      if (contextLost || gl.isContextLost()) {
        contextLost = true;
        setCanvasReady(false);
        scheduleContextRestoreRetry();
        return;
      }

      raf = requestAnimationFrame(frame);

      try {
        const dt =
          lastTime === 0
            ? 0.016
            : Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        const currentState = stateRef.current;
        const target = getStateConfig(themeRef.current, currentState);
        const live = liveRef.current;
        const factor = Math.min(target.lerpSpeed * dt, 1);

        for (const key of LERP_KEYS) {
          live[key] += (target[key] - live[key]) * factor;
        }
        for (const key of COLOR_KEYS) {
          live[key] = lerpColor(live[key], target[key], factor);
        }
        live.faceBlendMode = target.faceBlendMode;
        live.faceTimeline = target.faceTimeline;
        live.blobMixMode = target.blobMixMode;
        live.particleStyle = target.particleStyle;
        live.particleBlend = target.particleBlend;
        orbPhase += live.orbSpeed * dt;
        particlePhase += live.particleSpeed * dt;
        particleDriftPhase += Math.max(live.particleDrift, 0) * dt;

        const size = live.orbSize;
        targetOrb.style.width = `${size}px`;
        targetOrb.style.height = `${size}px`;
        targetOrb.style.transform = `translate(-50%,-50%) scale(${live.fieldOrbScale})`;
        resizeCanvas(Math.round(size));

        const faceFrame = sampleFaceTimeline(
          live.faceTimeline,
          faceTimeForState(currentState, timestamp),
        );
        const faceRaw = (index: number) => faceFrame.rawBlobs[index] || {};

        if (particleTexture) {
          const particleTint = hexToGL(live.particleTint);
          gl.bindFramebuffer(gl.FRAMEBUFFER, particleFramebuffer);
          gl.viewport(0, 0, targetCanvas.width, targetCanvas.height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);

          if (live.particleCount > 0 || live.particleGlow > 0) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.useProgram(glParticleGlowProgram);
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
            gl.enableVertexAttribArray(particleGlowPosition);
            gl.vertexAttribPointer(
              particleGlowPosition,
              2,
              gl.FLOAT,
              false,
              0,
              0,
            );
            gl.uniform1f(particleGlowUniform('uTime'), particlePhase);
            gl.uniform3fv(particleGlowUniform('uParticleTint'), particleTint);
            gl.uniform1f(
              particleGlowUniform('uParticleGlow'),
              live.particleGlow,
            );
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            if (live.particleCount > 0) {
              const pitch =
                Math.sin(particleDriftPhase * 0.31 + 0.4) *
                1.8 *
                live.particleDrift *
                (Math.PI / 180);
              const yaw =
                Math.sin(particleDriftPhase * 0.27 + 1.1) *
                2.2 *
                live.particleDrift *
                (Math.PI / 180);
              const roll =
                Math.sin(particleDriftPhase * 0.23 + 2) *
                0.8 *
                live.particleDrift *
                (Math.PI / 180);

              gl.useProgram(glParticleProgram);
              gl.bindBuffer(gl.ARRAY_BUFFER, particleIdBuffer);
              gl.enableVertexAttribArray(particleIdAttribute);
              gl.vertexAttribPointer(
                particleIdAttribute,
                1,
                gl.FLOAT,
                false,
                0,
                0,
              );
              gl.uniform1f(particleUniform('uTime'), particlePhase);
              gl.uniform2f(
                particleUniform('uViewportSize'),
                targetCanvas.width,
                targetCanvas.height,
              );
              gl.uniform1f(particleUniform('uPitch'), pitch);
              gl.uniform1f(particleUniform('uYaw'), yaw);
              gl.uniform1f(particleUniform('uRoll'), roll);
              gl.uniform3fv(particleUniform('uParticleTint'), particleTint);
              gl.uniform1f(
                particleUniform('uParticleStyle'),
                live.particleStyle,
              );
              gl.uniform1f(
                particleUniform('uParticleScale'),
                live.particleScale,
              );
              gl.uniform1f(
                particleUniform('uParticlePointSize'),
                live.particlePointSize,
              );
              gl.uniform1f(
                particleUniform('uParticleSpread'),
                live.particleSpread,
              );
              gl.drawArrays(
                gl.POINTS,
                0,
                Math.min(
                  MAX_PARTICLES,
                  Math.max(0, Math.round(live.particleCount)),
                ),
              );
            }
          }

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.viewport(0, 0, targetCanvas.width, targetCanvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(glProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(quadPosition);
        gl.vertexAttribPointer(quadPosition, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(
          gl.TEXTURE_2D,
          particleTexture ?? emptyParticleTexture,
        );
        gl.uniform1i(uniform('uParticles'), 1);

        gl.uniform1f(uniform('uTime'), orbPhase);

        gl.uniform3fv(uniform('uBlobA'), hexToGL(live.c1));
        gl.uniform3fv(uniform('uBlobB'), hexToGL(live.c2));
        gl.uniform3fv(uniform('uBlobC'), hexToGL(live.c3));
        gl.uniform1f(uniform('uOrbRadius'), live.orbRadius);
        gl.uniform1f(uniform('uBlobSize'), live.blobSize);
        gl.uniform1f(uniform('uBlobSoft'), live.blobSoft);
        gl.uniform1f(uniform('uBlobOpacity'), live.blobOpacity);
        gl.uniform1f(uniform('uBlobHueHold'), live.blobHueHold);
        gl.uniform1f(uniform('uOverlapBoost'), live.overlapBoost);
        gl.uniform1f(uniform('uFieldFill'), live.fieldFill);
        gl.uniform1i(uniform('uBlobMixMode'), live.blobMixMode);
        gl.uniform2f(uniform('uTiltA'), live.tiltAx, live.tiltAy);
        gl.uniform2f(uniform('uTiltB'), live.tiltBx, live.tiltBy);
        gl.uniform2f(uniform('uTiltC'), live.tiltCx, live.tiltCy);
        gl.uniform1f(uniform('uFaceScale'), live.faceScale);
        gl.uniform1f(uniform('uFaceOpacity'), live.faceOpacity);
        gl.uniform1f(uniform('uFaceOffsetY'), live.faceOffsetY);
        gl.uniform2f(
          uniform('uFaceOffset'),
          finiteNumber(faceFrame.faceX),
          finiteNumber(faceFrame.faceY),
        );
        gl.uniform1f(
          uniform('uFaceRotation'),
          finiteNumber(faceFrame.faceRotation) * (Math.PI / 180),
        );
        gl.uniform1i(uniform('uBlendMode'), live.faceBlendMode);
        gl.uniform3fv(uniform('uFaceColor'), hexToGL(live.faceColor));
        gl.uniform1f(uniform('uFaceColorMix'), live.faceColorMix);
        gl.uniform4f(
          uniform('uFaceMeta'),
          live.faceRoundness,
          live.faceSoftness,
          faceFrame.rawLoaderMode ? 1 : 0,
          faceFrame.rawBlobCount,
        );
        gl.uniform4f(
          uniform('uFaceLeft'),
          faceFrame.leftX,
          faceFrame.leftY,
          faceFrame.leftWidth,
          faceFrame.leftHeight,
        );
        gl.uniform4f(
          uniform('uFaceRight'),
          faceFrame.rightX,
          faceFrame.rightY,
          faceFrame.rightWidth,
          faceFrame.rightHeight,
        );
        gl.uniform4f(
          uniform('uFaceMouth'),
          faceFrame.mouthX,
          faceFrame.mouthY,
          faceFrame.mouthWidth,
          faceFrame.mouthHeight,
        );
        gl.uniform4f(
          uniform('uFaceRaw0'),
          finiteNumber(faceRaw(0).x),
          finiteNumber(faceRaw(0).y),
          ...faceRawSize(
            faceRaw(0),
            faceFrame.leftWidth,
            faceFrame.leftHeight,
            live.faceLoaderScale,
          ),
        );
        gl.uniform4f(
          uniform('uFaceRaw1'),
          finiteNumber(faceRaw(1).x),
          finiteNumber(faceRaw(1).y),
          ...faceRawSize(
            faceRaw(1),
            faceFrame.mouthWidth,
            faceFrame.mouthHeight,
            live.faceLoaderScale,
          ),
        );
        gl.uniform4f(
          uniform('uFaceRaw2'),
          finiteNumber(faceRaw(2).x),
          finiteNumber(faceRaw(2).y),
          ...faceRawSize(
            faceRaw(2),
            faceFrame.rightWidth,
            faceFrame.rightHeight,
            live.faceLoaderScale,
          ),
        );
        gl.uniform4f(
          uniform('uFaceRawRot'),
          finiteNumber(faceRaw(0).rotation, faceFrame.leftRotation) *
            (Math.PI / 180),
          finiteNumber(faceRaw(1).rotation, faceFrame.mouthRotation) *
            (Math.PI / 180),
          finiteNumber(faceRaw(2).rotation, faceFrame.rightRotation) *
            (Math.PI / 180),
          0,
        );
        gl.uniform4f(
          uniform('uFaceBends'),
          FACE_BEND_DEFAULTS.leftEye,
          FACE_BEND_DEFAULTS.rightEye,
          FACE_BEND_DEFAULTS.mouth,
          FACE_BEND_DEFAULTS.loader,
        );
        gl.uniform1f(uniform('uMaskEdge'), live.maskEdge);
        gl.uniform1f(uniform('uMaskSoft'), live.maskSoft);
        gl.uniform1f(uniform('uInnerGlow'), live.innerGlow);
        gl.uniform1f(uniform('uNoiseAmt'), live.noiseAmt);
        gl.uniform1f(uniform('uParticleOpacity'), live.particleOpacity);
        gl.uniform1i(uniform('uParticleBlend'), live.particleBlend);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        setCanvasReady(true);
      } catch {
        // Keep the CSS orb underneath the canvas visible if WebGL drops a frame.
        setCanvasReady(false);
      }
    }

    targetCanvas.addEventListener('webglcontextlost', handleContextLost);
    targetCanvas.addEventListener('webglcontextrestored', handleContextRestored);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(contextRestoreTimeout);
      window.clearTimeout(idleBlinkTimer.current);
      gl.deleteTexture(emptyParticleTexture);
      if (particleTexture) {
        gl.deleteTexture(particleTexture);
      }
      gl.deleteFramebuffer(particleFramebuffer);
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(particleIdBuffer);
      gl.deleteProgram(glProgram);
      gl.deleteProgram(glParticleGlowProgram);
      gl.deleteProgram(glParticleProgram);
      targetCanvas.removeEventListener('webglcontextlost', handleContextLost);
      targetCanvas.removeEventListener(
        'webglcontextrestored',
        handleContextRestored,
      );
    };
  }, [
    faceTimeForState,
    contextRevision,
  ]);

  return { orbRef, canvasRef };
}

export function SidekickIcon({
  state = 'idle',
  theme = 'light',
}: {
  state?: SidekickIconState;
  theme?: SidekickIconTheme;
}) {
  const icon = useSidekickWebGLAnimation(state, theme);

  return (
    <span
      aria-hidden="true"
      className="sidekick-orb relative isolate inline-block size-5 flex-none overflow-visible align-middle contain-[layout]"
    >
      <SidekickWebGLOrb
        orbRef={icon.orbRef}
        canvasRef={icon.canvasRef}
      />
    </span>
  );
}

export function SidekickFieldOrbs({
  orbRef,
  canvasRef,
}: {
  orbRef: React.RefObject<HTMLSpanElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <span
      aria-hidden="true"
      className="sidekick-orb pointer-events-none relative isolate block size-5 overflow-visible contain-[layout]"
    >
      <SidekickWebGLOrb
        orbRef={orbRef}
        canvasRef={canvasRef}
      />
    </span>
  );
}

export function SidekickFieldFace() {
  return null;
}

const sidekickOrbFallbackClass =
  'pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_36%,rgba(211,92,255,0.86)_0%,rgba(211,92,255,0.44)_22%,transparent_42%),radial-gradient(circle_at_64%_60%,rgba(95,92,255,0.9)_0%,rgba(95,92,255,0.5)_26%,transparent_48%),radial-gradient(circle_at_50%_50%,rgba(242,247,255,0.42)_0%,rgba(242,247,255,0.14)_32%,transparent_58%)] opacity-0 shadow-[0_0_28px_rgba(125,90,255,0.28)] transition-opacity duration-150';
const sidekickOrbFallbackEyeClass =
  'absolute top-[42%] h-5 w-3 rounded-full bg-[#2f2455]';
const sidekickOrbFallbackMouthClass =
  'absolute top-[55%] left-1/2 h-2.5 w-11 -translate-x-1/2 rounded-b-full border-b-[7px] border-[#2f2455]';
const sidekickOrbCanvasClass = 'relative block transition-opacity duration-150';

function SidekickWebGLOrb({
  orbRef,
  canvasRef,
}: {
  orbRef: React.RefObject<HTMLSpanElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <span
      ref={orbRef}
      className="pointer-events-none absolute top-1/2 left-1/2 block origin-center"
      style={{
        width: 290,
        height: 290,
        transform: 'translate(-50%,-50%) scale(0.23)',
      }}
    >
      <span
        aria-hidden
        data-sidekick-orb-fallback
        className={sidekickOrbFallbackClass}
      >
        <span className={`${sidekickOrbFallbackEyeClass} left-[40%]`} />
        <span className={`${sidekickOrbFallbackEyeClass} right-[40%]`} />
        <span className={sidekickOrbFallbackMouthClass} />
      </span>
      <canvas
        ref={canvasRef}
        className={sidekickOrbCanvasClass}
      />
    </span>
  );
}
