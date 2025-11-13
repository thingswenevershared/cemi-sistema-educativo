/**
 * Script de prueba para endpoints de Cursado
 */

const API_BASE = 'http://localhost:3000/api';

async function testEndpoints() {
    console.log('🧪 Iniciando pruebas de endpoints Cursado...\n');

    try {
        // 1. Test filtros/opciones
        console.log('1️⃣ Probando GET /cursos/filtros/opciones...');
        const filtrosRes = await fetch(`${API_BASE}/cursos/filtros/opciones`);
        const filtrosData = await filtrosRes.json();
        console.log('✅ Filtros:', JSON.stringify(filtrosData, null, 2));
        console.log('');

        // 2. Test mis-cursos (usando id_alumno de ejemplo)
        const idAlumno = 1; // Cambiar por un ID real
        console.log(`2️⃣ Probando GET /cursos/mis-cursos/${idAlumno}...`);
        const misCursosRes = await fetch(`${API_BASE}/cursos/mis-cursos/${idAlumno}`);
        const misCursosData = await misCursosRes.json();
        console.log('✅ Mis Cursos:', JSON.stringify(misCursosData, null, 2));
        console.log('');

        // 3. Test catálogo
        console.log(`3️⃣ Probando GET /cursos/catalogo?id_alumno=${idAlumno}...`);
        const catalogoRes = await fetch(`${API_BASE}/cursos/catalogo?id_alumno=${idAlumno}`);
        const catalogoData = await catalogoRes.json();
        console.log('✅ Catálogo de Cursos:', JSON.stringify(catalogoData, null, 2));
        console.log('');

        // 4. Test detalle de curso (si hay cursos)
        if (catalogoData.cursos && catalogoData.cursos.length > 0) {
            const primerCurso = catalogoData.cursos[0];
            console.log(`4️⃣ Probando GET /cursos/${primerCurso.id_curso}/detalle?id_alumno=${idAlumno}...`);
            const detalleRes = await fetch(`${API_BASE}/cursos/${primerCurso.id_curso}/detalle?id_alumno=${idAlumno}`);
            const detalleData = await detalleRes.json();
            console.log('✅ Detalle del Curso:', JSON.stringify(detalleData, null, 2));
        }

        console.log('\n✅ Todas las pruebas completadas exitosamente!');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
}

testEndpoints();
