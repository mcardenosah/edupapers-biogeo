# EduPapers BioGeo 🌿🪨

> Radar de publicaciones y vigilancia didáctica en **Biología y Geología**.

**EduPapers BioGeo** es una aplicación web interactiva diseñada para docentes e investigadores de didáctica de las ciencias naturales. Monitoriza en tiempo real más de **20 revistas científicas de impacto** internacional e iberoamericano especializadas en biología, ciencias de la Tierra, educación ambiental y didáctica experimental mediante la API abierta de [OpenAlex](https://openalex.org).

---

## ✨ Características Principales

- 📡 **Radar en tiempo real**: Detecta publicaciones aparecidas en las últimas 24 horas y durante la última semana.
- 🧬 **Especialidad Bio & Geo**: Acceso rápido a investigaciones de biología (genética, ecología, evolución, botánica, zoología) y geología (ciencias de la Tierra, tectónica, paleontología).
- 🏷️ **Conceptos clave automáticos**: Detección de tendencias conceptuales impulsada por los modelos semánticos de OpenAlex.
- 📌 **Pestañas personalizadas persistentes**: Guarda tus combinaciones de filtros temáticos favoritos en tu navegador.
- 📝 **Exportación a Obsidian / Markdown**: Genera fichas con metadatos YAML listos para incorporar a tu gestor de notas.
- 🌐 **Traducción con un clic**: Integración directa con DeepL y Softcatalà.

---

## 📚 Revistas Indexadas

### Biología y Ciencias de la Vida
- *Journal of Biological Education*
- *The American Biology Teacher*
- *CBE—Life Sciences Education*
- *CourseSource*
- *Biochemistry and Molecular Biology Education* (BAMBEd)
- *Journal of Microbiology & Biology Education* (JMBE)
- *Evolution: Education and Outreach*

### Geología y Ciencias de la Tierra
- *Journal of Geoscience Education*
- *Enseñanza de las Ciencias de la Tierra* (AEPECT)

### Educación Ambiental y Sostenibilidad
- *Environmental Education Research*
- *The Journal of Environmental Education*
- *International Journal of Environmental & Science Education* (IJESE)

### Didáctica General de las Ciencias Experimentales
- *Enseñanza de las Ciencias*
- *Revista Eureka sobre Enseñanza y Divulgación de las Ciencias*
- *Didáctica de las Ciencias Experimentales y Sociales*
- *REEC: Revista Electrónica de Enseñanza de las Ciencias*
- *Ciències (Primària i Secundària)*
- *Ciência & Educação (Bauru)*
- *International Journal of Science Education*
- *Journal of Research in Science Teaching* (JRST)
- *Science Education*
- *Studies in Science Education*
- *Research in Science Education*
- *The Science Teacher*

---

## 🚀 Puesta en Marcha en Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Compilar para producción**:
   ```bash
   npm run build
   ```

---

## 🌐 Publicación en GitHub y GitHub Pages

1. Crea un nuevo repositorio en tu cuenta de GitHub (ej. `edupapers-biogeo`).
2. Conecta este directorio local:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/edupapers-biogeo.git
   git branch -M main
   git push -u origin main
   ```
3. Para publicar en **GitHub Pages**, puedes desplegar la carpeta `dist` generada tras ejecutar `npm run build` o activar GitHub Actions.

---

## 📄 Licencia y Créditos
Impulsado por los datos abiertos de la [API de OpenAlex](https://openalex.org).
