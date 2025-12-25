// --- UPDATED DOOR CREATION SNIPPET ---
const loader = new THREE.TextureLoader();
const doorTexture = loader.load('door.png'); // <--- PASTE LINK HERE

const doorMat = new THREE.MeshPhongMaterial({ 
    map: doorTexture, 
    emissive: 0x222222 
});

const panel = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 1), doorMat);
doorFrame.add(panel);
// Ensure enemy spawns exactly in the center of the corridor
enemy.position.set(
    (MAZE_SIZE - 2) * WALL_SIZE, 
    0, 
    (MAZE_SIZE - 2) * WALL_SIZE
);
// --- NEW AI VARIABLES (Add these to your globals) ---
let enemyState = 'ROAM'; // 'ROAM' or 'CHASE'
let roamDir = { x: 0, z: 0 };
let roamTimer = 0;

// --- REPLACE THE ENEMY SECTION IN update() WITH THIS ---

// 1. Calculate Distance
const edx = camera.position.x - enemy.position.x;
const edz = camera.position.z - enemy.position.z;
const dist = Math.sqrt(edx * edx + edz * edz);

// 2. Line of Sight Check (Simple version for grid)
let hasLoS = false;
if (dist < 100) {
    // If the ghost and player are in the same "row" or "column" 
    const sameCol = Math.abs(Math.round(camera.position.x / WALL_SIZE) - Math.round(enemy.position.x / WALL_SIZE)) < 1;
    const sameRow = Math.abs(Math.round(camera.position.z / WALL_SIZE) - Math.round(enemy.position.z / WALL_SIZE)) < 1;
    
    if (sameCol || sameRow) hasLoS = true; 
}

// 3. State Machine
if (hasLoS || dist < 40) {
    enemyState = 'CHASE';
} else if (dist > 120) {
    enemyState = 'ROAM';
}

if (enemyState === 'CHASE') {
    // Chase Logic (Sliding Collision)
    const moveX = (edx / dist) * ENEMY_SPEED;
    const moveZ = (edz / dist) * ENEMY_SPEED;
    
    if (!checkCol(enemy.position.x + moveX, enemy.position.z)) enemy.position.x += moveX;
    if (!checkCol(enemy.position.x, enemy.position.z + moveZ)) enemy.position.z += moveZ;

    // Faster music during chase
    if (music) music.setPlaybackRate(1.2);
} else {
    // Roam Logic
    if (roamTimer <= 0) {
        // Pick a random cardinal direction
        const dirs = [{x:1, z:0}, {x:-1, z:0}, {x:0, z:1}, {x:0, z:-1}];
        roamDir = dirs[Math.floor(Math.random() * dirs.length)];
        roamTimer = 100 + Math.random() * 100; // Roam for a bit
    }

    const rx = roamDir.x * (ENEMY_SPEED * 0.5); // Roam slower than chase
    const rz = roamDir.z * (ENEMY_SPEED * 0.5);

    // If hits wall, reset timer to pick new direction immediately
    if (checkCol(enemy.position.x + rx, enemy.position.z + rz)) {
        roamTimer = 0;
    } else {
        enemy.position.x += rx;
        enemy.position.z += rz;
    }
    roamTimer--;
    
    if (music) music.setPlaybackRate(1.0);
}

// 4. Update Visuals
enemy.position.y = Math.sin(Date.now() * 0.005) * 2;
// Intensity of red light pulses when chasing
enemy.children[0].intensity = (enemyState === 'CHASE') ? 6 : 2;