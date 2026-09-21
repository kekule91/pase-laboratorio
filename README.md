# Pase de Laboratorio — TP Reacciones químicas

Sitio para que el curso haga el examen de habilitación **antes** de entrar al laboratorio.

- **Los estudiantes** abren el link, leen la consigna, aprueban 4 estaciones y descargan el pase.
- **A vos** te llega cada habilitación como **una fila en una hoja de Google** (tu Drive). Esa planilla es la que controlás en la puerta.

GitHub Pages **no** guarda los resultados. Solo hospeda la página.

## Link del curso

Cuando GitHub Pages termine de publicar:

**https://kekule91.github.io/pase-laboratorio/**

Si el link todavía no abre, en el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions** (o *Deploy from a branch → main → / (root)*).

## Cómo te llega la información

1. El estudiante aprueba las 4 estaciones.
2. El celular muestra el pase (aunque no haya señal).
3. En cuanto hay conexión, manda una fila a **tu** Google Sheet:
   - Fecha
   - Apellido y nombre
   - Curso (42 TM, 45 TM, 42 TT, 53 TT)
   - Grupo (A o B)
   - Código de 6 caracteres (el mismo del PNG)
   - Intentos de cada estación
   - Preguntas que falló
4. Si la misma persona (mismo nombre + curso) vuelve a aprobar, **no se duplica**: se actualiza la fila y queda `(reintento)` en Observaciones.

En la puerta del lab: abrís la planilla, buscás el nombre o el código del PNG, y listo.

Hasta que no pegues la URL de Apps Script, el pase se genera igual pero **la fila no aparece**.

---

## Una sola vez: conectar tu planilla

1. En Google Drive, creá una hoja de cálculo vacía. Nombre sugerido: `Pases laboratorio — TP reacciones`.
2. Menú **Extensiones → Apps Script**.
3. Borrá el código que aparece y pegá el de [`apps-script/Code.gs`](apps-script/Code.gs).
4. Guardá (Ctrl+S). Nombre del proyecto: `Pase de Laboratorio`.
5. **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copiá la URL que termina en `/exec`.
7. Pegala en `api.js`, reemplazando `PEGAR_URL_DEL_WEB_APP`.
8. Abrí esa URL en el navegador: tiene que decir `OK`.

La hoja **Pases** se crea sola la primera vez que alguien aprueba.

Cursos: 42 TM, 45 TM, 42 TT, 53 TT. Se editan en `questions.js` si cambia la oferta.

## Criterios

| Estación | Preguntas | Aprueba con |
| -------- | --------- | ----------- |
| 1 Lectura | 5 al azar | 4/5 |
| 2 Organización | 4 al azar | 3/4 |
| 3 Seguridad | las 6 | **6/6** |
| 4 Conceptos | 6 al azar | 5/6 |
