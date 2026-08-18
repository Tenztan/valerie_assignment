import * as THREE from "three";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
    import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

    const stage = document.getElementById("robot-stage");
    const canvas = document.getElementById("robot-canvas");

    if (stage && canvas) {
      const reduceMotion3D = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const gsap3D = gsap;
      const ScrollTrigger3D = ScrollTrigger;

      stage.classList.add("robot-hero-layer");

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x2b0738, 0.018);

      const camera = new THREE.PerspectiveCamera(30, 1, 0.08, 60);
      camera.position.set(0, 4.58, 4.35);

      const focus = new THREE.Vector3(0, 4.50, 0);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });

      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const hemi = new THREE.HemisphereLight(0xdacbff, 0x16051d, 1.7);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(0xf0d8ff, 4.8);
      key.position.set(-3.5, 5.5, 5.5);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x6bdcff, 1.65);
      fill.position.set(4.5, 2.3, 3.5);
      scene.add(fill);

      const rim = new THREE.PointLight(0xce43f3, 48, 11, 2);
      rim.position.set(-2.1, 2.8, -3.0);
      scene.add(rim);

      const purpleKick = new THREE.PointLight(0x9f35ff, 30, 9, 2);
      purpleKick.position.set(3.4, 1.4, 1.5);
      scene.add(purpleKick);

      // Cinematic studio rig used only through Services -> Features.
      // Both spots track the camera focus so the light travels naturally from
      // helmet to torso to boots while the page is scrubbed.
      const studioTarget = new THREE.Object3D();
      studioTarget.position.set(0, 2.4, 0);
      scene.add(studioTarget);

      const studioKey = new THREE.SpotLight(0xffe9ff, 0, 15, Math.PI * .24, .62, 1.35);
      studioKey.position.set(-2.8, 6.4, 4.7);
      studioKey.target = studioTarget;
      scene.add(studioKey);

      const studioRim = new THREE.SpotLight(0xc746ff, 0, 14, Math.PI * .27, .72, 1.45);
      studioRim.position.set(2.9, 4.9, -3.7);
      studioRim.target = studioTarget;
      scene.add(studioRim);

      // Extra Services -> Features studio lights. These stay off elsewhere.
      // Cyan side light separates the silhouette from the purple background,
      // while a restrained warm bounce keeps armor details readable without alpha fading.
      const studioFill = new THREE.SpotLight(0x65d9ff, 0, 13, Math.PI * .30, .78, 1.55);
      studioFill.position.set(3.8, 3.1, 4.2);
      studioFill.target = studioTarget;
      scene.add(studioFill);

      const studioWarm = new THREE.PointLight(0xff9a68, 0, 8.5, 2);
      studioWarm.position.set(-2.2, -.25, 2.4);
      scene.add(studioWarm);

      const robotRoot = new THREE.Group();
      robotRoot.position.set(0.06, -0.72, 0);
      scene.add(robotRoot);

      const robotPivot = new THREE.Group();
      robotRoot.add(robotPivot);

      // =========================================================
      // MODEL HOVER + PARTICLE DISSOLVE SYSTEM
      // Adapted from the supplied hover/particle reference while preserving
      // the soldier's original materials, textures and scroll pose controller.
      // =========================================================
      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2(2, 2);
      const hoverTarget = new THREE.Vector3(999, 999, 999);
      const hoverCurrent = new THREE.Vector3(999, 999, 999);
      let pointerInside = false;
      let hoverRaycastFrame = 0;

      window.addEventListener("pointermove", (event) => {
        pointerInside = true;
        pointerNDC.set(
          (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
          -(event.clientY / Math.max(window.innerHeight, 1)) * 2 + 1
        );
      }, { passive: true });

      window.addEventListener("pointerleave", () => {
        pointerInside = false;
        pointerNDC.set(2, 2);
        hoverTarget.set(999, 999, 999);
      }, { passive: true });

      const hoverUniforms = {
        uRobotMouse: { value: hoverCurrent },
        // Keep the reveal tight to the actual cursor contact point.
        // This is in world units; the previous .62 radius covered a large
        // portion of the robot at hero scale.
        uRobotHoverRadius: { value: .30 },
        uRobotHoverEnabled: { value: 1 }
      };

      const particleCount = window.innerWidth < 700 ? 24000 : 48000;
      let particlePoints = null;
      let particleGeometry = null;
      const solidMaterials = [];

      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMouse: hoverUniforms.uRobotMouse,
          uHoverRadius: hoverUniforms.uRobotHoverRadius,
          uHoverEnabled: hoverUniforms.uRobotHoverEnabled,
          uTransitionState: { value: 0 },
          uScatter: { value: 0 },
          uGlobalAlpha: { value: 1 }
        },
        vertexShader: `
          uniform float uTime;
          uniform vec3 uMouse;
          uniform float uHoverRadius;
          uniform float uHoverEnabled;
          uniform float uTransitionState;
          uniform float uScatter;

          attribute float aRandom;
          varying float vAlpha;
          varying float vRandom;

          float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }

          float noise3(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(
                mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
                f.y
              ),
              mix(
                mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
                f.y
              ),
              f.z
            );
          }

          vec3 noiseVec3(vec3 x) {
            return vec3(
              noise3(x),
              noise3(x + vec3(12.3, 45.6, 78.9)),
              noise3(x + vec3(89.1, 23.4, 56.7))
            );
          }

          vec3 curlNoise(vec3 p) {
            const float e = 0.1;
            vec3 dx = vec3(e, 0.0, 0.0);
            vec3 dy = vec3(0.0, e, 0.0);
            vec3 dz = vec3(0.0, 0.0, e);
            vec3 p_x0 = noiseVec3(p - dx);
            vec3 p_x1 = noiseVec3(p + dx);
            vec3 p_y0 = noiseVec3(p - dy);
            vec3 p_y1 = noiseVec3(p + dy);
            vec3 p_z0 = noiseVec3(p - dz);
            vec3 p_z1 = noiseVec3(p + dz);
            float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
            float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
            float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
            return normalize(vec3(x, y, z) / (2.0 * e));
          }

          void main() {
            vec3 pos = position;

            // During the Hero -> About handoff, the sampled surface breaks
            // into turbulent particles while the entire robot travels to the
            // dynamically calculated About media pose.
            if (uTransitionState > 0.001) {
              vec3 flow = curlNoise(pos * .62 + vec3(0.0, uTime * .34, uTime * .12));
              float randomStrength = .45 + aRandom * 1.25;
              pos += flow * uScatter * randomStrength;
              pos.y += sin(uTime * 1.7 + aRandom * 18.0 + pos.x * 2.2) * uScatter * .18;
              pos.x += sin(uTime * 1.15 + aRandom * 11.0) * uScatter * .08;
            }

            vec4 worldPos = modelMatrix * vec4(pos, 1.0);
            float hoverAlpha = 0.0;

            if (uHoverEnabled > 0.5 && uTransitionState < 0.08) {
              float dist = distance(worldPos.xyz, uMouse);
              if (dist < uHoverRadius) {
                // Sharper falloff keeps the hover particles concentrated
                // around the raycast hit instead of blooming across the body.
                float force = pow(1.0 - dist / uHoverRadius, 2.8);
                vec3 dir = normalize(worldPos.xyz - uMouse + vec3(.0001));
                vec3 swirl = curlNoise(worldPos.xyz * 1.45 + uTime * 1.15);
                worldPos.xyz += (dir * .10 + swirl * .15) * force;
                hoverAlpha = smoothstep(0.0, 0.7, force);
              }
            }

            vAlpha = max(hoverAlpha, uTransitionState * (.62 + aRandom * .38));
            vRandom = aRandom;

            vec4 mvPosition = viewMatrix * worldPos;
            float perspectiveSize = 24.0 / max(1.0, -mvPosition.z);
            gl_PointSize = (1.8 + aRandom * 2.2) * perspectiveSize;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uGlobalAlpha;
          varying float vAlpha;
          varying float vRandom;

          void main() {
            if (vAlpha <= .01) discard;
            vec2 p = gl_PointCoord - vec2(.5);
            float d = length(p);
            if (d > .5) discard;

            float soft = smoothstep(.5, .08, d);
            vec3 purple = vec3(.79, .24, .96);
            vec3 ice = vec3(.86, .95, 1.0);
            vec3 color = mix(purple, ice, vRandom * .72);
            gl_FragColor = vec4(color, soft * vAlpha * .86 * uGlobalAlpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });

      function patchMaterialForRobotHover(material) {
        if (!material || material.userData.robotHoverPatched) return;
        material.userData.robotHoverPatched = true;
        material.userData.robotBaseOpacity = material.opacity ?? 1;
        material.userData.robotBaseDepthWrite = material.depthWrite !== false;
        material.transparent = true;

        const previousCompile = material.onBeforeCompile;
        material.onBeforeCompile = (shader, activeRenderer) => {
          if (previousCompile) previousCompile.call(material, shader, activeRenderer);

          shader.uniforms.uRobotMouse = hoverUniforms.uRobotMouse;
          shader.uniforms.uRobotHoverRadius = hoverUniforms.uRobotHoverRadius;
          shader.uniforms.uRobotHoverEnabled = hoverUniforms.uRobotHoverEnabled;

          shader.vertexShader = `
            varying vec3 vRobotWorldPos;
            ${shader.vertexShader}
          `.replace(
            `#include <project_vertex>`,
            `#include <project_vertex>
             vRobotWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );

          shader.fragmentShader = `
            uniform vec3 uRobotMouse;
            uniform float uRobotHoverRadius;
            uniform float uRobotHoverEnabled;
            varying vec3 vRobotWorldPos;
            ${shader.fragmentShader}
          `.replace(
            `void main() {`,
            `void main() {
              if (uRobotHoverEnabled > 0.5) {
                float robotDist = distance(vRobotWorldPos, uRobotMouse);
                float robotNoise = sin(vRobotWorldPos.x * 12.0)
                                 * cos(vRobotWorldPos.y * 12.0)
                                 * sin(vRobotWorldPos.z * 12.0) * .045;
                if (robotDist + robotNoise < uRobotHoverRadius * .84) discard;
              }`
          );
        };

        material.customProgramCacheKey = () => "skyai-robot-hover-v2";
        material.needsUpdate = true;
        solidMaterials.push(material);
      }

      function buildRobotSurfaceParticles(model) {
        const meshes = [];
        model.updateMatrixWorld(true);
        robotPivot.updateMatrixWorld(true);

        model.traverse((child) => {
          if (!child.isMesh || !child.geometry || !child.geometry.getAttribute("position")) return;
          const sampler = new MeshSurfaceSampler(child).build();
          const positionAttr = child.geometry.getAttribute("position");
          const indexAttr = child.geometry.index;
          const triangleCount = indexAttr ? indexAttr.count / 3 : positionAttr.count / 3;
          const worldScale = child.getWorldScale(new THREE.Vector3());
          const areaScale = Math.max(.001, (
            worldScale.x * worldScale.y +
            worldScale.y * worldScale.z +
            worldScale.x * worldScale.z
          ) / 3);
          meshes.push({ child, sampler, weight: Math.max(1, triangleCount * areaScale) });
        });

        if (!meshes.length) return;

        let totalWeight = 0;
        for (const entry of meshes) {
          totalWeight += entry.weight;
          entry.cumulative = totalWeight;
        }

        const positions = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount);
        const temp = new THREE.Vector3();
        const pivotWorldInverse = robotPivot.matrixWorld.clone().invert();

        for (let i = 0; i < particleCount; i++) {
          const pick = Math.random() * totalWeight;
          let entry = meshes[meshes.length - 1];
          for (let m = 0; m < meshes.length; m++) {
            if (pick <= meshes[m].cumulative) {
              entry = meshes[m];
              break;
            }
          }

          entry.sampler.sample(temp);
          temp.applyMatrix4(entry.child.matrixWorld).applyMatrix4(pivotWorldInverse);

          positions[i * 3] = temp.x;
          positions[i * 3 + 1] = temp.y;
          positions[i * 3 + 2] = temp.z;
          randoms[i] = Math.random();
        }

        particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
        particleGeometry.computeBoundingSphere();

        particlePoints = new THREE.Points(particleGeometry, particleMaterial);
        particlePoints.frustumCulled = false;
        particlePoints.renderOrder = 6;
        robotPivot.add(particlePoints);
      }

      const particleFxDesired = { solid: 1, particles: 0, scatter: 0 };
      const particleFxCurrent = { solid: 1, particles: 0, scatter: 0 };

      // This transition helper lives in the outer Three.js scope because
      // setHeroAboutParticleProgress() is also defined outside the GLTF
      // success callback. Do not rely on the controller's inner smoothstep.
      const particleSmoothstep = (value) => {
        const t = THREE.MathUtils.clamp(value, 0, 1);
        return t * t * (3 - 2 * t);
      };

      function setHeroAboutParticleProgress(progress) {
        if (reduceMotion3D) {
          particleFxDesired.solid = 1;
          particleFxDesired.particles = 0;
          particleFxDesired.scatter = 0;
          return;
        }

        const p = THREE.MathUtils.clamp(progress, 0, 1);
        // Start dissolving the instant scrolling begins. A linear first phase
        // gives immediate visual feedback, while frame damping keeps it smooth.
        // Stay as particles through most of the Hero -> About journey, then
        // reform only as the model reaches the About media destination.
        const dissolve = THREE.MathUtils.clamp(p / .22, 0, 1);
        const reform = particleSmoothstep((p - .82) / .18);
        const particleVisibility = THREE.MathUtils.clamp(dissolve * (1 - reform), 0, 1);
        const midBurst = Math.sin(Math.PI * p);

        particleFxDesired.solid = Math.max(1 - dissolve, reform);
        particleFxDesired.particles = particleVisibility;
        particleFxDesired.scatter = particleVisibility * (.28 + midBurst * 1.45);
      }

      // Lightweight fake contact shadow: no real-time shadow map cost.
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = shadowCanvas.height = 256;
      const shadowContext = shadowCanvas.getContext("2d");
      const shadowGradient = shadowContext.createRadialGradient(128, 128, 10, 128, 128, 118);
      shadowGradient.addColorStop(0, "rgba(12, 0, 18, .54)");
      shadowGradient.addColorStop(.45, "rgba(34, 4, 44, .3)");
      shadowGradient.addColorStop(1, "rgba(34, 4, 44, 0)");
      shadowContext.fillStyle = shadowGradient;
      shadowContext.fillRect(0, 0, 256, 256);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        opacity: .72
      });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, .02, .1);
      robotRoot.add(shadow);

      let renderQueued = true;
      const queueRender = () => { renderQueued = true; };

      function render() {
        camera.lookAt(focus);
        renderer.render(scene, camera);
      }

      gsap3D.ticker.add(() => {
        if (!document.hidden && renderQueued) {
          renderQueued = false;
          render();
        }
      });

      function setRendererSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const mobile = width < 700;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        queueRender();
      }

      setRendererSize();
      window.addEventListener("resize", setRendererSize, { passive: true });

      const loader = new GLTFLoader();

      loader.load(
        "/assets/futuristic-soldier.glb", // use your local model file at this path
        (gltf) => {
          const model = gltf.scene;

          // Normalize supplied asset to a predictable cinematic height.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const targetHeight = 4.15;
          const baseScale = targetHeight / Math.max(size.y, 0.001);
          model.scale.setScalar(baseScale);

          const centeredBox = new THREE.Box3().setFromObject(model);
          const center = centeredBox.getCenter(new THREE.Vector3());
          const minY = centeredBox.min.y;
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.position.y -= minY;

          model.traverse((child) => {
            if (!child.isMesh) return;
            child.frustumCulled = true;

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
              if (!material) return;
              material.needsUpdate = true;

              // Preserve the supplied textures while making metals read better
              // under the purple/cyan lighting used by the page.
              if ("roughness" in material) material.roughness = Math.min(material.roughness ?? .65, .72);
              if ("metalness" in material) material.metalness = Math.max(material.metalness ?? .08, .08);

              const materialName = (material.name || "").toLowerCase();
              if (materialName.includes("led")) {
                material.emissive = new THREE.Color(0xca43f3);
                material.emissiveIntensity = 1.8;
              }
              if (materialName.includes("glass")) {
                material.transparent = true;
                material.opacity = Math.min(material.opacity ?? .86, .86);
              }

              patchMaterialForRobotHover(material);
            });
          });

          robotPivot.add(model);
          robotPivot.updateMatrixWorld(true);

          // =========================================================
          // MOUSE-FOLLOWING HEAD
          // Keep the body controlled by the existing scroll animation,
          // while the helmet/head smoothly tracks the mouse cursor.
          // =========================================================
          const headParts = [];

          // IMPORTANT: this GLB has several outer-helmet meshes with generic
          // names (Material__33, Material__34 and Plastic4). If we only select
          // the meshes containing "Helmet" / "Head", the inner head moves
          // while parts of the helmet stay behind.
          const fullHeadMeshNames = new Set([
            "material__33",
            "material__34",
            "plastic4",
            "helmet_futuristic_solider_led_b",
            "helmet_futuristic_solider_led_y",
            "helmet_futuristic_solider_led_g",
            "helmet_futuristic_solider_led_r",
            "helmet_futuristic_solider_fabri",
            "helmet_futuristic_solider_glass",
            "head_futuristic_solider",
            "waiter_eye"
          ]);

          model.traverse((child) => {
            if (!child.isMesh) return;

            const name = (child.name || "").toLowerCase();

            if (fullHeadMeshNames.has(name)) {
              headParts.push(child);
            }
          });

          const headPivot = new THREE.Group();
          headPivot.name = "MouseHeadPivot";
          model.add(headPivot);

          model.updateMatrixWorld(true);

          // Find the head bounds and place the rotation pivot close to
          // the neck so the head turns naturally instead of spinning
          // around its geometric center.
          const headBounds = new THREE.Box3();

          headParts.forEach((part) => {
            headBounds.expandByObject(part);
          });

          if (!headBounds.isEmpty()) {
            const neckWorldPosition = new THREE.Vector3(
              (headBounds.min.x + headBounds.max.x) * 0.5,
              headBounds.min.y + (headBounds.max.y - headBounds.min.y) * 0.10,
              (headBounds.min.z + headBounds.max.z) * 0.5
            );

            const neckLocalPosition = model.worldToLocal(
              neckWorldPosition.clone()
            );

            headPivot.position.copy(neckLocalPosition);

            // Re-parent the head meshes without visually moving them.
            headParts.forEach((part) => {
              headPivot.attach(part);
            });
          }

          const headBaseRotation = headPivot.rotation.clone();
          const headMouseTarget = new THREE.Vector2();
          const headMouseCurrent = new THREE.Vector2();

          buildRobotSurfaceParticles(model);

          const responsiveRightX = (strength = 1) => {
            const w = window.innerWidth;
            if (w < 600) return .55 * strength;
            if (w < 900) return 1.15 * strength;
            if (w < 1280) return 1.75 * strength;
            if (w < 1700) return 2.45 * strength;
            return 2.75 * strength;
          };

          const responsiveScale = () => {
            if (window.innerWidth < 600) return .72;
            if (window.innerWidth < 900) return .82;
            return 1;
          };

          const heroYaw = -0.46;

          const aboutSection = document.querySelector("#about");
          const aboutMedia = document.querySelector(".about-media");

          const aboutCameraState = {
            position: new THREE.Vector3(0.10, 2.15, 7.15),
            focus: new THREE.Vector3(0.20, 1.95, 0)
          };

          const tempCamera = new THREE.PerspectiveCamera(camera.fov, 1, camera.near, camera.far);

          function prepareTempCamera(position, target) {
            tempCamera.fov = camera.fov;
            tempCamera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
            tempCamera.near = camera.near;
            tempCamera.far = camera.far;
            tempCamera.position.copy(position);
            tempCamera.lookAt(target);
            tempCamera.updateProjectionMatrix();
            tempCamera.updateMatrixWorld(true);
          }

          function screenPointToWorld(screenX, screenY, planeZ, position, target) {
            prepareTempCamera(position, target);

            const ndc = new THREE.Vector3(
              (screenX / window.innerWidth) * 2 - 1,
              -(screenY / window.innerHeight) * 2 + 1,
              0.25
            );

            ndc.unproject(tempCamera);
            const direction = ndc.sub(tempCamera.position).normalize();
            const distance = (planeZ - tempCamera.position.z) / direction.z;

            return tempCamera.position.clone().add(direction.multiplyScalar(distance));
          }

          function pixelsPerWorldUnitAt(worldPoint, position, target) {
            prepareTempCamera(position, target);

            const p1 = worldPoint.clone().project(tempCamera);
            const p2 = worldPoint.clone().add(new THREE.Vector3(0, 1, 0)).project(tempCamera);

            const y1 = (-p1.y * .5 + .5) * window.innerHeight;
            const y2 = (-p2.y * .5 + .5) * window.innerHeight;
            return Math.max(1, Math.abs(y2 - y1));
          }

          function getAboutMediaTarget() {
            if (!aboutMedia || !aboutSection) {
              return { x: 2.1, y: -.55, scale: .70 };
            }

            const mediaRect = aboutMedia.getBoundingClientRect();
            const sectionRect = aboutSection.getBoundingClientRect();

            // Canonical viewport position when ABOUT reaches the top of the screen.
            const relativeTop = mediaRect.top - sectionRect.top;
            const centerX = mediaRect.left + mediaRect.width * .5;
            const centerY = relativeTop + mediaRect.height * .5;

            const worldCenter = screenPointToWorld(
              centerX,
              centerY,
              0,
              aboutCameraState.position,
              aboutCameraState.focus
            );

            const pixelsPerUnit = pixelsPerWorldUnitAt(
              worldCenter,
              aboutCameraState.position,
              aboutCameraState.focus
            );

            const desiredRobotHeightPx = mediaRect.height * .84;
            const fittedScale = THREE.MathUtils.clamp(
              desiredRobotHeightPx / (targetHeight * pixelsPerUnit),
              .40,
              .92
            );

            // Model origin is at the feet, so offset downward from box center
            // by half the scaled model height.
            return {
              x: worldCenter.x,
              y: worldCenter.y - (targetHeight * fittedScale * .5),
              scale: fittedScale
            };
          }

          robotRoot.scale.setScalar(1.36 * responsiveScale());
          robotPivot.rotation.y = heroYaw;

          // =========================================================
          // ROBUST SCROLL CONTROLLER
          //
          // Important: only ONE system below writes robot/camera properties.
          // This prevents overlapping GSAP tweens from fighting each other
          // when the user scrolls very quickly or the browser restores scroll
          // position during page load.
          // =========================================================

          const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
          const lerp = THREE.MathUtils.lerp;
          const smoothstep = (t) => {
            t = clamp01(t);
            return t * t * (3 - 2 * t);
          };

          // Softer global camera timing for the Services -> Features shot.
          // Unlike two separate smoothsteps, this only eases at the beginning
          // and end of the whole move, so the camera never brakes at the torso.
          const cinematicEase = (t) => {
            t = clamp01(t);
            return .5 - .5 * Math.cos(Math.PI * t);
          };

          const heroPose = {
            x: .06,
            y: -.72,
            z: 0,
            scale: 1.36,
            yaw: heroYaw,
            pitch: 0,
            roll: 0,
            cameraX: 0,
            cameraY: 4.58,
            cameraZ: 4.35,
            focusX: 0,
            focusY: 4.50,
            focusZ: 0,
            key: 4.8,
            rim: 48,
            fill: 1.65,
            purple: 30,
            studioKey: 0,
            studioRim: 0,
            studioFill: 0,
            studioWarm: 0,
            modelAlpha: 1,
            shadow: .72
          };

          const aboutPose = {
            cameraX: aboutCameraState.position.x,
            cameraY: aboutCameraState.position.y,
            cameraZ: aboutCameraState.position.z,
            focusX: aboutCameraState.focus.x,
            focusY: aboutCameraState.focus.y,
            focusZ: aboutCameraState.focus.z,
            key: 5.25,
            rim: 52,
            fill: 1.85,
            purple: 34,
            studioKey: 0,
            studioRim: 0,
            studioFill: 0,
            studioWarm: 0,
            modelAlpha: 1,
            shadow: .62
          };

          // SERVICES starts on a deliberate helmet close-up.
          const servicePose = {
            x: 0,
            y: -.72,
            z: -.10,
            scale: 1.10,
            yaw: Math.PI * 2 - .035,
            pitch: -.012,
            roll: 0,
            cameraX: -.42,
            cameraY: 3.46,
            cameraZ: 3.28,
            focusX: .03,
            focusY: 3.08,
            focusZ: 0,
            // Fully opaque model; the darker look comes only from lighting.
            key: 1.45,
            rim: 12,
            fill: .34,
            purple: 6,
            studioKey: 10.5,
            studioRim: 9,
            studioFill: 5.5,
            studioWarm: 2.8,
            modelAlpha: 1,
            shadow: .30
          };

          // Middle beat: the lens glides past chest / waist with a slight
          // opposite-side truck for a more cinematic, non-mechanical move.
          const serviceTorsoPose = {
            ...servicePose,
            yaw: Math.PI * 2 + .045,
            pitch: .012,
            cameraX: .34,
            cameraY: 2.05,
            cameraZ: 3.16,
            focusX: -.03,
            focusY: 1.72,
            key: 1.25,
            rim: 11,
            fill: .28,
            purple: 5,
            studioKey: 11.5,
            studioRim: 11,
            studioFill: 6.5,
            studioWarm: 3.4,
            modelAlpha: 1,
            shadow: .24
          };

          // FEATURES arrival: finish at the boots / feet, still close enough
          // to feel like a continuous studio camera scan rather than a zoom-out.
          const featureToePose = {
            ...servicePose,
            yaw: Math.PI * 2 - .025,
            pitch: -.01,
            cameraX: -.22,
            cameraY: .34,
            cameraZ: 3.42,
            focusX: .02,
            focusY: -.42,
            key: 1.15,
            rim: 10,
            fill: .24,
            purple: 4.5,
            studioKey: 9.5,
            studioRim: 12.5,
            studioFill: 5.8,
            studioWarm: 4.2,
            modelAlpha: 1,
            shadow: .20
          };

          // EMPTY OUTRO: rise from the toe framing, square the robot to camera,
          // push in while lowering to eye level, then pull back for the final frame.
          const outroFrontPose = {
            ...featureToePose,
            yaw: Math.PI * 2,
            pitch: 0,
            roll: 0,
            cameraX: .14,
            cameraY: 3.34,
            cameraZ: 4.56,
            focusX: 0,
            focusY: 3.06,
            focusZ: 0,
            key: 1.8,
            rim: 15,
            fill: .46,
            purple: 7.5,
            studioKey: 10.5,
            studioRim: 13.5,
            studioFill: 6.8,
            studioWarm: 2.8,
            modelAlpha: 1,
            shadow: .27
          };

          const outroEyeApproachPose = {
            ...outroFrontPose,
            cameraX: -.10,
            cameraY: 3.60,
            cameraZ: 3.08,
            focusX: 0,
            focusY: 3.52,
            key: 2.05,
            rim: 18,
            fill: .52,
            purple: 8.9,
            studioKey: 13.0,
            studioRim: 16.0,
            studioFill: 7.6,
            studioWarm: 2.1,
            shadow: .31
          };

          const outroEyePushPose = {
            ...outroFrontPose,
            cameraX: -.02,
            cameraY: 3.56,
            cameraZ: 2.28,
            focusX: 0,
            focusY: 3.54,
            key: 2.25,
            rim: 19.5,
            fill: .58,
            purple: 9.8,
            studioKey: 14.6,
            studioRim: 17.4,
            studioFill: 8.4,
            studioWarm: 1.9,
            shadow: .34
          };

          const outroEyeHoldPose = {
            ...outroEyePushPose,
            cameraX: .01,
            cameraY: 3.50,
            cameraZ: 2.16,
            focusX: 0,
            focusY: 3.50,
            key: 2.18,
            rim: 19.0,
            fill: .57,
            purple: 9.5,
            studioKey: 14.1,
            studioRim: 17.0,
            studioFill: 8.2,
            studioWarm: 1.9,
            shadow: .33
          };

          const outroFinalPose = {
            ...outroFrontPose,
            x: heroPose.x,
            y: heroPose.y,
            z: heroPose.z,
            scale: heroPose.scale,
            cameraX: 0,
            cameraY: 4.58,
            cameraZ: 4.35,
            focusX: 0,
            focusY: 4.50,
            key: 4.6,
            rim: 40,
            fill: 1.45,
            purple: 24,
            studioKey: 0,
            studioRim: 0,
            studioFill: 0,
            studioWarm: 0,
            shadow: .52
          };


          // One continuous spline through the three cinematic beats. This is
          // the key smoothness fix: the camera, focus, rotation and lighting
          // pass THROUGH the torso instead of easing to a stop there.
          const serviceFeatureCameraCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(servicePose.cameraX, servicePose.cameraY, servicePose.cameraZ),
            new THREE.Vector3(serviceTorsoPose.cameraX, serviceTorsoPose.cameraY, serviceTorsoPose.cameraZ),
            new THREE.Vector3(featureToePose.cameraX, featureToePose.cameraY, featureToePose.cameraZ)
          ], false, "centripetal", .5);

          const serviceFeatureFocusCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(servicePose.focusX, servicePose.focusY, servicePose.focusZ),
            new THREE.Vector3(serviceTorsoPose.focusX, serviceTorsoPose.focusY, serviceTorsoPose.focusZ),
            new THREE.Vector3(featureToePose.focusX, featureToePose.focusY, featureToePose.focusZ)
          ], false, "centripetal", .5);

          // Vector layout: pitch, yaw, roll.
          const serviceFeatureRotationCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(servicePose.pitch, servicePose.yaw, servicePose.roll),
            new THREE.Vector3(serviceTorsoPose.pitch, serviceTorsoPose.yaw, serviceTorsoPose.roll),
            new THREE.Vector3(featureToePose.pitch, featureToePose.yaw, featureToePose.roll)
          ], false, "centripetal", .5);

          // Lighting is also splined so highlights do not pop at the torso beat.
          const serviceFeatureBaseLightCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(servicePose.key, servicePose.rim, servicePose.fill),
            new THREE.Vector3(serviceTorsoPose.key, serviceTorsoPose.rim, serviceTorsoPose.fill),
            new THREE.Vector3(featureToePose.key, featureToePose.rim, featureToePose.fill)
          ], false, "centripetal", .5);

          const serviceFeatureStudioLightCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(servicePose.studioKey, servicePose.studioRim, servicePose.studioFill),
            new THREE.Vector3(serviceTorsoPose.studioKey, serviceTorsoPose.studioRim, serviceTorsoPose.studioFill),
            new THREE.Vector3(featureToePose.studioKey, featureToePose.studioRim, featureToePose.studioFill)
          ], false, "centripetal", .5);

          // Vector layout: purple accent, warm bounce, contact shadow.
          const serviceFeatureAccentCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(servicePose.purple, servicePose.studioWarm, servicePose.shadow),
            new THREE.Vector3(serviceTorsoPose.purple, serviceTorsoPose.studioWarm, serviceTorsoPose.shadow),
            new THREE.Vector3(featureToePose.purple, featureToePose.studioWarm, featureToePose.shadow)
          ], false, "centripetal", .5);

          const cinematicCameraPoint = new THREE.Vector3();
          const cinematicFocusPoint = new THREE.Vector3();
          const cinematicRotationPoint = new THREE.Vector3();
          const cinematicBaseLightPoint = new THREE.Vector3();
          const cinematicStudioLightPoint = new THREE.Vector3();
          const cinematicAccentPoint = new THREE.Vector3();

          // Final empty-section camera path. Extra eye-focused control points keep
          // the push longer and ensure the framing lands on the eyes, not the chest.
          const outroCameraCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(featureToePose.cameraX, featureToePose.cameraY, featureToePose.cameraZ),
            new THREE.Vector3(outroFrontPose.cameraX, outroFrontPose.cameraY, outroFrontPose.cameraZ),
            new THREE.Vector3(outroEyeApproachPose.cameraX, outroEyeApproachPose.cameraY, outroEyeApproachPose.cameraZ),
            new THREE.Vector3(outroEyePushPose.cameraX, outroEyePushPose.cameraY, outroEyePushPose.cameraZ),
            new THREE.Vector3(outroEyeHoldPose.cameraX, outroEyeHoldPose.cameraY, outroEyeHoldPose.cameraZ),
            new THREE.Vector3(outroFinalPose.cameraX, outroFinalPose.cameraY, outroFinalPose.cameraZ)
          ], false, "centripetal", .5);

          const outroFocusCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(featureToePose.focusX, featureToePose.focusY, featureToePose.focusZ),
            new THREE.Vector3(outroFrontPose.focusX, outroFrontPose.focusY, outroFrontPose.focusZ),
            new THREE.Vector3(outroEyeApproachPose.focusX, outroEyeApproachPose.focusY, outroEyeApproachPose.focusZ),
            new THREE.Vector3(outroEyePushPose.focusX, outroEyePushPose.focusY, outroEyePushPose.focusZ),
            new THREE.Vector3(outroEyeHoldPose.focusX, outroEyeHoldPose.focusY, outroEyeHoldPose.focusZ),
            new THREE.Vector3(outroFinalPose.focusX, outroFinalPose.focusY, outroFinalPose.focusZ)
          ], false, "centripetal", .5);

          const outroBaseLightCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(featureToePose.key, featureToePose.rim, featureToePose.fill),
            new THREE.Vector3(outroFrontPose.key, outroFrontPose.rim, outroFrontPose.fill),
            new THREE.Vector3(outroEyeApproachPose.key, outroEyeApproachPose.rim, outroEyeApproachPose.fill),
            new THREE.Vector3(outroEyePushPose.key, outroEyePushPose.rim, outroEyePushPose.fill),
            new THREE.Vector3(outroEyeHoldPose.key, outroEyeHoldPose.rim, outroEyeHoldPose.fill),
            new THREE.Vector3(outroFinalPose.key, outroFinalPose.rim, outroFinalPose.fill)
          ], false, "centripetal", .5);

          const outroStudioLightCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(featureToePose.studioKey, featureToePose.studioRim, featureToePose.studioFill),
            new THREE.Vector3(outroFrontPose.studioKey, outroFrontPose.studioRim, outroFrontPose.studioFill),
            new THREE.Vector3(outroEyeApproachPose.studioKey, outroEyeApproachPose.studioRim, outroEyeApproachPose.studioFill),
            new THREE.Vector3(outroEyePushPose.studioKey, outroEyePushPose.studioRim, outroEyePushPose.studioFill),
            new THREE.Vector3(outroEyeHoldPose.studioKey, outroEyeHoldPose.studioRim, outroEyeHoldPose.studioFill),
            new THREE.Vector3(outroFinalPose.studioKey, outroFinalPose.studioRim, outroFinalPose.studioFill)
          ], false, "centripetal", .5);

          const outroAccentCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(featureToePose.purple, featureToePose.studioWarm, featureToePose.shadow),
            new THREE.Vector3(outroFrontPose.purple, outroFrontPose.studioWarm, outroFrontPose.shadow),
            new THREE.Vector3(outroEyeApproachPose.purple, outroEyeApproachPose.studioWarm, outroEyeApproachPose.shadow),
            new THREE.Vector3(outroEyePushPose.purple, outroEyePushPose.studioWarm, outroEyePushPose.shadow),
            new THREE.Vector3(outroEyeHoldPose.purple, outroEyeHoldPose.studioWarm, outroEyeHoldPose.shadow),
            new THREE.Vector3(outroFinalPose.purple, outroFinalPose.studioWarm, outroFinalPose.shadow)
          ], false, "centripetal", .5);

          const outroCameraPoint = new THREE.Vector3();
          const outroFocusPoint = new THREE.Vector3();
          const outroBaseLightPoint = new THREE.Vector3();
          const outroStudioLightPoint = new THREE.Vector3();
          const outroAccentPoint = new THREE.Vector3();

          let serviceFeatureCinematicActive = false;
          let outroCinematicActive = false;

          const desired = { ...heroPose };
          const current = { ...heroPose };

          let aboutPin = null;
          let metrics = {
            heroStart: 0,
            aboutLanding: 1,
            aboutPinStart: 2,
            aboutPinEnd: 3,
            serviceStart: 4,
            serviceEnd: 5,
            featureEnd: 6,
            outroStart: 7,
            outroEnd: 8
          };

          function setLayer(mode) {
            stage.classList.remove(
              "robot-hero-layer",
              "robot-page-layer",
              "robot-service-layer"
            );

            if (mode === "hero") stage.classList.add("robot-hero-layer");
            else if (mode === "service") stage.classList.add("robot-service-layer");
            else stage.classList.add("robot-page-layer");
          }

          function copyPose(target, source) {
            Object.keys(target).forEach((keyName) => {
              if (typeof source[keyName] === "number") target[keyName] = source[keyName];
            });
          }

          function getAboutPose() {
            const target = getAboutMediaTarget();
            return {
              x: target.x,
              y: target.y,
              z: 0,
              scale: target.scale,
              yaw: 0,
              pitch: 0,
              roll: 0,
              ...aboutPose
            };
          }

          function mixPose(a, b, t, out = desired) {
            const eased = smoothstep(t);
            for (const keyName of Object.keys(out)) {
              if (typeof a[keyName] === "number" && typeof b[keyName] === "number") {
                out[keyName] = lerp(a[keyName], b[keyName], eased);
              }
            }
            return out;
          }

          function rebuildMetrics() {
            const viewportH = Math.max(window.innerHeight, 1);
            const heroSection = document.querySelector("#home");

            const pinStart = aboutPin ? aboutPin.start : (
              aboutSection.getBoundingClientRect().top + window.scrollY
            );
            const pinEnd = aboutPin ? aboutPin.end : pinStart + Math.max(1450, viewportH * 1.7);

            const serviceEl = document.querySelector("#services");
            const serviceTop = serviceEl
              ? serviceEl.getBoundingClientRect().top + window.scrollY
              : pinEnd + viewportH;

            const featureEl = document.querySelector("#features");
            const featureTop = featureEl
              ? featureEl.getBoundingClientRect().top + window.scrollY
              : serviceTop + viewportH;

            const outroEl = document.querySelector("#cinematic-outro");
            const outroRect = outroEl ? outroEl.getBoundingClientRect() : null;
            const outroTop = outroRect
              ? outroRect.top + window.scrollY
              : featureTop + viewportH;
            const outroHeight = outroRect
              ? Math.max(outroRect.height, viewportH * 2.2)
              : viewportH * 2.2;

            // Begin the Hero -> About motion and particle transition from the
            // very first scroll movement. Do NOT add a delayed hero percentage
            // here; the transition should be directly tied to scroll progress.
            const heroTop = heroSection
              ? heroSection.getBoundingClientRect().top + window.scrollY
              : 0;

            metrics.heroStart = Math.max(0, heroTop);
            metrics.aboutLanding = Math.max(
              metrics.heroStart + 1,
              pinStart
            );
            metrics.aboutPinStart = pinStart;
            metrics.aboutPinEnd = pinEnd;
            metrics.serviceStart = Math.max(pinEnd, serviceTop - viewportH);
            metrics.serviceEnd = Math.max(metrics.serviceStart + 1, serviceTop);

            // The cinematic head-to-toe scan occupies the full distance from
            // the top of Services to the top of Features.
            metrics.featureEnd = Math.max(metrics.serviceEnd + 1, featureTop);

            // Keep the toe framing throughout Features. The finale begins only
            // once the intentionally empty outro section reaches the viewport top.
            metrics.outroStart = Math.max(metrics.featureEnd + 1, outroTop);
            metrics.outroEnd = Math.max(
              metrics.outroStart + 1,
              metrics.outroStart + Math.max(viewportH * 1.05, outroHeight - viewportH)
            );
          }

          function updateDesiredFromScroll() {
            const y = window.scrollY || window.pageYOffset || 0;
            const aboutTarget = getAboutPose();
            serviceFeatureCinematicActive = false;
            outroCinematicActive = false;

            // Outside the Hero -> About travel range the robot is fully solid.
            if (y > metrics.aboutLanding) setHeroAboutParticleProgress(1);

            // ------------------------------------------------------
            // HERO -> ABOUT MEDIA
            // Same approved visual path: close-up angled hero,
            // scales down and lands in the About image box.
            // ------------------------------------------------------
            if (y <= metrics.aboutLanding) {
              const p = clamp01(
                (y - metrics.heroStart) /
                Math.max(1, metrics.aboutLanding - metrics.heroStart)
              );

              const landingPose = {
                ...aboutTarget,
                // Finish front-facing exactly as the robot reforms in the
                // media box so the pinned 360 can begin without a yaw jump.
                yaw: 0,
                pitch: 0,
                roll: 0
              };

              mixPose(heroPose, landingPose, p);
              setHeroAboutParticleProgress(p);
              setLayer(p < .92 ? "hero" : "page");
              return;
            }

            // ------------------------------------------------------
            // Optional settle range while already INSIDE about-media.
            // With aboutLanding aligned to aboutPinStart this is normally a
            // zero-length branch, but keeping it makes the controller robust
            // if the pin start is later adjusted.
            // ------------------------------------------------------
            if (y < metrics.aboutPinStart) {
              const p = clamp01(
                (y - metrics.aboutLanding) /
                Math.max(1, metrics.aboutPinStart - metrics.aboutLanding)
              );

              copyPose(desired, aboutTarget);
              desired.yaw = lerp(heroYaw + Math.PI * .48, 0, smoothstep(p));
              desired.pitch = lerp(.018, 0, smoothstep(p));
              desired.roll = lerp(-.012, 0, smoothstep(p));
              setHeroAboutParticleProgress(1);
              setLayer("page");
              return;
            }

            // ------------------------------------------------------
            // PINNED ABOUT 360°
            // Robot stays locked inside the media box while completing
            // exactly one full turn, front -> front.
            // Camera breath is deterministic and returns to the exact
            // starting framing at the end of the pin.
            // ------------------------------------------------------
            if (y <= metrics.aboutPinEnd) {
              const p = clamp01(
                (y - metrics.aboutPinStart) /
                Math.max(1, metrics.aboutPinEnd - metrics.aboutPinStart)
              );

              copyPose(desired, aboutTarget);
              desired.yaw = Math.PI * 2 * p;
              desired.pitch = 0;
              desired.roll = 0;

              // Smooth push-in / lower / pull-back without extra timelines.
              const breath = Math.sin(Math.PI * p);
              desired.cameraX = aboutPose.cameraX - .02 * breath;
              desired.cameraY = aboutPose.cameraY - .21 * breath;
              desired.cameraZ = aboutPose.cameraZ - .80 * breath;
              desired.focusX = aboutPose.focusX + .08 * breath;
              desired.focusY = aboutPose.focusY - .08 * breath;
              desired.rim = aboutPose.rim + 12 * breath;
              desired.purple = aboutPose.purple + 8 * breath;
              setLayer("page");
              return;
            }

            // ------------------------------------------------------
            // Hold the completed front-facing pose after the pin until
            // Services enters the viewport.
            // ------------------------------------------------------
            if (y < metrics.serviceStart) {
              copyPose(desired, aboutTarget);
              desired.yaw = Math.PI * 2;
              desired.pitch = 0;
              desired.roll = 0;
              setLayer("page");
              return;
            }

            // ------------------------------------------------------
            // ABOUT -> SERVICES
            // Front-facing robot leaves the box, centers and zooms in
            // BEHIND the Service section.
            // ------------------------------------------------------
            if (y <= metrics.serviceEnd) {
              const p = clamp01(
                (y - metrics.serviceStart) /
                Math.max(1, metrics.serviceEnd - metrics.serviceStart)
              );

              const fromPose = {
                ...aboutTarget,
                yaw: Math.PI * 2,
                pitch: 0,
                roll: 0
              };

              const responsiveServicePose = {
                ...servicePose,
                scale: servicePose.scale * responsiveScale()
              };

              mixPose(fromPose, responsiveServicePose, p);
              setLayer("service");
              return;
            }

            // ------------------------------------------------------
            // SERVICES -> FEATURES : CINEMATIC HEAD-TO-TOE SCAN
            // As the user scrolls through Services, one continuous spline moves
            // helmet -> torso -> boots without stopping at the middle beat.
            // ------------------------------------------------------
            if (y <= metrics.featureEnd) {
              const rawP = clamp01(
                (y - metrics.serviceEnd) /
                Math.max(1, metrics.featureEnd - metrics.serviceEnd)
              );
              const p = cinematicEase(rawP);
              serviceFeatureCinematicActive = true;

              // Start from the head pose for scale/model placement, then let
              // the dedicated curves drive the actual camera rig continuously.
              copyPose(desired, servicePose);
              desired.scale = servicePose.scale * responsiveScale();

              serviceFeatureCameraCurve.getPoint(p, cinematicCameraPoint);
              serviceFeatureFocusCurve.getPoint(p, cinematicFocusPoint);
              serviceFeatureRotationCurve.getPoint(p, cinematicRotationPoint);
              serviceFeatureBaseLightCurve.getPoint(p, cinematicBaseLightPoint);
              serviceFeatureStudioLightCurve.getPoint(p, cinematicStudioLightPoint);
              serviceFeatureAccentCurve.getPoint(p, cinematicAccentPoint);

              desired.cameraX = cinematicCameraPoint.x;
              desired.cameraY = cinematicCameraPoint.y;
              desired.cameraZ = cinematicCameraPoint.z;
              desired.focusX = cinematicFocusPoint.x;
              desired.focusY = cinematicFocusPoint.y;
              desired.focusZ = cinematicFocusPoint.z;

              desired.pitch = cinematicRotationPoint.x;
              desired.yaw = cinematicRotationPoint.y;
              desired.roll = cinematicRotationPoint.z;

              desired.key = cinematicBaseLightPoint.x;
              desired.rim = cinematicBaseLightPoint.y;
              desired.fill = cinematicBaseLightPoint.z;
              desired.studioKey = cinematicStudioLightPoint.x;
              desired.studioRim = cinematicStudioLightPoint.y;
              desired.studioFill = cinematicStudioLightPoint.z;
              desired.purple = cinematicAccentPoint.x;
              desired.studioWarm = cinematicAccentPoint.y;
              desired.shadow = cinematicAccentPoint.z;

              // Gentle dolly arc + micro roll. Because the base camera path is
              // now a single spline, this embellishment stays fluid at torso.
              const cinemaArc = Math.sin(Math.PI * p);
              desired.cameraZ -= .13 * cinemaArc;
              desired.cameraX += .055 * Math.sin(Math.PI * 2 * p);
              desired.focusX -= .025 * Math.sin(Math.PI * 2 * p);
              desired.roll += .006 * Math.sin(Math.PI * 2 * p);

              // Soft highlight bloom around the center of the move.
              desired.studioKey += 1.5 * cinemaArc;
              desired.studioRim += 2.2 * cinemaArc;
              desired.studioFill += 1.4 * cinemaArc;
              desired.studioWarm += .9 * cinemaArc;

              // Fully opaque and always below Services/Features content.
              desired.modelAlpha = 1;
              setLayer("service");
              return;
            }

            const responsiveToePose = {
              ...featureToePose,
              scale: featureToePose.scale * responsiveScale()
            };

            // Hold the completed foot framing while the Feature section itself
            // is being read. The final camera move starts only in the empty stage.
            if (y < metrics.outroStart) {
              copyPose(desired, responsiveToePose);
              desired.modelAlpha = 1;
              setLayer("service");
              return;
            }

            // ------------------------------------------------------
            // EMPTY OUTRO : FRONT-FACING -> PUSH-IN -> EYE LEVEL -> PULL-BACK
            // One continuous camera curve, with the robot rotating back to a
            // perfectly front-facing stance during the opening rise.
            // ------------------------------------------------------
            if (y <= metrics.outroEnd) {
              const rawP = clamp01(
                (y - metrics.outroStart) /
                Math.max(1, metrics.outroEnd - metrics.outroStart)
              );
              const p = cinematicEase(rawP);
              outroCinematicActive = true;

              copyPose(desired, outroFrontPose);
              desired.scale = outroFrontPose.scale * responsiveScale();
              desired.modelAlpha = 1;

              outroCameraCurve.getPoint(p, outroCameraPoint);
              outroFocusCurve.getPoint(p, outroFocusPoint);
              outroBaseLightCurve.getPoint(p, outroBaseLightPoint);
              outroStudioLightCurve.getPoint(p, outroStudioLightPoint);
              outroAccentCurve.getPoint(p, outroAccentPoint);

              desired.cameraX = outroCameraPoint.x;
              desired.cameraY = outroCameraPoint.y;
              desired.cameraZ = outroCameraPoint.z;
              desired.focusX = outroFocusPoint.x;
              desired.focusY = outroFocusPoint.y;
              desired.focusZ = outroFocusPoint.z;

              // Return toward the hero-page composition during the final pull-back.
              const heroReturn = smoothstep(clamp01((p - .62) / .38));
              desired.x = lerp(outroFrontPose.x, heroPose.x, heroReturn);
              desired.y = lerp(outroFrontPose.y, heroPose.y, heroReturn);
              desired.z = lerp(outroFrontPose.z, heroPose.z, heroReturn);
              desired.scale = lerp(
                outroFrontPose.scale * responsiveScale(),
                heroPose.scale * responsiveScale(),
                heroReturn
              );

              // Square to front quickly, then hold the front-facing orientation
              // for the eye-level push and the final pull-back.
              const frontLock = smoothstep(clamp01(p / .26));
              desired.yaw = lerp(featureToePose.yaw, Math.PI * 2, frontLock);
              desired.pitch = lerp(featureToePose.pitch, 0, frontLock);
              desired.roll = lerp(featureToePose.roll, 0, frontLock);

              desired.key = outroBaseLightPoint.x;
              desired.rim = outroBaseLightPoint.y;
              desired.fill = outroBaseLightPoint.z;
              desired.studioKey = outroStudioLightPoint.x;
              desired.studioRim = outroStudioLightPoint.y;
              desired.studioFill = outroStudioLightPoint.z;
              desired.purple = outroAccentPoint.x;
              desired.studioWarm = outroAccentPoint.y;
              desired.shadow = outroAccentPoint.z;

              // Longer optical breathing around the eye-level push so the close-up
              // feels more cinematic while still landing on the face.
              const pushBreath = Math.sin(Math.PI * clamp01((p - .22) / .62));
              desired.cameraZ -= .16 * pushBreath;
              desired.focusY += .04 * pushBreath;

              setLayer("page");
              return;
            }

            const responsiveFinalPose = {
              ...outroFinalPose,
              scale: outroFinalPose.scale * responsiveScale(),
              yaw: Math.PI * 2,
              pitch: 0,
              roll: 0,
              modelAlpha: 1
            };
            copyPose(desired, responsiveFinalPose);
            setLayer("page");
          }

          function snapCurrentToDesired() {
            copyPose(current, desired);

            robotRoot.position.set(current.x, current.y, current.z);
            robotRoot.scale.setScalar(current.scale);
            robotPivot.rotation.set(current.pitch, current.yaw, current.roll);

            // Reset mouse-follow rotation when the pose is snapped.
            headMouseTarget.set(0, 0);
            headMouseCurrent.set(0, 0);
            headPivot.rotation.copy(headBaseRotation);

            camera.position.set(
              current.cameraX,
              current.cameraY,
              current.cameraZ
            );
            focus.set(
              current.focusX,
              current.focusY,
              current.focusZ
            );

            key.intensity = current.key;
            rim.intensity = current.rim;
            fill.intensity = current.fill;
            purpleKick.intensity = current.purple;
            studioKey.intensity = current.studioKey;
            studioRim.intensity = current.studioRim;
            studioFill.intensity = current.studioFill;
            studioWarm.intensity = current.studioWarm;
            studioTarget.position.set(
              current.focusX,
              current.focusY,
              current.focusZ
            );

            particleFxCurrent.solid = particleFxDesired.solid;
            particleFxCurrent.particles = particleFxDesired.particles;
            particleFxCurrent.scatter = particleFxDesired.scatter;
            particleMaterial.uniforms.uTransitionState.value = particleFxCurrent.particles;
            particleMaterial.uniforms.uScatter.value = particleFxCurrent.scatter;
            particleMaterial.uniforms.uGlobalAlpha.value = current.modelAlpha;

            for (const material of solidMaterials) {
              const baseOpacity = material.userData.robotBaseOpacity ?? 1;
              material.opacity = baseOpacity * particleFxCurrent.solid * current.modelAlpha;
              material.depthWrite = (material.userData.robotBaseDepthWrite !== false)
                && particleFxCurrent.solid > .94
                && current.modelAlpha > .94;
            }
            shadowMaterial.opacity = current.shadow * current.modelAlpha * (.2 + .8 * particleFxCurrent.solid);
            queueRender();
          }

          // Damped motion gives the cinematic scrub feel without ever allowing
          // scroll jumps to leave independent tweens in conflicting states.
          // Keep these lookup sets outside the render loop to avoid per-frame allocation.
          const cameraDampingKeys = new Set(["cameraX", "cameraY", "cameraZ", "focusX", "focusY", "focusZ"]);
          const rotationDampingKeys = new Set(["yaw", "pitch", "roll"]);
          const lightingDampingKeys = new Set([
            "key", "rim", "fill", "purple",
            "studioKey", "studioRim", "studioFill", "studioWarm", "shadow"
          ]);

          let lastFrameTime = performance.now();

          function updateRobotFrame() {
            const now = performance.now();
            const dt = Math.min(.05, Math.max(.001, (now - lastFrameTime) / 1000));
            lastFrameTime = now;

            // Exponential damping: stable at any refresh rate. During the
            // Services -> Features shot, camera/focus move with a slightly
            // heavier virtual rig than the model itself. This filters wheel and
            // trackpad spikes without making normal scrolling feel disconnected.
            const defaultDamping = reduceMotion3D ? 1 : 1 - Math.exp(-dt * 14);
            const cameraRigRate = outroCinematicActive ? 7.0 : (serviceFeatureCinematicActive ? 8.2 : 14);
            const rotationRigRate = outroCinematicActive ? 8.2 : (serviceFeatureCinematicActive ? 9.5 : 14);
            const lightingRigRate = outroCinematicActive ? 6.5 : (serviceFeatureCinematicActive ? 7.2 : 14);
            const cameraDamping = reduceMotion3D ? 1 : 1 - Math.exp(-dt * cameraRigRate);
            const rotationDamping = reduceMotion3D ? 1 : 1 - Math.exp(-dt * rotationRigRate);
            const lightingDamping = reduceMotion3D ? 1 : 1 - Math.exp(-dt * lightingRigRate);

            for (const keyName of Object.keys(current)) {
              if (typeof current[keyName] !== "number") continue;

              let damping = defaultDamping;
              if (cameraDampingKeys.has(keyName)) damping = cameraDamping;
              else if (rotationDampingKeys.has(keyName)) damping = rotationDamping;
              else if (lightingDampingKeys.has(keyName)) damping = lightingDamping;

              current[keyName] = lerp(current[keyName], desired[keyName], damping);
            }

            robotRoot.position.set(current.x, current.y, current.z);
            robotRoot.scale.setScalar(current.scale);
            robotPivot.rotation.set(current.pitch, current.yaw, current.roll);

            // ---------------------------------------------------------
            // HEAD FOLLOWS MOUSE
            // ---------------------------------------------------------
            const maxHeadYaw = THREE.MathUtils.degToRad(24);
            const maxHeadPitch = THREE.MathUtils.degToRad(12);

            if (pointerInside && !reduceMotion3D) {
              headMouseTarget.x =
                THREE.MathUtils.clamp(pointerNDC.x, -1, 1) * maxHeadYaw;

              headMouseTarget.y =
                -THREE.MathUtils.clamp(pointerNDC.y, -1, 1) * maxHeadPitch;
            } else {
              // Smoothly return to the neutral forward-facing position.
              headMouseTarget.set(0, 0);
            }

            const headDamping = reduceMotion3D
              ? 1
              : 1 - Math.exp(-dt * 7);

            headMouseCurrent.lerp(headMouseTarget, headDamping);

            headPivot.rotation.set(
              headBaseRotation.x + headMouseCurrent.y,
              headBaseRotation.y + headMouseCurrent.x,
              headBaseRotation.z
            );

            camera.position.set(
              current.cameraX,
              current.cameraY,
              current.cameraZ
            );
            focus.set(
              current.focusX,
              current.focusY,
              current.focusZ
            );

            key.intensity = current.key;
            rim.intensity = current.rim;
            fill.intensity = current.fill;
            purpleKick.intensity = current.purple;
            studioKey.intensity = current.studioKey;
            studioRim.intensity = current.studioRim;
            studioFill.intensity = current.studioFill;
            studioWarm.intensity = current.studioWarm;
            studioTarget.position.set(
              current.focusX,
              current.focusY,
              current.focusZ
            );

            // Smooth the dissolve/reform visual state independently from pose
            // damping so fast wheel/trackpad input cannot produce flashing.
            const fxDamping = reduceMotion3D ? 1 : 1 - Math.exp(-dt * 18);
            particleFxCurrent.solid = lerp(particleFxCurrent.solid, particleFxDesired.solid, fxDamping);
            particleFxCurrent.particles = lerp(particleFxCurrent.particles, particleFxDesired.particles, fxDamping);
            particleFxCurrent.scatter = lerp(particleFxCurrent.scatter, particleFxDesired.scatter, fxDamping);

            if (particlePoints) {
              particleMaterial.uniforms.uTime.value += dt;
              particleMaterial.uniforms.uTransitionState.value = particleFxCurrent.particles;
              particleMaterial.uniforms.uScatter.value = particleFxCurrent.scatter;
              particleMaterial.uniforms.uGlobalAlpha.value = current.modelAlpha;
            }

            const transitionActive = particleFxCurrent.particles > .04 || particleFxDesired.particles > .04;
            hoverUniforms.uRobotHoverEnabled.value = transitionActive ? 0 : 1;

            // Raycast at ~30fps; the hover point itself still eases every frame.
            hoverRaycastFrame = (hoverRaycastFrame + 1) % 2;
            if (!transitionActive && pointerInside && hoverRaycastFrame === 0) {
              robotRoot.updateMatrixWorld(true);
              raycaster.setFromCamera(pointerNDC, camera);
              const intersections = raycaster.intersectObject(model, true);
              if (intersections.length) hoverTarget.copy(intersections[0].point);
              else hoverTarget.set(999, 999, 999);
            } else if (transitionActive || !pointerInside) {
              hoverTarget.set(999, 999, 999);
            }

            hoverCurrent.lerp(hoverTarget, reduceMotion3D ? 1 : .16);

            for (const material of solidMaterials) {
              const baseOpacity = material.userData.robotBaseOpacity ?? 1;
              const baseDepthWrite = material.userData.robotBaseDepthWrite !== false;
              material.opacity = baseOpacity * particleFxCurrent.solid * current.modelAlpha;
              material.depthWrite = baseDepthWrite
                && particleFxCurrent.solid > .94
                && current.modelAlpha > .94;
            }

            // The contact shadow also dissolves so the particle-only middle
            // phase does not leave a solid-looking footprint behind.
            shadowMaterial.opacity = current.shadow * current.modelAlpha * (.2 + .8 * particleFxCurrent.solid);

            queueRender();
          }

          gsap3D.ticker.add(updateRobotFrame);

          // The ONLY animation ScrollTrigger affecting document flow:
          // About pins until the complete 360° rotation is finished.
          aboutPin = ScrollTrigger3D.create({
            trigger: aboutSection,
            start: "top top",
            end: () => "+=" + Math.max(1450, window.innerHeight * 1.7),
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 10,
            onUpdate: updateDesiredFromScroll
          });

          // One lightweight observer updates the desired pose.
          // No GSAP timeline writes robot/camera values anymore.
          let scrollRAF = 0;
          function scheduleScrollSync() {
            if (scrollRAF) return;
            scrollRAF = requestAnimationFrame(() => {
              scrollRAF = 0;
              updateDesiredFromScroll();
            });
          }

          window.addEventListener("scroll", scheduleScrollSync, { passive: true });

          // Resize changes projection + about-media geometry. Recalculate only
          // after the browser settles to avoid refresh thrashing.
          let resizeTimer = 0;
          window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
              ScrollTrigger3D.refresh();
            }, 120);
          }, { passive: true });

          ScrollTrigger3D.addEventListener("refresh", () => {
            rebuildMetrics();
            updateDesiredFromScroll();
            queueRender();
          });

          // IMPORTANT LOAD FIX:
          // Refresh first so pin spacing and geometry are final, then derive
          // the correct pose from the CURRENT scroll position, and only then
          // reveal the canvas. This prevents the occasional "robot too high"
          // first frame when a refresh occurs mid-page.
          ScrollTrigger3D.refresh();
          rebuildMetrics();
          updateDesiredFromScroll();
          snapCurrentToDesired();

          stage.classList.add("is-ready");
          queueRender();
        },
        undefined,
        (error) => {
          console.error("3D model failed to load:", error);
          stage.classList.add("has-error");
        }
      );

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) queueRender();
      });
    }