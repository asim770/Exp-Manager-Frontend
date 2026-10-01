import { useEffect, useRef } from 'react';
import { Renderer, Transform, Vec3, Color, Polyline } from 'ogl';

const Ribbons = ({
    colors = ['#FC8EAC'],
    baseSpring = 0.03,
    baseFriction = 0.9,
    baseThickness = 30,
    offsetFactor = 0.05,
    maxAge = 500,
    pointCount = 50,
    speedMultiplier = 0.6,
    enableFade = false,
    enableShaderEffect = false,
    effectAmplitude = 2,
    backgroundColor = [0, 0, 0, 0]
}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const renderer = new Renderer({ dpr, alpha: true });
        const gl = renderer.gl;
        if (Array.isArray(backgroundColor) && backgroundColor.length === 4) {
            gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
        } else {
            gl.clearColor(0, 0, 0, 0);
        }

        gl.canvas.style.position = 'absolute';
        gl.canvas.style.top = '0';
        gl.canvas.style.left = '0';
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';
        container.appendChild(gl.canvas);

        const scene = new Transform();
        const lines = [];

        const vertex = `
      precision highp float;
      
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      uniform float uTime;
      uniform float uEnableShaderEffect;
      uniform float uEffectAmplitude;
      
      varying vec2 vUV;
      
      vec4 getPosition() {
          vec4 current = vec4(position, 1.0);
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;
          vec2 tangent = normalize(nextScreen - prevScreen);
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);
          float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
          float pixelWidth = current.w * pixelWidthRatio;
          normal *= pixelWidth * uThickness;
          current.xy -= normal * side;
          if(uEnableShaderEffect > 0.5) {
            current.xy += normal * sin(uTime + current.x * 10.0) * uEffectAmplitude;
          }
          return current;
      }
      
      void main() {
          vUV = uv;
          gl_Position = getPosition();
      }
    `;

        const fragment = `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uEnableFade;
      varying vec2 vUV;
      void main() {
          float fadeFactor = 1.0;
          if(uEnableFade > 0.5) {
              fadeFactor = 1.0 - smoothstep(0.0, 1.0, vUV.y);
          }
          gl_FragColor = vec4(uColor, uOpacity * fadeFactor);
      }
    `;

        let containerRect = container.getBoundingClientRect();
        function resize() {
            if (!container) return;
            containerRect = container.getBoundingClientRect();
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            lines.forEach(line => line.polyline.resize());
        }
        window.addEventListener('resize', resize, { passive: true });

        const center = (colors.length - 1) / 2;
        colors.forEach((color, index) => {
            const spring = baseSpring + (Math.random() - 0.5) * 0.05;
            const friction = baseFriction + (Math.random() - 0.5) * 0.05;
            const thickness = baseThickness + (Math.random() - 0.5) * 3;
            const mouseOffset = new Vec3(
                (index - center) * offsetFactor + (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.1,
                0
            );

            const line = {
                spring,
                friction,
                mouseVelocity: new Vec3(),
                mouseOffset
            };

            const count = pointCount;
            const points = [];
            for (let i = 0; i < count; i++) {
                points.push(new Vec3());
            }
            line.points = points;

            line.polyline = new Polyline(gl, {
                points,
                vertex,
                fragment,
                uniforms: {
                    uColor: { value: new Color(color) },
                    uThickness: { value: thickness },
                    uOpacity: { value: 1.0 },
                    uTime: { value: 0.0 },
                    uEnableShaderEffect: { value: enableShaderEffect ? 1.0 : 0.0 },
                    uEffectAmplitude: { value: effectAmplitude },
                    uEnableFade: { value: enableFade ? 1.0 : 0.0 }
                }
            });
            line.polyline.mesh.setParent(scene);
            lines.push(line);
        });

        resize();

        const mouse = new Vec3();
        let isMoving = true;
        let lastMoveTime = performance.now();

        function updateMouse(e) {
            let x, y;
            if (e.changedTouches && e.changedTouches.length) {
                x = e.changedTouches[0].clientX - containerRect.left;
                y = e.changedTouches[0].clientY - containerRect.top;
            } else {
                x = e.clientX - containerRect.left;
                y = e.clientY - containerRect.top;
            }
            const width = containerRect.width || container.clientWidth || 1;
            const height = containerRect.height || container.clientHeight || 1;
            mouse.set((x / width) * 2 - 1, (y / height) * -2 + 1, 0);

            isMoving = true;
            lastMoveTime = performance.now();
            startLoop();
        }
        window.addEventListener('mousemove', updateMouse, { passive: true });
        window.addEventListener('touchstart', updateMouse, { passive: true });
        window.addEventListener('touchmove', updateMouse, { passive: true });

        const tmp = new Vec3();
        let frameId = null;
        let lastTime = performance.now();

        function update() {
            if (document.hidden) {
                frameId = null;
                return;
            }

            const currentTime = performance.now();
            const dt = currentTime - lastTime;
            lastTime = currentTime;

            let maxVelocity = 0;

            lines.forEach(line => {
                tmp.copy(mouse).add(line.mouseOffset).sub(line.points[0]).multiply(line.spring);
                line.mouseVelocity.add(tmp).multiply(line.friction);
                line.points[0].add(line.mouseVelocity);

                const velLen = line.mouseVelocity.len();
                if (velLen > maxVelocity) maxVelocity = velLen;

                for (let i = 1; i < line.points.length; i++) {
                    if (isFinite(maxAge) && maxAge > 0) {
                        const segmentDelay = maxAge / (line.points.length - 1);
                        const alpha = Math.min(1, (dt * speedMultiplier) / segmentDelay);
                        line.points[i].lerp(line.points[i - 1], alpha);
                    } else {
                        line.points[i].lerp(line.points[i - 1], 0.9);
                    }
                }
                if (line.polyline.mesh.program.uniforms.uTime) {
                    line.polyline.mesh.program.uniforms.uTime.value = currentTime * 0.001;
                }
                line.polyline.updateGeometry();
            });

            renderer.render({ scene });

            // If mouse has stopped moving for > 1.5 seconds and ribbons have settled, sleep loop to save CPU
            if (currentTime - lastMoveTime > 1500 && maxVelocity < 0.0005) {
                isMoving = false;
                frameId = null;
                return;
            }

            frameId = requestAnimationFrame(update);
        }

        function startLoop() {
            if (!frameId && !document.hidden) {
                lastTime = performance.now();
                frameId = requestAnimationFrame(update);
            }
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (frameId) {
                    cancelAnimationFrame(frameId);
                    frameId = null;
                }
            } else if (isMoving) {
                startLoop();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        startLoop();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', updateMouse);
            window.removeEventListener('touchstart', updateMouse);
            window.removeEventListener('touchmove', updateMouse);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (frameId) cancelAnimationFrame(frameId);
            if (gl.canvas && gl.canvas.parentNode === container) {
                container.removeChild(gl.canvas);
            }
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
    }, [
        colors,
        baseSpring,
        baseFriction,
        baseThickness,
        offsetFactor,
        maxAge,
        pointCount,
        speedMultiplier,
        enableFade,
        enableShaderEffect,
        effectAmplitude,
        backgroundColor
    ]);

    return <div ref={containerRef} className="relative w-full h-full" />;
};

export default Ribbons;
