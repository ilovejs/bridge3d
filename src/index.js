import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// Canvas
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
let renderer;
let camera;
let controls;
let frog;

init(); //our setup
render(); //the update loop

function init() {
  //setup the camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(0, 4, 8.7);

  //load and create the environment
  new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .load(
      "https://cdn.jsdelivr.net/gh/digitalcoleman/3DModels@main/kloppenheim_06_1k.hdr",
      function (texture) {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.background = envMap; //this loads the envMap for the background
        scene.environment = envMap; //this loads the envMap for reflections and lighting

        texture.dispose(); //we have envMap so we can erase the texture
        pmremGenerator.dispose(); //we processed the image into envMap so we can stop this
      }
    );

  const loader = new GLTFLoader();

  // File size exceeded the configured limit of 20 MB.
  loader.load(
    // "https://cdn.jsdelivr.net/gh/digitalcoleman/3DModels@main/myBridge1.glb",
    // "http://localhost:1234/myBridge1.glb",
    // "https://github.com/ilovejs/bridge3d/blob/master/src/myBridge2.glb?raw=true",
    // "https://cdn.jsdelivr.net/gh/ilovejs/bridge3d@1/src/myBridge2.glb",
    "https://cdn.jsdelivr.net/gh/ilovejs/bridge3d@v1.2/src/face.glb",
    function (gltf) {
      scene.add(gltf.scene);
      render(); //render the scene for the first time
    }
  );

  // //load the frog
  loader.load(
    "https://cdn.jsdelivr.net/gh/digitalcoleman/3DModels@main/scene.glb",
    function (gltf) {
      const myScene = gltf.scene.children[0]; //first we get the scene info
      frog = myScene.children[0]; //then we get the mesh object in the scene aka the frog
      frog.scale.set(0.005, 0.005, 0.005); //scale it down
      frog.position.set(1, 0.3, 0.2); //adjust the position
      frog.rotation.set(-1.53, 0, 1.53); //rotate it in radians
      //material for frog - shiny green
      frog.material = new THREE.MeshPhysicalMaterial({
        color: 0x1daa21,
        metalness: 0.9,
        roughness: 0.1
      });
      scene.add(frog);
      //render(); //render the scene for the first time
    }
  );

  //setup the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; //added contrast for filmic look
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding; //extended color space for the hdr

  controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop to render after any changes
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.update();

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}
const clock = new THREE.Clock(); //add a clock for the sin wave

const tick = () => {
  const elapsedTime = clock.getElapsedTime(); //get the elepsed time

  // Render
  if (frog) {
    //frog.rotateZ(0.03); //we could spin the frog...
    //make a sine wave where we 8x the speed of the hop for realism
    // and divide by three for a lower hop
    let y = 0.3 + Math.sin(elapsedTime * 8.0) / 3.0;
    if (y < 0.3) y = 0.3; //we make it so we only use the top arc of the sin wave
    frog.position.y = y; //now change the position up and down
    //we also use this for the x movement
    //if we are in a hop, move the frog in the x direction using 1/16th the power of the hop
    if (y > 0.3) frog.position.x += y / 16;
    //see if we have hopped off the edge, and if so, move it back to the other side
    if (frog.position.x > 5) frog.position.x = -5;
  }

  controls.update(camera);
  render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

//

function render() {
  renderer.render(scene, camera);
}
