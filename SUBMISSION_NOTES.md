# Submission Notes

## Final GLB Size

- **6,594,128 bytes**
- **6.29 MiB** (~6.59 MB)

## Tech Stack

- React
- Vite
- Three.js
- GSAP / ScrollTrigger
- JavaScript
- CSS
- GLSL Shaders

## 3D Interaction & Animation

The 3D character is integrated as a continuous part of the landing page experience rather than being limited to the hero section.

### Scroll-Driven Robot Animation

- Robot position, rotation, scale, camera position, camera focus, and lighting are synchronized with page scroll progress.
- The character completes a full **360° rotation** during the scroll sequence and returns to a front-facing orientation.
- Animation progress is directly tied to scroll position, allowing the entire experience to reverse naturally when scrolling upward.
- Damped interpolation is used between animation states to prevent abrupt movement and create smoother cinematic transitions.

### Cinematic Camera System

- The camera moves through multiple compositions throughout the page.
- Camera position and focus points are interpolated along predefined paths for continuous movement.
- The sequence includes push-in, close-up, eye-level, and pull-back camera movements.
- Camera transitions are coordinated with robot movement and section changes instead of using isolated animations for each section.

### Cursor-Based Head Tracking

- The robot's head reacts dynamically to the user's cursor position.
- Pointer coordinates are converted into subtle head rotation values to make the character feel more responsive and interactive.
- The movement is intentionally constrained and smoothed so the interaction remains natural rather than overly exaggerated.

### Particle Dissolve Effect

- A custom particle-based dissolve and reconstruction effect is implemented for the 3D character.
- The system uses thousands of GPU-rendered particles to transition between the solid robot and particle states.
- Desktop particle count is dynamically configured for the experience while lower counts are used on smaller displays.
- Particle movement is controlled using custom shader logic and procedural noise to create a more organic dissolve effect.
- The dissolve state is integrated into the same scroll-driven animation system as the robot and camera.

### Custom Shader Effects

- Custom vertex and fragment shader logic is used for the particle system.
- Procedural noise is used to create non-uniform particle movement rather than a simple linear dissolve.
- Shader-based animation keeps the effect primarily GPU-driven for better rendering performance.

### Mouse Interaction

- Pointer movement is tracked inside the 3D experience.
- Cursor position influences the robot's head movement and interactive particle behaviour.
- Interaction values are smoothed before being applied to avoid jitter or sudden movement.

## Lighting

- Multiple lighting states are used throughout the scroll experience.
- Light position and intensity change alongside robot and camera movement.
- Lighting transitions are interpolated to maintain continuity between sections and create a more cinematic presentation.

## Performance Optimizations

- The supplied character is bundled locally as an optimized **GLB** instead of being loaded from a third-party host.
- Renderer device pixel ratio is capped to reduce unnecessary GPU load on high-DPI displays.
- Different rendering limits are used depending on the viewport/device size.
- Particle counts are adjusted based on screen size to reduce unnecessary rendering cost.
- Render updates are queued to avoid unnecessary duplicate render requests.
- Resize events are handled efficiently to keep the Three.js renderer and camera aligned with the page layout.
- The 3D model and supporting textures are loaded locally for predictable production performance.
- Reduced-motion preferences are respected for users who request less animation.

## Code Structure

The application is separated into reusable React sections and dedicated animation / 3D logic.

Main responsibilities are separated between:

- Hero section
- About section
- Services section
- Features section
- Three.js scene and renderer
- Robot animation states
- Scroll-based animation logic
- UI animations
- Particle effects
- Styling

This keeps the page structure separate from the more complex Three.js animation logic and makes the implementation easier to maintain.

## Styling

The assessment lists **Tailwind CSS as preferred rather than mandatory**.

I used custom CSS because it provided direct control over the supplied design's typography, spacing, gradients, positioning, section transitions, and visual details.

## Assets

All supporting images and 3D assets used by the implemented sections are stored locally within the project.

This avoids unnecessary third-party dependencies and ensures that the visual experience remains consistent after deployment.

## Scope

The implementation focuses on the requested first four sections of the landing page, with particular attention to:

- Accurate reproduction of the supplied design
- Cinematic scroll-driven 3D interaction
- Full 360° character rotation
- Interactive cursor-based head tracking
- Custom particle dissolve effects
- Shader-based particle animation
- Dynamic camera movement
- Dynamic lighting transitions
- Smooth reversible scroll animation
- Performance-conscious Three.js rendering
- Clean and maintainable React structure