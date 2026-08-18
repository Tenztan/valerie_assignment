import { useEffect } from "react";
import RobotStage from "./components/RobotStage";
import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Features from "./components/Features";
import CinematicOutro from "./components/CinematicOutro";

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("js");

    // Load DOM-driven animation modules only after React has mounted the page.
    Promise.all([
      import("./animations/uiAnimations.js"),
      import("./three/robotExperience.js"),
    ]).catch((error) => {
      console.error("SkyAI animation initialization failed:", error);
    });
  }, []);

  return (
    <>
      <RobotStage />
      <main>
        <Hero />
        <About />
        <Services />
        <Features />
        <CinematicOutro />
      </main>
    </>
  );
}
