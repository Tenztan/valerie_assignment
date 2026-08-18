# SkyAI — React + Three.js + GSAP

A cinematic, scroll-driven landing page built with **React**, **Three.js**, and **GSAP**.

This project recreates the provided SkyAI landing page design while integrating a persistent 3D character experience across the page. The implementation combines scroll-driven animation, cinematic camera movement, dynamic lighting, cursor-based interaction, custom particle effects, and shader-driven visuals.

---

## Live Demo

**Vercel:** `ADD_YOUR_VERCEL_URL_HERE`



---

## Tech Stack

- React 18
- Vite
- Three.js 0.180
- GSAP 3.12.5
- GSAP ScrollTrigger
- JavaScript
- CSS
- GLSL Shaders

> Tailwind CSS was listed as preferred rather than mandatory in the assessment. Custom CSS was used to maintain precise control over the supplied design's typography, spacing, gradients, positioning, and visual details.

---

## Features

### Scroll-Driven 3D Experience

The 3D character remains integrated with the landing page throughout the scroll experience rather than functioning only as a hero animation.

- Persistent 3D character rendered with Three.js
- Robot position controlled by scroll progress
- Robot scale controlled by scroll progress
- Robot rotation synchronized with page movement
- Full **360° character rotation**
- Smooth transition back to a front-facing orientation
- Animation reverses naturally when scrolling upward
- Multiple robot poses and compositions across the page
- Damped interpolation used to prevent abrupt transitions
- Continuous animation flow between sections

---

### Cinematic Camera System

The camera is animated together with the robot to create a more cinematic experience.

- Scroll-controlled camera positioning
- Dynamic camera focus targets
- Camera push-in sequences
- Camera pull-back sequences
- Eye-level camera transitions
- Close-up character compositions
- Full-body compositions
- Smooth camera movement between sections
- Camera paths interpolated using predefined curves
- Camera focus synchronized with robot movement
- Continuous camera movement instead of disconnected section animations

---

### Cursor-Based Head Tracking

The character responds to the user's cursor movement for additional interactivity.

- Pointer position is tracked in real time
- Cursor movement influences the robot's head rotation
- Head movement is constrained to a natural range
- Damped movement prevents jitter and sudden rotation
- Interaction remains subtle so it does not interfere with the main scroll animation

---

### Particle Dissolve & Reconstruction

A custom particle system is used to transition the robot between solid and particle-based states.

- Particle-based dissolve effect
- Particle reconstruction effect
- Thousands of GPU-rendered particles
- Up to approximately **48,000 particles on desktop**
- Reduced particle count on smaller viewports
- Dissolve state synchronized with scroll progress
- Procedural particle movement
- Organic particle dispersion rather than a simple linear transition
- Interactive particle behaviour influenced by pointer movement

---

### Custom Shader Effects

The particle system uses custom GPU shader logic.

- Custom GLSL vertex shader
- Custom GLSL fragment shader
- Procedural noise-driven particle movement
- Curl/noise-inspired motion
- GPU-based particle animation
- Scroll-controlled shader state
- Pointer-influenced particle behaviour

Using shader-driven particle movement keeps the effect visually rich while moving much of the animation work to the GPU.

---

### Dynamic Lighting

Lighting changes throughout the experience to complement the robot and camera transitions.

- Multiple lighting states
- Dynamic light positioning
- Dynamic light intensity
- Lighting synchronized with scroll progress
- Lighting transitions synchronized with camera movement
- Smooth interpolation between lighting states
- Lighting adjusted for different robot compositions

---

### ScrollTrigger Integration

**GSAP ScrollTrigger** acts as the bridge between the page scroll and the Three.js experience.

Scroll progress controls:

- Robot position
- Robot rotation
- Robot scale
- Camera position
- Camera focus
- Lighting
- Particle dissolve state
- Section transitions

Because the animation state is calculated from scroll progress, the sequence can naturally reverse when the user scrolls back upward.

---

### Accessibility

The project also includes accessibility-focused interaction details.

- Support for `prefers-reduced-motion`
- Keyboard-accessible interactive elements
- ARIA labels where appropriate
- ARIA state attributes for interactive controls
- Reduced animation behaviour for users who prefer less motion

---

## Performance Optimizations

Several optimizations were implemented to keep the Three.js experience smooth while maintaining visual quality.

### Renderer Optimization

- Device pixel ratio is capped to avoid unnecessary GPU rendering cost on high-DPI displays
- Renderer resolution adapts based on viewport size
- High-performance WebGL rendering preference is enabled
- Resize handling keeps the renderer and camera correctly aligned with the page

### Particle Optimization

- Particle count adapts based on viewport size
- Smaller displays use fewer particles
- Particle movement is primarily shader-driven
- GPU rendering is used for the particle system

### Render Management

- Render requests are queued to avoid unnecessary duplicate render calls
- Scroll-driven values are derived from progress instead of creating large numbers of disconnected animation timelines
- Damped interpolation keeps animation smooth while reducing abrupt state changes

### Asset Loading

- The 3D model is stored locally inside the application
- Supporting images are stored locally
- No external 3D asset host is required
- Local asset loading provides more predictable behaviour after deployment

---

## Project Structure

```text
public/
└── assets/
    ├── futuristic-soldier.glb
    └── supporting-images...

src/
├── components/
│   ├── Hero.jsx
│   ├── About.jsx
│   ├── Services.jsx
│   ├── Features.jsx
│   ├── CinematicOutro.jsx
│   └── RobotStage.jsx
│
├── animations/
│   └── uiAnimations.js
│
├── three/
│   └── robotExperience.js
│
├── App.jsx
├── main.jsx
└── styles.css
```

The page structure is separated from the more complex Three.js and animation logic to keep responsibilities easier to maintain.

---

## Main Components

### `Hero.jsx`

Contains the main landing section including:

- Navigation
- Hero content
- CTA
- Statistics
- Supporting image
- Large TECHNOLOGY wordmark
- 3D character composition

### `About.jsx`

Contains the AI technology introduction section and participates in the scroll-driven 3D sequence.

### `Services.jsx`

Contains the intelligent AI solution cards and accompanying supporting imagery.

### `Features.jsx`

Contains the AI capability section and feature cards while continuing the 3D camera and character sequence.

### `RobotStage.jsx`

Provides the viewport-level rendering layer used by the Three.js experience.

### `robotExperience.js`

Handles the main 3D experience, including:

- Three.js scene creation
- Renderer setup
- Camera
- Robot loading
- Robot transforms
- Camera animation
- Scroll state
- Lighting
- Head tracking
- Particle effects
- Custom shaders
- Pointer interaction
- Resize behaviour
- Animation interpolation

### `uiAnimations.js`

Contains the non-Three.js UI animations and GSAP/ScrollTrigger behaviour.

---

## Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Vite will start the local development server.

---

## Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 3D Model

The final character model is served locally from:

```text
/assets/futuristic-soldier.glb
```

### Final GLB Size

- **6,594,128 bytes**
- **6.29 MiB**
- Approximately **6.59 MB**

The model is bundled directly with the application instead of relying on a third-party model host, helping ensure consistent loading in production.

---

## Assets

All supporting images used by the implemented landing page sections are included locally within the project's public assets directory.

Keeping the visual assets local provides:

- Predictable loading
- No dependency on third-party image hosts
- Easier production deployment
- Consistent visual presentation

---

## Implementation Details

The central goal of the implementation was to make the 3D character feel like part of the page itself rather than an isolated Three.js demo.

The robot, camera, lighting, and particle effects are therefore controlled through a shared scroll-driven state.

As the visitor moves through the experience:

1. The character begins in the hero composition.
2. Robot position and scale transition with the page.
3. The character performs a complete 360° rotation.
4. Camera distance and height change to create different compositions.
5. Lighting changes with the camera and character.
6. The character transitions between solid and particle states.
7. Cursor movement introduces subtle head and particle interaction.
8. The animation state reverses naturally when scrolling back upward.

This keeps the interaction continuous rather than treating each section as an independent animation.

---

## Design Implementation

The implementation focuses on recreating the supplied design's:

- Typography
- Spacing
- Large display text
- Purple gradients
- Section composition
- Supporting imagery
- Cards
- Navigation
- Content hierarchy
- 3D character placement
- Transitions between sections

Custom CSS was used instead of Tailwind because it allowed direct control over the visual details required by the supplied design.

---

## Assignment Scope

The implementation focuses on the requested landing page experience with particular attention to:

- First four landing page sections
- Visual accuracy to the supplied design
- Persistent 3D character integration
- Full 360° character rotation
- Cinematic scroll-driven interaction
- Camera push-in and pull-back movement
- Eye-level camera transition
- Smooth reversible animation
- Cursor-based head tracking
- Particle dissolve and reconstruction
- Custom shader animation
- Interactive particle behaviour
- Dynamic lighting transitions
- Performance-conscious Three.js rendering
- Clean React component separation

---

# Submission Notes

## Final GLB Size

- **6,594,128 bytes**
- **6.29 MiB**
- Approximately **6.59 MB**

---

## Optimizations & Implementation Notes

- The supplied character is bundled locally as a GLB to avoid dependency on an external 3D asset host.
- Device pixel ratio is capped to balance image quality and GPU performance on high-resolution displays.
- Particle counts are adjusted depending on viewport size.
- Particle animation is handled using custom GLSL shader logic.
- Robot position, rotation, scale, camera position, focus, lighting, and dissolve states are coordinated through scroll progress.
- Damped interpolation is used to keep character and camera transitions smooth.
- GSAP ScrollTrigger synchronizes the page and Three.js experience.
- Scroll-driven animation naturally reverses when scrolling upward.
- Camera movement follows interpolated paths rather than relying only on independent point-to-point transitions.
- Cursor-based head tracking adds subtle real-time interaction with the 3D character.
- Pointer movement also influences the custom particle experience.
- Lighting states change dynamically throughout the scroll sequence.
- Supporting images and 3D assets are stored locally.
- Resize events are handled to maintain correct Three.js positioning and rendering.
- Reduced-motion preferences are supported for accessibility.
- The project is organized into React components with separate UI-animation and Three.js experience logic.

---

## Additional Interactive Features

Beyond the core scroll animation, the implementation includes:

- Full 360° character rotation
- Cursor-based head tracking
- Interactive pointer response
- Particle dissolve effect
- Particle reconstruction effect
- Custom GLSL shaders
- Procedural particle movement
- Dynamic particle interaction
- Cinematic camera paths
- Dynamic camera focus
- Camera push-in
- Camera pull-back
- Eye-level camera movement
- Dynamic lighting transitions
- Smooth damped interpolation
- Reverse-on-scroll animation
- Reduced-motion support

---

## Styling

The assessment specifies Tailwind CSS as preferred rather than mandatory.

Custom CSS was used to provide precise control over the design's typography, spacing, gradients, section layouts, visual hierarchy, and 3D integration.

---


---

## Submission

- **Live Deployment:** `ADD_VERCEL_DEPLOYMENT_URL`
- **Final GLB Size:** **6.29 MiB**

---

## Summary

SkyAI combines a traditional React landing page with a persistent Three.js experience designed around the user's scroll.

The implementation focuses on making the 3D character feel connected to the interface through synchronized robot movement, cinematic camera transitions, dynamic lighting, cursor-based head tracking, particle dissolution, custom shaders, and reversible scroll animation.

The result is a self-contained frontend experience built around smooth interaction, visual continuity, and performance-conscious real-time 3D rendering.
