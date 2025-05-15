// 主JavaScript文件，实现3D太阳系场景
let scene, camera, renderer, controls;
let planets = {};
let planetMeshes = {};
let planetLabels = {};
let planetOrbits = {};
let selectedPlanet = null;
let raycaster, mouse;
let textureLoader;
let clock = new THREE.Clock();
let loadingManager;
let totalAssetsToLoad = 0;
let assetsLoaded = 0;

// 初始化
function init() {
    // 创建加载管理器
    loadingManager = new THREE.LoadingManager();
    loadingManager.onStart = function(url, itemsLoaded, itemsTotal) {
        totalAssetsToLoad = itemsTotal;
    };
    
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        assetsLoaded = itemsLoaded;
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        document.querySelector('.loading-text').textContent = `加载中... ${progress}%`;
    };
    
    loadingManager.onLoad = function() {
        document.getElementById('loading').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    };

    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 250, 350);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('container').appendChild(renderer.domElement);
    
    // 创建控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 设置光照
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const sunLight = new THREE.PointLight(0xffffff, 2, 0, 1);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    // 创建太空背景
    createStarBackground();

    // 加载纹理
    textureLoader = new THREE.TextureLoader(loadingManager);
    
    // 添加行星
    createPlanets();
    
    // 创建射线投射器用于鼠标交互
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 添加事件监听器
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onMouseClick, false);
    document.getElementById('close-info').addEventListener('click', closeInfoPanel);
    
    // 开始动画循环
    animate();
}

// 创建星空背景
function createStarBackground() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        sizeAttenuation: false
    });
    
    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

// 创建所有行星
function createPlanets() {
    for (const planetKey in PLANET_DATA) {
        const planetInfo = PLANET_DATA[planetKey];
        createPlanet(planetKey, planetInfo);
    }
}

// 创建单个行星
function createPlanet(planetKey, planetInfo) {
    const textureMap = textureLoader.load(planetInfo.texture);
    
    // 创建材质
    let material;
    if (planetInfo.emissive) {
        material = new THREE.MeshBasicMaterial({
            map: textureMap,
            emissive: planetInfo.emissiveColor,
            emissiveIntensity: planetInfo.emissiveIntensity,
            emissiveMap: textureMap
        });
    } else {
        material = new THREE.MeshStandardMaterial({
            map: textureMap,
            roughness: 0.8,
            metalness: 0.1
        });
    }
    
    // 创建几何体和网格
    const geometry = new THREE.SphereGeometry(planetInfo.size, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);
    
    // 设置位置
    const [x, y, z] = planetInfo.position;
    mesh.position.set(x, y, z);
    
    // 存储行星引用
    planets[planetKey] = planetInfo;
    planetMeshes[planetKey] = mesh;
    
    // 添加轨道
    if (planetKey !== 'sun') {
        createOrbit(planetKey, planetInfo.orbitRadius);
    }
    
    // 添加标签
    createPlanetLabel(planetKey, mesh, planetInfo.name);
    
    // 添加环（如果有）
    if (planetInfo.hasRings) {
        createRings(planetKey, planetInfo);
    }
    
    // 添加卫星（如果有）
    if (planetInfo.hasMoon) {
        createMoon(planetKey, planetInfo);
    }
    
    // 添加到场景
    scene.add(mesh);
}

// 创建行星轨道
function createOrbit(planetKey, radius) {
    const orbitGeometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x3a4b5c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
    });
    
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    planetOrbits[planetKey] = orbit;
}

// 创建行星标签
function createPlanetLabel(planetKey, planetMesh, name) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = name;
    labelDiv.style.opacity = '0';
    
    const label = new THREE.CSS2DObject(labelDiv);
    label.position.set(0, planetMesh.geometry.parameters.radius + 2, 0);
    planetMesh.add(label);
    
    planetLabels[planetKey] = labelDiv;
}

// 创建行星环系统
function createRings(planetKey, planetInfo) {
    const ringTexture = textureLoader.load(planetInfo.ringTexture);
    const ringGeometry = new THREE.RingGeometry(
        planetInfo.size + 4,
        planetInfo.size + planetInfo.ringSize,
        128
    );
    
    // 调整UV以匹配环形纹理
    const pos = ringGeometry.attributes.position;
    const uvs = ringGeometry.attributes.uv;
    
    for (let i = 0; i < pos.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(pos, i);
        
        const distanceToCenter = vertex.length();
        const normDistToCenter = (distanceToCenter - (planetInfo.size + 4)) / (planetInfo.ringSize - 4);
        const v = 1 - normDistToCenter;
        
        uvs.setXY(i, 0, v);
    }
    
    const ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    
    planetMeshes[planetKey].add(ring);
}

// 创建月球
function createMoon(planetKey, planetInfo) {
    const moonInfo = planetInfo.moonData;
    const moonTexture = textureLoader.load(moonInfo.texture);
    
    const moonGeometry = new THREE.SphereGeometry(moonInfo.size, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    // 创建月球轨道群组
    const moonOrbit = new THREE.Group();
    moonOrbit.position.copy(planetMeshes[planetKey].position);
    
    // 设置月球位置
    moon.position.x = moonInfo.orbitRadius;
    
    // 添加到轨道群组
    moonOrbit.add(moon);
    scene.add(moonOrbit);
    
    // 存储月球引用
    planetMeshes[`${planetKey}_moon`] = moon;
    planetMeshes[`${planetKey}_moonOrbit`] = moonOrbit;
}

// 窗口大小调整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 鼠标移动处理
function onMouseMove(event) {
    // 将鼠标位置归一化为-1到1之间
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// 鼠标点击处理
function onMouseClick(event) {
    // 更新射线投射器
    raycaster.setFromCamera(mouse, camera);
    
    // 获取与射线相交的对象
    const planetObjects = Object.values(planetMeshes);
    const intersects = raycaster.intersectObjects(planetObjects);
    
    if (intersects.length > 0) {
        // 找到被点击的行星
        const clickedMesh = intersects[0].object;
        let clickedPlanetKey;
        
        for (const key in planetMeshes) {
            if (planetMeshes[key] === clickedMesh) {
                clickedPlanetKey = key.split('_')[0]; // 处理月球的情况
                break;
            }
        }
        
        if (clickedPlanetKey) {
            selectPlanet(clickedPlanetKey);
        }
    }
}

// 选择行星，显示信息并聚焦相机
function selectPlanet(planetKey) {
    selectedPlanet = planetKey;
    const planetInfo = planets[planetKey];
    
    // 更新信息面板
    document.getElementById('planet-name').textContent = planetInfo.name;
    document.getElementById('planet-diameter').textContent = `直径: ${planetInfo.diameter}`;
    document.getElementById('planet-distance').textContent = `距离太阳: ${planetInfo.distance}`;
    document.getElementById('planet-orbit-period').textContent = `公转周期: ${planetInfo.orbitPeriod}`;
    document.getElementById('planet-rotation-period').textContent = `自转周期: ${planetInfo.rotationPeriod}`;
    document.getElementById('planet-description').textContent = `描述: ${planetInfo.description}`;
    
    // 显示信息面板
    document.getElementById('info-panel').classList.remove('hidden');
    
    // 平滑移动相机到行星位置
    const targetPosition = planetMeshes[planetKey].position.clone();
    const offset = planetInfo.size * 4; // 相机与行星的距离
    
    // 计算相机的新位置
    const camTargetPos = new THREE.Vector3(
        targetPosition.x + offset,
        targetPosition.y + offset / 2,
        targetPosition.z + offset
    );
    
    // 使用TWEEN库进行平滑过渡
    new TWEEN.Tween(camera.position)
        .to(camTargetPos, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    
    // 移动轨道控制器的目标点
    new TWEEN.Tween(controls.target)
        .to(targetPosition, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
}

// 关闭信息面板，返回整个太阳系视图
function closeInfoPanel() {
    document.getElementById('info-panel').classList.add('hidden');
    selectedPlanet = null;
    
    // 平滑返回初始视角
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 250, z: 350 }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    
    new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
}

// 更新行星位置和旋转
function updatePlanets(deltaTime) {
    for (const planetKey in planets) {
        const planetInfo = planets[planetKey];
        const planetMesh = planetMeshes[planetKey];
        
        if (planetKey !== 'sun') {
            // 更新行星自转
            planetMesh.rotation.y += planetInfo.rotationSpeed * deltaTime;
            
            // 更新行星公转
            const angle = Date.now() * 0.0001 * planetInfo.orbitSpeed;
            planetMesh.position.x = Math.cos(angle) * planetInfo.orbitRadius;
            planetMesh.position.z = Math.sin(angle) * planetInfo.orbitRadius;
            
            // 更新月球（如果有）
            if (planetInfo.hasMoon) {
                const moonOrbit = planetMeshes[`${planetKey}_moonOrbit`];
                const moon = planetMeshes[`${planetKey}_moon`];
                
                // 更新月球公转轨道位置与行星保持一致
                moonOrbit.position.copy(planetMesh.position);
                
                // 更新月球自转
                moon.rotation.y += planetInfo.moonData.rotationSpeed * deltaTime;
                
                // 更新月球公转
                const moonAngle = Date.now() * 0.0001 * planetInfo.moonData.orbitSpeed;
                moon.position.x = Math.cos(moonAngle) * planetInfo.moonData.orbitRadius;
                moon.position.z = Math.sin(moonAngle) * planetInfo.moonData.orbitRadius;
            }
        } else {
            // 太阳只自转
            planetMesh.rotation.y += planetInfo.rotationSpeed * deltaTime;
        }
    }
}

// 更新标签可见性
function updateLabels() {
    raycaster.setFromCamera(mouse, camera);
    const planetObjects = Object.values(planetMeshes);
    const intersects = raycaster.intersectObjects(planetObjects);
    
    // 重置所有标签
    for (const key in planetLabels) {
        planetLabels[key].style.opacity = '0';
    }
    
    // 显示鼠标悬停的行星标签
    if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        
        for (const key in planetMeshes) {
            if (planetMeshes[key] === hoveredMesh) {
                const planetKey = key.split('_')[0]; // 处理月球的情况
                planetLabels[planetKey].style.opacity = '1';
                break;
            }
        }
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // 更新控制器
    controls.update();
    
    // 更新行星
    updatePlanets(deltaTime);
    
    // 更新标签
    updateLabels();
    
    // 更新动画
    TWEEN.update();
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 添加TWEEN库
function addTweenScript() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

// 添加CSS2DRenderer库
function addCSS2DRenderer() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/renderers/CSS2DRenderer.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

// 加载所有依赖并初始化
async function loadDependenciesAndInit() {
    await Promise.all([
        addTweenScript(),
        addCSS2DRenderer()
    ]);
    
    init();
}

// 启动应用
loadDependenciesAndInit(); 