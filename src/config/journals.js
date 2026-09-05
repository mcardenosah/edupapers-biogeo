// Catálogo de revistas indexadas para EduPapers BioGeo
export const JOURNALS = [
  // --- Biología y Ciencias de la Vida ---
  {
    name: "Journal of Biological Education",
    category: "Biología",
    issns: ["0021-9266", "2157-6009"],
    scope: "Didáctica de la biología general, genética, botánica, zoología y biotecnología."
  },
  {
    name: "The American Biology Teacher",
    category: "Biología",
    issns: ["0002-7685", "1938-4211"],
    scope: "Experiencias de aula, laboratorios y didáctica de las ciencias biológicas."
  },
  {
    name: "CBE—Life Sciences Education",
    category: "Biología",
    issns: ["1931-7913"],
    scope: "Investigación en educación en ciencias de la vida y educación médica."
  },
  {
    name: "CourseSource",
    category: "Biología",
    issns: ["2332-6530"],
    scope: "Recursos didácticos abiertos revisados por pares para ciencias biológicas."
  },
  {
    name: "Biochemistry and Molecular Biology Education",
    category: "Biología",
    issns: ["1470-8175", "1539-3429"],
    scope: "Educación e innovación en bioquímica, biología molecular y celular."
  },
  {
    name: "Journal of Microbiology & Biology Education",
    category: "Biología",
    issns: ["1935-7877", "1935-7885"],
    scope: "Microbiología, bioseguridad y didáctica de las ciencias biológicas."
  },
  {
    name: "Evolution: Education and Outreach",
    category: "Biología",
    issns: ["1936-6426", "1936-6434"],
    scope: "Didáctica y divulgación sobre teoría evolutiva, paleontología y selección natural."
  },

  // --- Geología y Ciencias de la Tierra ---
  {
    name: "Journal of Geoscience Education",
    category: "Geología",
    issns: ["1089-9995", "2158-1428"],
    scope: "Didáctica de la geología, ciencias de la Tierra y procesos planetarios."
  },
  {
    name: "Enseñanza de las Ciencias de la Tierra",
    category: "Geología",
    issns: ["1132-9157", "2385-3484"],
    scope: "Revista de la AEPECT dedicada a la enseñanza y difusión de la geología."
  },

  // --- Educación Ambiental y Sostenibilidad ---
  {
    name: "Environmental Education Research",
    category: "Medio Ambiente",
    issns: ["1350-4622", "1469-5871"],
    scope: "Investigación en educación ambiental, cambio climático y sostenibilidad."
  },
  {
    name: "The Journal of Environmental Education",
    category: "Medio Ambiente",
    issns: ["0095-8964", "1940-1892"],
    scope: "Investigación pionera en didáctica ambiental, ecología y conservación."
  },
  {
    name: "The International Journal of Environmental and Science Education",
    category: "Medio Ambiente",
    issns: ["1306-3065"],
    scope: "Educación ambiental y enseñanza de las ciencias naturales."
  },

  // --- Didáctica General de las Ciencias Experimentales ---
  {
    name: "Enseñanza de las Ciencias",
    category: "Ciencias",
    issns: ["0212-4521", "2174-6486"],
    scope: "Referente iberoamericano en didáctica e investigación de las ciencias experimentales."
  },
  {
    name: "Revista Eureka sobre Enseñanza y Divulgación de las Ciencias",
    category: "Ciencias",
    issns: ["1697-011X"],
    scope: "Propuestas de aula, historia de la ciencia y didáctica experimental."
  },
  {
    name: "Didáctica de las Ciencias Experimentales y Sociales",
    category: "Ciencias",
    issns: ["0214-4379", "2255-3835"],
    scope: "Enseñanza de las ciencias y ciencias sociales en la formación docente."
  },
  {
    name: "REEC: Revista Electrónica de Enseñanza de las Ciencias",
    category: "Ciencias",
    issns: ["1579-1513"],
    scope: "Investigación didáctica sobre aprendizaje conceptual y experimental."
  },
  {
    name: "Ciències",
    category: "Ciencias",
    issns: ["1699-6712"],
    scope: "Revista del profesorado de ciencias de Primaria y Secundaria."
  },
  {
    name: "Ciência & Educação (Bauru)",
    category: "Ciencias",
    issns: ["1516-7313", "1980-850X"],
    scope: "Enseñanza de las ciencias naturales y formación pedagógica."
  },
  {
    name: "International Journal of Science Education",
    category: "Ciencias",
    issns: ["0950-0693", "1464-5289"],
    scope: "Investigación de vanguardia internacional en didáctica de las ciencias."
  },
  {
    name: "Journal of Research in Science Teaching",
    category: "Ciencias",
    issns: ["0022-4308", "1098-2736"],
    scope: "Órgano oficial de NARST, referente global en educación científica."
  },
  {
    name: "Science Education",
    category: "Ciencias",
    issns: ["0036-8326", "0097-0352", "1098-237X", "2377-0147"],
    scope: "Teoría, políticas, aprendizaje y práctica en ciencias naturales."
  },
  {
    name: "Studies in Science Education",
    category: "Ciencias",
    issns: ["0305-7267", "1940-8412"],
    scope: "Revisiones críticas y análisis sistemáticos en educación científica."
  },
  {
    name: "Research in Science Education",
    category: "Ciencias",
    issns: ["0157-244X", "1573-1898"],
    scope: "Revista internacional de ASERA sobre investigación en enseñanza de ciencias."
  },
  {
    name: "The Science Teacher",
    category: "Ciencias",
    issns: ["0036-8555", "1943-4871"],
    scope: "Publicación de NSTA con actividades prácticas para secundaria."
  }
];

export const ALL_ISSNS = Array.from(
  new Set(JOURNALS.flatMap(j => j.issns))
).join('|');
