import * as THREE from 'three';
import gsap from 'gsap'; // GreenSock Animation Platform

// If you wanna be able to rotate the plane around with your mouse:
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// new OrbitControls(camera, renderer.domElement)

// Creates a object to hold our preferred values for properties of the plane object
const world = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 30,
    heightSegments: 30,
  }
}
/* If you wanna use an interface to debug/test different values for the plane
import * as DAT from 'dat.gui';
const gui = new DAT.GUI();
// Adds the attributes to the interface we created above
gui.add(world.plane, 'width', 1, 500).onChange(generatePlane); // Scale goes from 1 to 500
gui.add(world.plane, 'height', 1, 500).onChange(generatePlane); 
gui.add(world.plane, 'widthSegments', 1, 160).onChange(generatePlane);
gui.add(world.plane, 'heightSegments', 1, 160).onChange(generatePlane);
*/

// Creates new essential objects for the project
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
); camera.position.z = 120; // Change camera position

// Create a plane object..
const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);
// And give it a material
const planeMaterial = new THREE.MeshPhongMaterial({
  side: THREE.DoubleSide,
  flatShading: THREE.FlatShading,
  vertexColors: true
});

// Now we mesh them together and add it to the scene
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);


// And initialize it 
generatePlane();

// Adds a light source in front of the plane,
// otherwise you won't see shit due to the material we used
// for the plane (MeshPhong)
const light = new THREE.DirectionalLight(0xffffff, 1); // White light, 100% intensity
light.position.set(0, -1, 1);
scene.add(light);


/* This isn't necessary if you don't use orbitcontrol, since you won't see the backside of the plane
// Adds a light source behind the plane
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(0, 0, -1);
scene.add(backLight);
*/

// A lot of stuff going on for generating a new plane for the mesh
// Study it thoroughly, use the docs and refer back to the video tutorial
function generatePlane() {
  planeMesh.geometry.dispose()
  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  )

  // vertice position randomization
  const { array } = planeMesh.geometry.attributes.position
  const randomValues = []
  for (let i = 0; i < array.length; i++) {
    if (i % 3 === 0) {
      const x = array[i]
      const y = array[i + 1]
      const z = array[i + 2]

      array[i] = x + (Math.random() - 0.5) * 3
      array[i + 1] = y + (Math.random() - 0.5) * 3
      array[i + 2] = z + (Math.random() - 0.5) * 3
    }

    randomValues.push(Math.random() * Math.PI * 2)
  }

  planeMesh.geometry.attributes.position.randomValues = randomValues
  planeMesh.geometry.attributes.position.originalPosition =
    planeMesh.geometry.attributes.position.array

  
  const colors = [] // Here we add the color we want to each vertice, whice we store in an array
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
    // R G B values. 
    // Goes up to 2.55, which is the brightest white
    colors.push(0.1, 0.5, 0.8); 
  }

  // Sets the color of the plane
  planeMesh.geometry.setAttribute(
    'color',
    new THREE.BufferAttribute( // https://threejs.org/docs/#api/en/core/BufferAttribute
      new Float32Array(colors), 3
    )
  );
}

// Creates a mouse object
const mouse = {
  x: undefined,
  y: undefined
}

let frame = 0; // Gonna use this for animating the vertices


function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  raycaster.setFromCamera(mouse, camera)
  frame += 0.01;

  const {array, originalPosition, randomValues} = planeMesh.geometry.attributes.position;

  for (let i = 0; i < array.length; i += 3) {
    // x
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.008;

    // y
    array[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.008;
  }

  planeMesh.geometry.attributes.position.needsUpdate = true

  const intersects = raycaster.intersectObject(planeMesh)
  if (intersects.length > 0) {
    const { color } = intersects[0].object.geometry.attributes

    // vertice 1
    color.setX(intersects[0].face.a, 0.1) // R
    color.setY(intersects[0].face.a, 0.5) // G
    color.setZ(intersects[0].face.a, 1)   // B

    // vertice 2
    color.setX(intersects[0].face.b, 0.1)
    color.setY(intersects[0].face.b, 0.5)
    color.setZ(intersects[0].face.b, 1)

    // vertice 3
    color.setX(intersects[0].face.c, 0.1)
    color.setY(intersects[0].face.c, 0.5)
    color.setZ(intersects[0].face.c, 1)

    intersects[0].object.geometry.attributes.color.needsUpdate = true

    // Once the hover effect is over it goes back to this color
    // Is the same color as the once set in the start 
    const initialColor = {
      r: 0.1,
      g: 0.5,
      b: 0.8
    }

    // Self-explanatory
    const hoverColor = {
      r: 1.5,
      g: 1.5,
      b: 1.5
    }

    // Using the gsap library to make the hover effect easier to achieve
    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      duration: 1, // how long the fade lasts
      onUpdate: () => {
        // vertice 1
        color.setX(intersects[0].face.a, hoverColor.r)
        color.setY(intersects[0].face.a, hoverColor.g)
        color.setZ(intersects[0].face.a, hoverColor.b)

        // vertice 2
        color.setX(intersects[0].face.b, hoverColor.r)
        color.setY(intersects[0].face.b, hoverColor.g)
        color.setZ(intersects[0].face.b, hoverColor.b)

        // vertice 3
        color.setX(intersects[0].face.c, hoverColor.r)
        color.setY(intersects[0].face.c, hoverColor.g)
        color.setZ(intersects[0].face.c, hoverColor.b)
        color.needsUpdate = true
      }
    })
  }
} animate() // Don't forget to call the function!

// Tracking mouse movement
addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1
  mouse.y = -(event.clientY / innerHeight) * 2 + 1
})
