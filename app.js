// ==========================================
// 1. CONFIGURACIÓN DEL ENTORNO 3D
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e); // Fondo gris oscuro tipo software de modelado

// --- CONFIGURACIÓN DE CÁMARAS (PERSPECTIVA Y ORTOGONAL) ---
const aspecto = container.clientWidth / container.clientHeight;
const frustumSize = 10; // Tamaño del área visible para la cámara ortogonal

// 1. Cámara de Perspectiva (La que ya usabas)
const cameraPerspective = new THREE.PerspectiveCamera(45, aspecto, 0.1, 100);
cameraPerspective.position.set(0, 5, 12);

// 2. Cámara Ortogonal (Para vistas planas sin perspectiva tipo Blender)
const cameraOrthographic = new THREE.OrthographicCamera(
    (frustumSize * aspecto) / -2, (frustumSize * aspecto) / 2,
    frustumSize / 2, frustumSize / -2,
    0.1, 100
);
cameraOrthographic.position.set(0, 5, 12);

// Variable que apunta a la cámara activa en este momento (empieza en perspectiva)
let camera = cameraPerspective;

// Renderizador + Configuración de Tono (Permite que funcione el slider de Exposición)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Mapeo tonal cinematográfico para mejores colores
renderer.toneMappingExposure = 1.0; 
container.appendChild(renderer.domElement);

// Controles de Mouse (OrbitControls)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ==========================================
// 2. ILUMINACIÓN ESTUDIO
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const dirLightMain = new THREE.DirectionalLight(0xffffff, 1.5);
dirLightMain.position.set(10, 15, 10);
scene.add(dirLightMain);

const dirLightFill = new THREE.DirectionalLight(0xffffff, 0.8);
dirLightFill.position.set(-10, 15, -10); // Luz de contra para suavizar sombras oscuras
scene.add(dirLightFill);

// Guía de suelo (Cuadrícula)
const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
scene.add(gridHelper);

// ==========================================
// 3. VARIABLES DE CONTROL E INTERFAZ
// ==========================================
let objetosEnEscena = []; 
let espaciado = 0.0;     
let objetoSeleccionado = null;

const grupoModelos = new THREE.Group();
scene.add(grupoModelos);

// Captura de elementos de la interfaz (Sliders y Listado)
const spacingSlider = document.getElementById('spacing-slider');
const spacingValue = document.getElementById('spacing-value');
const exposureSlider = document.getElementById('exposure-slider');
const exposureValue = document.getElementById('exposure-value');
const ambientSlider = document.getElementById('ambient-slider');
const ambientValue = document.getElementById('ambient-value');
const mainLightSlider = document.getElementById('main-light-slider');
const mainLightValue = document.getElementById('main-light-value');
const fillLightSlider = document.getElementById('fill-light-slider');
const fillLightValue = document.getElementById('fill-light-value');
const objectsListContainer = document.getElementById('objects-list');

// ==========================================
// 4. GENERACIÓN AUTOMÁTICA DE LA GALERÍA (JSON)
// ==========================================
const loader = new THREE.GLTFLoader();
const galleryContainer = document.getElementById('gallery');

fetch('lista_assets.json')
    .then(response => response.json())
    .then(assets => {
        assets.forEach(asset => {
            const boton = document.createElement('button');
            boton.className = 'asset-btn';
            boton.setAttribute('data-model', `GLB/${asset.archivo}`);

            boton.innerHTML = `
                <img src="GLB/${asset.imagen}" alt="${asset.nombre}" class="asset-thumb">
                <span class="asset-name">${asset.nombre}</span>
            `;

            boton.addEventListener('click', () => {
                const urlModelo = boton.getAttribute('data-model');
                cargarModelo(urlModelo, asset.nombre);
            });

            galleryContainer.appendChild(boton);
        });
    })
    .catch(error => {
        console.error("Error al cargar lista_assets.json:", error);
    });

function cargarModelo(url, nombreLegible) {
    loader.load(url, (gltf) => {
        const modelo = gltf.scene;

        modelo.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Medir el ancho real en el eje X usando Bounding Box
        const box = new THREE.Box3().setFromObject(modelo);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        modelo.userData.anchoX = size.x;
        modelo.userData.nombreArchivo = url;
        // Identificador único para poder eliminarlo de la lista sin confusiones
        modelo.userData.idUnico = Date.now() + Math.random().toString(36).substr(2, 5);
        modelo.userData.nombreUI = nombreLegible;

        grupoModelos.add(modelo);
        objetosEnEscena.push(modelo);

        alinearObjetos();
        actualizarListaUI();
        
    }, undefined, (error) => {
        console.error(error);
        alert(`No se pudo cargar el archivo 3D desde la ruta: "${url}".`);
    });
}

// ==========================================
// 5. ALINEACIÓN AUTOMÁTICA DE LA FILA (PRECISIÓN MILIMÉTRICA)
// ==========================================
const spacingInput = document.getElementById('spacing-input');

// Función centralizada para actualizar el valor y mover los objetos
function actualizarEspaciado(nuevoValor) {
    // Limitamos el valor entre el mínimo y máximo permitido
    espaciado = Math.max(-2, Math.min(5, parseFloat(nuevoValor) || 0));
    
    // Sincronizamos los dos elementos de la interfaz
    if (spacingSlider) spacingSlider.value = espaciado;
    if (spacingInput) spacingInput.value = espaciado.toFixed(2);
    
    // Re-alineamos la fila en el visor 3D
    alinearObjetos();
}

// A. Escuchador para el Slider (Arrastrar el mouse)
if (spacingSlider) {
    spacingSlider.addEventListener('input', (e) => {
        actualizarEspaciado(e.target.value);
    });
}

// B. Escuchador para el Input Numérico (Tipear con el teclado)
if (spacingInput) {
    spacingInput.addEventListener('change', (e) => {
        actualizarEspaciado(e.target.value);
    });
    
    // También actualiza mientras escribes, sin esperar a presionar Enter
    spacingInput.addEventListener('input', (e) => {
        if(e.target.value !== "-" && e.target.value !== "") {
            actualizarEspaciado(e.target.value);
        }
    });

    // C. CONTROL CON LA RUEDA DEL MOUSE (Mouse Wheel)
    // Cuando el cursor esté sobre el cuadro, girar la rueda sube/baja de a 1cm (0.01)
    spacingInput.addEventListener('wheel', (e) => {
        e.preventDefault(); // Evita que la página web haga scroll hacia arriba o abajo
        
        // e.deltaY es negativo si giras la rueda hacia arriba, positivo hacia abajo
        const direccion = e.deltaY < 0 ? 1 : -1;
        const paso = 0.01; // Ajuste fino de 1 centímetro
        
        const calculo = espaciado + (direccion * paso);
        actualizarEspaciado(calculo);
    });
}

function alinearObjetos() {
    let xAcumulado = 0;
    objetosEnEscena.forEach((modelo, index) => {
        const mitadAnchoActual = modelo.userData.anchoX / 2;
        if (index === 0) {
            modelo.position.set(mitadAnchoActual, 0, 0);
            xAcumulado = modelo.userData.anchoX;
        } else {
            const posicionX = xAcumulado + espaciado + mitadAnchoActual;
            modelo.position.set(posicionX, 0, 0);
            xAcumulado = posicionX + mitadAnchoActual;
        }
    });
}

// ==========================================
// 6. CONTROL DINÁMICO DE LUCES EN TIEMPO REAL
// ==========================================
if(exposureSlider) {
    exposureSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        renderer.toneMappingExposure = val;
        exposureValue.textContent = val.toFixed(1);
    });
}

if(ambientSlider) {
    ambientSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        ambientLight.intensity = val;
        ambientValue.textContent = val.toFixed(1);
    });
}

if(mainLightSlider) {
    mainLightSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        dirLightMain.intensity = val;
        mainLightValue.textContent = val.toFixed(1);
    });
}

if(fillLightSlider) {
    fillLightSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        dirLightFill.intensity = val;
        fillLightValue.textContent = val.toFixed(1);
    });
}

// ==========================================
// 7. GESTIÓN DE LA LISTA DE CAPAS Y ELIMINACIÓN
// ==========================================
function actualizarListaUI() {
    if (!objectsListContainer) return;
    objectsListContainer.innerHTML = ''; 

    if (objetosEnEscena.length === 0) {
        objectsListContainer.innerHTML = '<p class="empty-list-msg">No hay objetos en la escena</p>';
        return;
    }

    objetosEnEscena.forEach((modelo, index) => {
        const item = document.createElement('div');
        item.className = 'object-item';
        if (objetoSeleccionado === modelo) item.classList.add('selected');

        item.innerHTML = `
            <span style="cursor:pointer; flex-grow:1;">${index + 1}. ${modelo.userData.nombreUI}</span>
            <button class="delete-item-btn" title="Eliminar Objeto">×</button>
        `;

        // Seleccionar haciendo clic en el texto de la lista derecha
        item.querySelector('span').addEventListener('click', () => {
            if (objetoSeleccionado) desmarcarObjeto(objetoSeleccionado);
            objetoSeleccionado = modelo;
            marcarObjeto(objetoSeleccionado);
            actualizarListaUI();
        });

        // Eliminar haciendo clic en la cruz de la lista derecha
        item.querySelector('.delete-item-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Evita disparar la selección al querer borrar
            eliminarObjetoDeEscena(modelo);
        });

        objectsListContainer.appendChild(item);
    });
}

function eliminarObjetoDeEscena(modelo) {
    if (objetoSeleccionado === modelo) objetoSeleccionado = null;

    grupoModelos.remove(modelo);

    // Limpieza de memoria (Garantiza que la PC no se ralentice al borrar)
    modelo.traverse((child) => {
        if (child.isMesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    });

    // Filtrar la lista lógica para quitar el objeto eliminado
    objetosEnEscena = objetosEnEscena.filter(obj => obj.userData.idUnico !== modelo.userData.idUnico);

    alinearObjetos();
    actualizarListaUI();
}

// ==========================================
// 8. SELECCIÓN POR CLIC EN EL VISOR 3D (RAYCASTING)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('keydown', (event) => {
    // --- CONTROLES DE VISTA TIPO BLENDER (NUMPAD) ---
    
    // Tecla 1 o Numpad 1: VISTA FRONTAL (Ortogonal)
    if (event.key === '1' || event.code === 'Numpad1') {
        camera = cameraOrthographic;
        camera.position.set(0, 0, 12); // Se clava de frente en el eje Z
        camera.lookAt(0, 0, 0);
        controls.object = camera; // Le avisa a OrbitControls el cambio de cámara
        controls.enableRotate = false; // Bloquea la rotación para mantener la vista técnica plana
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    // Tecla 3 o Numpad 3: VISTA LATERAL (Ortogonal)
    else if (event.key === '3' || event.code === 'Numpad3') {
        camera = cameraOrthographic;
        camera.position.set(12, 0, 0); // Se clava de costado en el eje X
        camera.lookAt(0, 0, 0);
        controls.object = camera;
        controls.enableRotate = false;
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    // Tecla 7 o Numpad 7: VISTA SUPERIOR / PLANTA (Ortogonal)
    else if (event.key === '7' || event.code === 'Numpad7') {
        camera = cameraOrthographic;
        camera.position.set(0, 12, 0); // Se clava arriba en el eje Y
        camera.lookAt(0, 0, 0);
        controls.object = camera;
        controls.enableRotate = false;
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    // Tecla 5 o Numpad 5: REGRESAR A VISTA PERSPECTIVA LIBRE
    else if (event.key === '5' || event.code === 'Numpad5') {
        camera = cameraPerspective;
        controls.object = camera;
        controls.enableRotate = true; // Desbloquea la rotación libre con el mouse
        controls.update();
    }

    // --- (Aquí abajo continúa tu código original de intercambio con flechas) ---
    if (!objetoSeleccionado) return;
    const indiceActual = objetosEnEscena.indexOf(objetoSeleccionado);
    // ... resto de tu lógica de flechas ...
});

function marcarObjeto(modelo) {
    modelo.traverse((child) => {
        if (child.isMesh && child.material.emissive) {
            child.userData.originalEmissive = child.material.emissive.getHex();
            child.material.emissive.setHex(0x333333); // Le da un brillo grisáceo de selección
        }
    });
}

function desmarcarObjeto(modelo) {
    modelo.traverse((child) => {
        if (child.isMesh && child.material.emissive) {
            const original = child.userData.originalEmissive || 0x000000;
            child.material.emissive.setHex(original);
        }
    });
}

// Intercambio (Swap) con flechas del teclado
window.addEventListener('keydown', (event) => {
    if (!objetoSeleccionado) return;
    const indiceActual = objetosEnEscena.indexOf(objetoSeleccionado);

    if (event.key === 'ArrowRight' && indiceActual < objetosEnEscena.length - 1) {
        [objetosEnEscena[indiceActual], objetosEnEscena[indiceActual + 1]] = 
        [objetosEnEscena[indiceActual + 1], objetosEnEscena[indiceActual]];
        alinearObjetos();
        actualizarListaUI();
    } 
    else if (event.key === 'ArrowLeft' && indiceActual > 0) {
        [objetosEnEscena[indiceActual], objetosEnEscena[indiceActual - 1]] = 
        [objetosEnEscena[indiceActual - 1], objetosEnEscena[indiceActual]];
        alinearObjetos();
        actualizarListaUI();
    }
});

// ==========================================
// 9. EXPORTACIÓN ROBUSTA DE ESCENA (.GLB BINARIO + JSON)
// ==========================================
const botonExportar = document.getElementById('export-btn');
if(botonExportar) botonExportar.addEventListener('click', exportarTodo);

function exportarTodo() {
    if (objetosEnEscena.length === 0) {
        alert("Primero debes agregar modelos a la escena.");
        return;
    }

    // 1. OCULTAMOS TEMPORALMENTE LO QUE NO QUEREMOS EN EL .GLB FINAL
    // Si dejamos la cuadrícula, el exportador intentará meterla en el archivo 3D.
    gridHelper.visible = false;

    const exporter = new THREE.GLTFExporter();
    
    // Configuración estricta para el parseo
    const opciones = {
        binary: true,        // Fuerza salida .glb binaria real
        onlyVisible: true    // Crucial: al estar oculta la cuadrícula, no la exportará
    };

    // --- LA MAGIA ---
    // En lugar de pasar un grupo clonado que se rompe, pasamos el 'grupoModelos' real directo.
    exporter.parse(grupoModelos, function (gltf) {
        
        // Volvemos a hacer visible la cuadrícula en tu visor para que sigas trabajando normalmente
        gridHelper.visible = true;

        // Forzamos al Blob a empaquetar el ArrayBuffer crudo (los megabytes reales de tus mallas)
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'escena_completa.glb';
        link.click();
        
        // Limpieza de memoria
        setTimeout(() => URL.revokeObjectURL(link.href), 100);

    }, function (error) { 
        // Si algo falla por dentro, la consola ahora sí nos va a cantar el error exacto
        gridHelper.visible = true;
        console.error("Error crítico en el empaquetado:", error); 
        alert("Error al procesar el archivo binario.");
    }, opciones);

    // ========================================================
    // B. EXPORTAR EL ARCHIVO JSON DE POSICIONES (Se mantiene igual)
    // ========================================================
    const dataPosiciones = {
        configuracion: { espaciadoMetros: espaciado },
        assets: objetosEnEscena.map((modelo, index) => ({
            ordenFila: index,
            archivoOriginal: modelo.userData.nombreArchivo,
            posicionMundo: { 
                x: parseFloat(modelo.position.x.toFixed(4)), 
                y: parseFloat(modelo.position.y.toFixed(4)), 
                z: parseFloat(modelo.position.z.toFixed(4)) 
            }
        }))
    };

    const jsonBlob = new Blob([JSON.stringify(dataPosiciones, null, 2)], { type: 'application/json' });
    const linkJson = document.createElement('a');
    linkJson.href = URL.createObjectURL(jsonBlob);
    linkJson.download = 'posiciones_assets.json';
    linkJson.click();
    setTimeout(() => URL.revokeObjectURL(linkJson.href), 100);
}

// ==========================================
// 10. BUCLE DE ANIMACIÓN Y RENDER CONTINUO
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const nuevoAspecto = container.clientWidth / container.clientHeight;
    
    // Actualizar Perspectiva
    cameraPerspective.aspect = nuevoAspecto;
    cameraPerspective.updateProjectionMatrix();
    
    // Actualizar Ortogonal
    cameraOrthographic.left = (frustumSize * nuevoAspecto) / -2;
    cameraOrthographic.right = (frustumSize * nuevoAspecto) / 2;
    cameraOrthographic.top = frustumSize / 2;
    cameraOrthographic.bottom = frustumSize / -2;
    cameraOrthographic.updateProjectionMatrix();
    
    renderer.setSize(container.clientWidth, container.clientHeight);
});