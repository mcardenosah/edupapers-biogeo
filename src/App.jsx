import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, ArrowLeft, ExternalLink, Unlock, FileText, CheckCircle2, 
  Copy, Filter, AlertCircle, Calendar, Clock, List, Leaf, Mountain, Dna, Loader2, 
  Languages, Tag, X, Save, Info, Globe, HelpCircle, Award, Download, ArrowUpDown, ChevronDown,
  Trophy, Sparkles, Flame
} from 'lucide-react';
import { JOURNALS, ALL_ISSNS } from './config/journals';

const CORREO_ADMIN = "tu_correo@ejemplo.com"; 

const reconstruirAbstract = (invertedIndex) => {
  if (!invertedIndex) return "Resumen original no disponible en la base de datos abierta.";
  const words = [];
  try {
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      positions.forEach(pos => words[pos] = word);
    });
    return words.filter(Boolean).join(" ");
  } catch (e) {
    return "Error al procesar el resumen original.";
  }
};

const calcularDiasTranscurridos = (fechaPublicacion) => {
  if (!fechaPublicacion) return 999;
  try {
    const hoy = new Date();
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const [year, month, day] = fechaPublicacion.split('-');
    const fechaPub = new Date(year, month - 1, day);
    const diferenciaTiempo = fechaHoy.getTime() - fechaPub.getTime();
    return Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
  } catch (e) {
    return 999;
  }
};

const HighlightText = ({ text, query }) => {
  if (!query || !query.trim() || !text) return <>{text}</>;
  const lowerQuery = query.trim().toLowerCase();
  const strText = String(text);
  if (!strText.toLowerCase().includes(lowerQuery)) return <>{text}</>;

  const parts = [];
  let remaining = strText;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(lowerQuery);
    if (idx === -1) {
      parts.push(remaining);
      break;
    }
    if (idx > 0) {
      parts.push(remaining.substring(0, idx));
    }
    const matchText = remaining.substring(idx, idx + lowerQuery.length);
    parts.push(
      <mark key={keyIndex++} className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded">
        {matchText}
      </mark>
    );
    remaining = remaining.substring(idx + lowerQuery.length);
  }
  return <>{parts}</>;
};

const BIOLOGIA_KEYWORDS = [
  '\\bbiology\\b', '\\bbiología\\b', '\\becology\\b', '\\becología\\b', 
  '\\bevolution\\b', '\\bevolución\\b', '\\bgenetics\\b', '\\bgenética\\b', 
  '\\bbotany\\b', '\\bbotánica\\b', '\\bzoology\\b', '\\bzoología\\b', 
  'ecosystem', 'ecosistema', 'biodiversity', 'biodiversidad', 'climate change', 
  'cambio climático', 'sustainability', 'sostenibilidad', 'biochemistry', 'bioquímica', 
  'microbiology', 'microbiología', 'cell biology', 'biología celular', 'physiology', 
  'fisiología', 'organism', 'nature-based', 'living organisms'
];

const GEOLOGIA_KEYWORDS = [
  '\\bgeology\\b', '\\bgeología\\b', 'earth science', 'ciencias de la tierra', 
  'geoscience', 'geociencias', 'tectonics', 'tectónica', 'plate tectonics', 
  'paleontology', 'paleontología', 'mineral', 'minerales', 'rock', 'rocas', 
  'volcano', 'volcanes', 'volcanism', 'earthquake', 'terremoto', 'sismicidad', 
  'seismic', 'geosphere', 'geosfera', 'fossil', 'fósiles', 'hydrogeology', 
  'stratigraphy', 'estratigrafía', 'sediment', 'geomorfología', 'geomorphology'
];

const QUICK_SEARCH_TOPICS = [
  { label: 'Evolución y Selección Natural', query: 'evolution natural selection' },
  { label: 'Tectónica de Placas y Geología', query: 'plate tectonics earth science' },
  { label: 'Genética y Errores Conceptuales', query: 'genetics misconceptions' },
  { label: 'Ecología y Biodiversidad', query: 'biodiversity ecosystem ecology' },
  { label: 'Educación Ambiental y Clima', query: 'climate change environmental education' },
  { label: 'Indagación y Prácticas', query: 'inquiry science laboratory' },
  { label: 'Biología Celular y Bioquímica', query: 'cell biology biochemistry' }
];

export default function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales de Información
  const [showAppInfo, setShowAppInfo] = useState(false);
  const [showFilterInfo, setShowFilterInfo] = useState(false);
  
  // Estados de Filtros de Novedades
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJournal, setSelectedJournal] = useState("Todas las revistas");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [onlyOA, setOnlyOA] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Ordenación y Paginación
  const [sortBy, setSortBy] = useState("date_desc");
  const [visibleCount, setVisibleCount] = useState(20);

  // Pestaña de Artículos Más Citados e Impacto
  const [impactArticles, setImpactArticles] = useState([]);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [impactError, setImpactError] = useState(null);
  const [impactSearchInput, setImpactSearchInput] = useState("");
  const [impactActiveQuery, setImpactActiveQuery] = useState("");
  const [impactSelectedJournal, setImpactSelectedJournal] = useState("Todas las revistas");
  const [impactLimit, setImpactLimit] = useState(50);
  const [hasFetchedImpactOnce, setHasFetchedImpactOnce] = useState(false);

  // Pestañas Personalizadas
  const [customTabs, setCustomTabs] = useState(() => {
    const saved = localStorage.getItem('eduradar_biogeo_custom_tabs');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [copied, setCopied] = useState(false);
  const [translateFeedback, setTranslateFeedback] = useState(null);
  const [viewMode, setViewMode] = useState("radar"); 

  // Carga inicial del radar de novedades
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const issnArray = ALL_ISSNS.split('|');
        const chunkSize = 40;
        const issnChunks = [];
        for (let i = 0; i < issnArray.length; i += chunkSize) {
          issnChunks.push(issnArray.slice(i, i + chunkSize).join('|'));
        }

        const fetchPromises = issnChunks.map(chunk => {
          const url = `https://api.openalex.org/works?filter=primary_location.source.issn:${chunk}&sort=publication_date:desc&per-page=200&mailto=${CORREO_ADMIN}`;
          return fetch(url, { cache: 'no-store' }).then(res => {
            if (!res.ok) throw new Error("Error API OpenAlex");
            return res.json();
          });
        });

        const resultsArray = await Promise.all(fetchPromises);
        const seenIds = new Set();
        let combined = [];

        resultsArray.forEach(data => {
          if (data?.results) {
            data.results.forEach(work => {
              if (!seenIds.has(work.id)) {
                seenIds.add(work.id);
                const pdfUrl = work.best_oa_location?.pdf_url || (work.open_access?.is_oa ? work.open_access?.oa_url : null) || null;
                combined.push({
                  id: work.id || Math.random().toString(),
                  title: work.title || "Título no disponible",
                  authors: work.authorships?.length > 0 
                    ? work.authorships.map(a => a.author?.display_name).filter(Boolean) 
                    : ["Autores desconocidos"],
                  journal: work.primary_location?.source?.display_name || "Revista Científica",
                  year: work.publication_year || "Año desconocido",
                  date: work.publication_date || "",
                  isOpenAccess: work.open_access?.is_oa || false,
                  pdfUrl: pdfUrl,
                  citedBy: work.cited_by_count || 0,
                  url: work.primary_location?.landing_page_url || work.doi || work.id || "#",
                  abstract: reconstruirAbstract(work.abstract_inverted_index),
                  tags: work.concepts ? work.concepts.slice(0, 5).map(c => c.display_name) : [],
                  diasTranscurridos: calcularDiasTranscurridos(work.publication_date)
                });
              }
            });
          }
        });

        combined.sort((a, b) => new Date(b.date) - new Date(a.date));
        setArticles(combined);
      } catch (err) {
        setError("Error de conexión. Verifica tu acceso a internet.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Función para buscar en el Explorador de Impacto / Más Citados
  const fetchImpactArticles = useCallback(async (query = "", journal = "Todas las revistas", limit = 50) => {
    setIsLoadingImpact(true);
    setImpactError(null);
    try {
      let targetIssns = ALL_ISSNS;
      if (journal !== "Todas las revistas") {
        const found = JOURNALS.find(j => j.name.toLowerCase() === journal.toLowerCase());
        if (found && found.issns.length) {
          targetIssns = found.issns.join('|');
        }
      }

      const searchQuery = query.trim() ? `&search=${encodeURIComponent(query.trim())}` : '';
      const url = `https://api.openalex.org/works?filter=primary_location.source.issn:${targetIssns}${searchQuery}&sort=cited_by_count:desc&per-page=${limit}&mailto=${CORREO_ADMIN}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al consultar artículos más citados.");
      const data = await res.json();

      const parsed = (data.results || []).map(work => {
        const pdfUrl = work.best_oa_location?.pdf_url || (work.open_access?.is_oa ? work.open_access?.oa_url : null) || null;
        return {
          id: work.id || Math.random().toString(),
          title: work.title || "Título no disponible",
          authors: work.authorships?.length > 0 
            ? work.authorships.map(a => a.author?.display_name).filter(Boolean) 
            : ["Autores desconocidos"],
          journal: work.primary_location?.source?.display_name || "Revista Científica",
          year: work.publication_year || "Año desconocido",
          date: work.publication_date || "",
          isOpenAccess: work.open_access?.is_oa || false,
          pdfUrl: pdfUrl,
          citedBy: work.cited_by_count || 0,
          url: work.primary_location?.landing_page_url || work.doi || work.id || "#",
          abstract: reconstruirAbstract(work.abstract_inverted_index),
          tags: work.concepts ? work.concepts.slice(0, 5).map(c => c.display_name) : [],
          diasTranscurridos: calcularDiasTranscurridos(work.publication_date)
        };
      });

      setImpactArticles(parsed);
      setHasFetchedImpactOnce(true);
    } catch (err) {
      setImpactError("No se pudieron cargar los artículos más citados. Comprueba tu conexión.");
    } finally {
      setIsLoadingImpact(false);
    }
  }, []);

  // Cargar impacto la primera vez que se selecciona la pestaña
  useEffect(() => {
    if (viewMode === 'impacto' && !hasFetchedImpactOnce) {
      fetchImpactArticles("", impactSelectedJournal, impactLimit);
    }
  }, [viewMode, hasFetchedImpactOnce, impactSelectedJournal, impactLimit, fetchImpactArticles]);

  const handleImpactSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setImpactActiveQuery(impactSearchInput);
    fetchImpactArticles(impactSearchInput, impactSelectedJournal, impactLimit);
  };

  const handleSelectQuickTopic = (topicQuery) => {
    setImpactSearchInput(topicQuery);
    setImpactActiveQuery(topicQuery);
    fetchImpactArticles(topicQuery, impactSelectedJournal, impactLimit);
  };

  const handleImpactJournalChange = (journal) => {
    setImpactSelectedJournal(journal);
    fetchImpactArticles(impactActiveQuery, journal, impactLimit);
  };

  const handleImpactLimitChange = (limit) => {
    setImpactLimit(limit);
    fetchImpactArticles(impactActiveQuery, impactSelectedJournal, limit);
  };

  // Reiniciar conteo visible cuando cambian filtros o vista
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, selectedJournal, selectedPeriod, selectedTags, onlyOA, sortBy, viewMode]);

  const popularTags = useMemo(() => {
    const counts = {};
    articles.forEach(a => a.tags.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(e => e[0]);
  }, [articles]);

  const availableJournals = useMemo(() => {
    const uniqueJournals = new Set(articles.map(article => article.journal));
    return ["Todas las revistas", ...Array.from(uniqueJournals).sort()];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let result = articles.filter(article => {
      const safeText = `${article.title} ${article.authors.join(' ')} ${article.abstract}`.toLowerCase();
      const matchesSearch = safeText.includes(searchTerm.toLowerCase());
      const matchesJournal = selectedJournal === "Todas las revistas" || article.journal === selectedJournal;
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => article.tags.includes(tag));
      const matchesOA = !onlyOA || article.isOpenAccess;

      let matchesPeriod = true;
      if (selectedPeriod === "30d") {
        matchesPeriod = article.diasTranscurridos <= 30;
      } else if (selectedPeriod === "2026") {
        matchesPeriod = String(article.year) === "2026";
      } else if (selectedPeriod === "2025") {
        matchesPeriod = String(article.year) === "2025";
      } else if (selectedPeriod === "older") {
        matchesPeriod = Number(article.year) <= 2024;
      }

      return matchesSearch && matchesJournal && matchesTags && matchesOA && matchesPeriod;
    });

    // Ordenación
    return result.sort((a, b) => {
      if (sortBy === "cited_desc") {
        return (b.citedBy || 0) - (a.citedBy || 0);
      } else if (sortBy === "journal_asc") {
        return (a.journal || "").localeCompare(b.journal || "");
      } else if (sortBy === "title_asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      // date_desc (por defecto)
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [searchTerm, selectedJournal, selectedPeriod, selectedTags, onlyOA, sortBy, articles]);

  const { hoy, semana } = useMemo(() => {
    const rHoy = [];
    const rSemana = [];
    filteredArticles.forEach(article => {
      if (article.diasTranscurridos <= 1) rHoy.push(article);
      else if (article.diasTranscurridos > 1 && article.diasTranscurridos <= 7) rSemana.push(article);
    });
    return { hoy: rHoy, semana: rSemana };
  }, [filteredArticles]);

  const articulosBiologia = useMemo(() => {
    return filteredArticles.filter(article => {
      const text = `${article.title} ${article.abstract} ${article.tags.join(' ')}`.toLowerCase();
      return BIOLOGIA_KEYWORDS.some(k => new RegExp(k, 'i').test(text));
    });
  }, [filteredArticles]);

  const articulosGeologia = useMemo(() => {
    return filteredArticles.filter(article => {
      const text = `${article.title} ${article.abstract} ${article.tags.join(' ')}`.toLowerCase();
      return GEOLOGIA_KEYWORDS.some(k => new RegExp(k, 'i').test(text));
    });
  }, [filteredArticles]);

  const handleSaveTab = () => {
    const name = window.prompt("Nombre para esta pestaña (ej. 'Genética y Herencia', 'Ecosistemas'):");
    if (!name) return;
    const newTab = {
      id: Date.now().toString(),
      name,
      searchTerm,
      selectedJournal,
      selectedPeriod,
      selectedTags,
      onlyOA,
      sortBy
    };
    const updated = [...customTabs, newTab];
    setCustomTabs(updated);
    localStorage.setItem('eduradar_biogeo_custom_tabs', JSON.stringify(updated));
    setViewMode(`custom_${newTab.id}`);
  };

  const deleteTab = (id) => {
    if(!window.confirm("¿Eliminar esta pestaña?")) return;
    const updated = customTabs.filter(t => t.id !== id);
    setCustomTabs(updated);
    localStorage.setItem('eduradar_biogeo_custom_tabs', JSON.stringify(updated));
    if (viewMode === `custom_${id}`) setViewMode("historico");
  };

  const applyCustomTabFilters = (tab) => {
    setSearchTerm(tab.searchTerm || "");
    setSelectedJournal(tab.selectedJournal || "Todas las revistas");
    setSelectedPeriod(tab.selectedPeriod || "all");
    setSelectedTags(tab.selectedTags || []);
    setOnlyOA(tab.onlyOA || false);
    if (tab.sortBy) setSortBy(tab.sortBy);
    setViewMode(`custom_${tab.id}`);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedJournal("Todas las revistas");
    setSelectedPeriod("all");
    setSelectedTags([]);
    setOnlyOA(false);
    setSortBy("date_desc");
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleExternalTranslate = (platform, text) => {
    if (!text || text.includes("no disponible")) return;
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); setTranslateFeedback(platform); setTimeout(() => setTranslateFeedback(null), 4000); } catch (err) {}
    document.body.removeChild(el);

    const url = platform === 'deepl' 
      ? `https://www.deepl.com/translator#en/es/${encodeURIComponent(text)}` 
      : `https://www.softcatala.org/traductor/`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyToMarkdown = (article) => {
    const today = new Date().toISOString().split('T')[0];
    const formattedTags = (article.tags || []).map(t => `  - ${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}`).join('\n');
    const safeTitle = (article.title || "").replace(/"/g, '\\"');
    const safeJournal = (article.journal || "").replace(/"/g, '\\"');

    const template = `---
tipo: lectura_cientifica
estado: pendiente
tags:
  - didactica_ciencias
  - didactica_biogeo
${formattedTags}
fecha: ${today}
revista: "${safeJournal}"
citas: ${article.citedBy}
archivo: "${article.url}"
---
# ${safeTitle}

📄 Documento Original
[Enlace a la fuente (${safeJournal})](${article.url})
${article.pdfUrl ? `[Descargar PDF directo](${article.pdfUrl})` : ''}

🧠 Mis Notas y Reflexiones Pedagógicas
(Espacio libre para anotar aplicaciones de aula o reflexiones teóricas)

Idea principal:

🤖 Resumen Original
> ${article.abstract}
`;
    const el = document.createElement("textarea");
    el.value = template;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ArticleCard = ({ article, highlightQuery = searchTerm }) => (
    <div 
      onClick={() => { setSelectedArticle(article); window.scrollTo(0,0); }} 
      className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
    >
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-2 flex-wrap text-xs font-semibold text-slate-500 uppercase">
          <span className="text-emerald-700 font-bold">{article.journal}</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span>{article.date || article.year}</span>
          
          {/* Métrica de Citas */}
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="Citas registradas en OpenAlex">
            <Trophy size={12} className="text-amber-600"/> {article.citedBy} {article.citedBy === 1 ? 'cita' : 'citas'}
          </span>

          {/* Acceso Abierto & Botón PDF Directo */}
          {article.isOpenAccess && (
            <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              <Unlock size={12} className="text-emerald-600"/> Open Access
            </span>
          )}

          {article.pdfUrl && (
            <a 
              href={article.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={e => e.stopPropagation()} 
              className="flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2 py-0.5 rounded shadow-sm transition-colors"
              title="Descargar PDF directo"
            >
              <Download size={12}/> PDF
            </a>
          )}
        </div>

        <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight mb-2">
          <HighlightText text={article.title} query={highlightQuery} />
        </h2>
        <p className="text-sm text-slate-600 truncate max-w-2xl font-medium mb-3">
          <HighlightText text={article.authors.join(', ')} query={highlightQuery} />
        </p>
        <div className="flex flex-wrap gap-1.5">
          {article.tags.map(t => (
            <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const activeFiltersCount = selectedTags.length + (onlyOA ? 1 : 0) + (selectedJournal !== "Todas las revistas" ? 1 : 0) + (selectedPeriod !== "all" ? 1 : 0) + (searchTerm ? 1 : 0);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans flex flex-col">
        <div className="max-w-3xl mx-auto flex-grow w-full">
          <button 
            onClick={() => { setSelectedArticle(null); window.scrollTo(0,0); }} 
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 mb-6 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} /> Volver al listado
          </button>
          <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4 flex-wrap text-xs font-bold uppercase">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-md">{selectedArticle.journal}</span>
                <span className="text-slate-400 font-medium">{selectedArticle.date || selectedArticle.year}</span>
                <span className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md font-bold">
                  <Trophy size={14} className="text-amber-600"/> {selectedArticle.citedBy} {selectedArticle.citedBy === 1 ? 'cita' : 'citas'}
                </span>
                {selectedArticle.isOpenAccess && (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-200">
                    <Unlock size={14}/> Open Access
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                <HighlightText text={selectedArticle.title} query={viewMode === 'impacto' ? impactActiveQuery : searchTerm} />
              </h1>
              <p className="text-slate-600 font-semibold text-lg">{selectedArticle.authors.join(', ')}</p>
            </div>
            
            <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-200 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={18} /> Resumen Original
                </h3>
                {!selectedArticle.abstract.includes("no disponible") && (
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm gap-1">
                    <button onClick={() => handleExternalTranslate('deepl', selectedArticle.abstract)} className="px-3 py-2 text-xs font-bold rounded-md text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2 cursor-pointer">
                      {translateFeedback === 'deepl' ? <CheckCircle2 size={14} className="text-emerald-600"/> : <Languages size={14} />} DeepL (ES)
                    </button>
                    <button onClick={() => handleExternalTranslate('softcatala', selectedArticle.abstract)} className="px-3 py-2 text-xs font-bold rounded-md text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-2 cursor-pointer">
                      {translateFeedback === 'softcatala' ? <CheckCircle2 size={14} className="text-emerald-600"/> : <Languages size={14} />} Softcatalà (VA)
                    </button>
                  </div>
                )}
              </div>
              <div className="text-slate-700 leading-relaxed text-lg font-normal">
                <p className="whitespace-pre-wrap">
                  <HighlightText text={selectedArticle.abstract} query={viewMode === 'impacto' ? impactActiveQuery : searchTerm} />
                </p>
                {translateFeedback && (
                  <div className="absolute top-4 right-8 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xl animate-bounce">
                    ¡Copiado! Pega el texto (Ctrl+V)
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-white flex flex-col sm:flex-row gap-3 justify-between items-center flex-wrap">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {selectedArticle.pdfUrl && (
                  <a href={selectedArticle.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md">
                    <Download size={18} /> Descargar PDF
                  </a>
                )}
                {selectedArticle.url !== "#" && (
                  <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md">
                    Ir a la fuente <ExternalLink size={18} />
                  </a>
                )}
              </div>
              <button onClick={() => handleCopyToMarkdown(selectedArticle)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold border transition-all cursor-pointer ${copied ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}>
                {copied ? <><CheckCircle2 size={18} /> ¡Copiado!</> : <><Copy size={18} /> Exportar a Obsidian</>}
              </button>
            </div>
          </article>
        </div>
        
        <footer className="mt-8 py-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
            Impulsado por la API abierta de 
            <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 font-bold">
              OpenAlex <ExternalLink size={12} />
            </a>
          </p>
        </footer>
      </div>
    );
  }

  // Componente de control de Ordenación y Contador para Novedades
  const ToolbarHeader = ({ count }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-200">
      <p className="text-sm font-bold text-slate-600">
        Mostrando <span className="text-emerald-800 font-extrabold">{Math.min(visibleCount, count)}</span> de <span className="text-slate-900">{count}</span> publicaciones
      </p>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <ArrowUpDown size={14} /> Ordenar:
        </label>
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
        >
          <option value="date_desc">Más recientes primero</option>
          <option value="cited_desc">Más citados (Impacto)</option>
          <option value="journal_asc">Revista (A-Z)</option>
          <option value="title_asc">Título (A-Z)</option>
        </select>
      </div>
    </div>
  );

  // Botón de Cargar Más
  const LoadMoreButton = ({ total }) => {
    if (total <= visibleCount) return null;
    return (
      <div className="flex justify-center pt-8 pb-4">
        <button 
          onClick={() => setVisibleCount(prev => prev + 20)}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
        >
          <ChevronDown size={18} /> Cargar más publicaciones (quedan {total - visibleCount})
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-emerald-700 p-2.5 rounded-xl text-white shadow-md flex items-center justify-center">
                <Dna size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  EduPapers BioGeo
                  <button 
                    onClick={() => setShowAppInfo(true)}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                    title="Información sobre la aplicación y revistas"
                  >
                    <Info size={18} />
                  </button>
                </h1>
                <p className="text-xs text-slate-500 font-medium">Radar de Didáctica de la Biología y la Geología</p>
              </div>
            </div>
            
            {/* Buscador para vistas de Novedades */}
            {viewMode !== 'impacto' && (
              <div className="flex w-full md:w-auto gap-2">
                <div className="relative flex-grow sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-8 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                    placeholder="Buscar título o autores..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    disabled={isLoading} 
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors cursor-pointer ${showFilters || activeFiltersCount > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFiltersCount > 0 && <span className="bg-emerald-700 text-white text-xs px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>}
                </button>
              </div>
            )}
          </div>

          {/* Panel de Filtros Avanzados (para vistas de novedades) */}
          {showFilters && viewMode !== 'impacto' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 shadow-inner animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Filtro Revista */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Revista</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer" 
                    value={selectedJournal} 
                    onChange={(e) => setSelectedJournal(e.target.value)} 
                  >
                    {availableJournals.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                {/* Filtro Rango Temporal */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Periodo / Año</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer" 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)} 
                  >
                    <option value="all">Cualquier fecha</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="2026">Año 2026</option>
                    <option value="2025">Año 2025</option>
                    <option value="older">2024 o anteriores</option>
                  </select>
                </div>

                {/* Checkbox Open Access */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors h-[38px] w-full">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      checked={onlyOA}
                      onChange={(e) => setOnlyOA(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Unlock size={14} className="text-emerald-600"/> Solo Open Access</span>
                  </label>
                </div>
              </div>

              {/* Conceptos Clave */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Tag size={14}/> Conceptos Clave (Auto-detectados)</label>
                  <button onClick={() => setShowFilterInfo(true)} className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-1 rounded-full transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer">
                    <HelpCircle size={14} /> ¿Qué es esto?
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${selectedTags.includes(tag) ? 'bg-emerald-700 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button onClick={resetFilters} className="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer">
                  Limpiar filtros
                </button>
                <button 
                  onClick={handleSaveTab}
                  disabled={activeFiltersCount === 0}
                  className="flex items-center gap-2 text-sm font-bold px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Guarda esta combinación de filtros como una pestaña nueva"
                >
                  <Save size={16} /> Guardar como Pestaña
                </button>
              </div>
            </div>
          )}

          {/* Navegación de Pestañas */}
          {!isLoading && !error && (
            <div className="flex gap-4 border-b border-slate-200 overflow-x-auto text-sm font-bold pt-2 no-scrollbar">
              <button onClick={() => {resetFilters(); setViewMode('radar');}} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${viewMode === 'radar' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Clock size={16}/> Radar
              </button>
              <button onClick={() => {resetFilters(); setViewMode('historico');}} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${viewMode === 'historico' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <List size={16}/> Todo ({articles.length})
              </button>
              <button onClick={() => {resetFilters(); setViewMode('biologia');}} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${viewMode === 'biologia' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Leaf size={16}/> Biología ({articulosBiologia.length})
              </button>
              <button onClick={() => {resetFilters(); setViewMode('geologia');}} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${viewMode === 'geologia' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Mountain size={16}/> Geología ({articulosGeologia.length})
              </button>

              {/* NUEVA PESTAÑA: MÁS CITADOS / CLÁSICOS */}
              <button onClick={() => setViewMode('impacto')} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${viewMode === 'impacto' ? 'border-amber-500 text-amber-900 bg-amber-50/50 px-2.5 rounded-t-lg' : 'border-transparent text-amber-700 hover:text-amber-900'}`}>
                <Trophy size={16} className="text-amber-500"/> Más Citados
              </button>
              
              {/* Pestañas Personalizadas del Usuario */}
              {customTabs.map(tab => (
                <div key={tab.id} className="relative group flex items-center">
                  <button 
                    onClick={() => applyCustomTabFilters(tab)} 
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap pr-6 cursor-pointer ${viewMode === `custom_${tab.id}` ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    <Filter size={14}/> {tab.name}
                  </button>
                  <button 
                    onClick={(e) => {e.stopPropagation(); deleteTab(tab.id);}}
                    className="absolute right-0 top-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Eliminar pestaña"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 text-slate-500 text-center">
            <Loader2 size={40} className="animate-spin mb-4 text-emerald-700" />
            <p className="font-bold text-lg">Actualizando el radar BioGeo...</p>
            <p className="text-sm mt-2 text-slate-400">Consultando publicaciones recientes en las 24 revistas indexadas.</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-4"><AlertCircle/><p className="font-medium">{error}</p></div>
        ) : viewMode === 'impacto' ? (
          /* ========================================================= */
          /* PESTAÑA DINÁMICA: MÁS CITADOS / EXPLORADOR DE IMPACTO     */
          /* ========================================================= */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500 text-white p-2 rounded-xl shadow">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Explorador de Clásicos e Impacto</h2>
                  <p className="text-xs text-slate-600 font-medium">Busca las investigaciones con mayor número de citas sobre cualquier temática en las 24 revistas</p>
                </div>
              </div>

              {/* Formulario de Búsqueda Temática */}
              <form onSubmit={handleImpactSearchSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={impactSearchInput}
                    onChange={e => setImpactSearchInput(e.target.value)}
                    placeholder="Buscar tema: ej. fotosíntesis, evolución, tectónica, clima, indagación..."
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
                  />
                  {impactSearchInput && (
                    <button 
                      type="button" 
                      onClick={() => { setImpactSearchInput(""); setImpactActiveQuery(""); fetchImpactArticles("", impactSelectedJournal, impactLimit); }} 
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={isLoadingImpact}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingImpact ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Buscar Más Citados
                </button>
              </form>

              {/* Controles de Revista y Cantidad */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-amber-200/60 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-600">Revista:</span>
                  <select 
                    value={impactSelectedJournal} 
                    onChange={e => handleImpactJournalChange(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Todas las revistas">Todas las 24 revistas</option>
                    {JOURNALS.map(j => <option key={j.name} value={j.name}>{j.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">Mostrar:</span>
                  {[25, 50, 100].map(lim => (
                    <button
                      key={lim}
                      onClick={() => handleImpactLimitChange(lim)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${impactLimit === lim ? 'bg-amber-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'}`}
                    >
                      Top {lim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chips Temáticos Rápidos */}
              <div className="mt-4 pt-3 border-t border-amber-200/60">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-600"/> Temas populares sugeridos (1 clic):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SEARCH_TOPICS.map(item => (
                    <button
                      key={item.label}
                      onClick={() => handleSelectQuickTopic(item.query)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${impactActiveQuery === item.query ? 'bg-amber-700 text-white shadow-sm' : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200 hover:border-amber-400'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Listado de Artículos Más Citados */}
            {isLoadingImpact ? (
              <div className="flex flex-col items-center py-16 text-slate-500 text-center">
                <Loader2 size={36} className="animate-spin mb-3 text-amber-600" />
                <p className="font-bold text-base">Consultando publicaciones más citadas en OpenAlex...</p>
                <p className="text-xs text-slate-400">Ordenando por recuento histórico de citas.</p>
              </div>
            ) : impactError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-4"><AlertCircle/><p className="font-medium">{impactError}</p></div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    {impactActiveQuery ? (
                      <>Más citados sobre <span className="text-amber-800 underline font-extrabold">"{impactActiveQuery}"</span> ({impactArticles.length})</>
                    ) : (
                      <>Top {impactArticles.length} Artículos Más Citados de la Historia</>
                    )}
                  </h3>
                  {impactSelectedJournal !== "Todas las revistas" && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {impactSelectedJournal}
                    </span>
                  )}
                </div>

                {impactArticles.length > 0 ? (
                  <div className="space-y-4">
                    {impactArticles.map(a => <ArticleCard key={a.id} article={a} highlightQuery={impactActiveQuery} />)}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white border border-dashed rounded-xl text-slate-400 font-medium italic">
                    No se encontraron artículos con esa combinación de búsqueda. Prueba con términos más generales (ej. "biology", "geology", "genetics").
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Si hay filtros activos Y NO estamos en una pestaña base, mostramos los resultados filtrados globalmente */}
            {(activeFiltersCount > 0 && !['radar', 'biologia', 'geologia'].includes(viewMode)) || viewMode.startsWith('custom_') ? (
              <div className="space-y-4">
                <ToolbarHeader count={filteredArticles.length} />
                {filteredArticles.length > 0 ? (
                  <>
                    {filteredArticles.slice(0, visibleCount).map(a => <ArticleCard key={a.id} article={a}/>)}
                    <LoadMoreButton total={filteredArticles.length} />
                  </>
                ) : (
                  <div className="p-12 text-center bg-white border border-dashed rounded-xl text-slate-400 font-medium italic">
                    No se encontraron publicaciones con esta combinación de filtros.
                  </div>
                )}
              </div>
            ) : viewMode === 'radar' ? (
              <div className="space-y-10">
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><Calendar className="text-emerald-700" size={20}/> Novedades de Hoy ({hoy.length})</h2>
                  {hoy.length ? hoy.map(a => <ArticleCard key={a.id} article={a}/>) : <div className="p-10 text-center bg-white border border-dashed rounded-xl text-slate-400 font-medium italic">Sin publicaciones registradas en las últimas 24h.</div>}
                </section>
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><Clock className="text-slate-500" size={20}/> Esta Semana ({semana.length})</h2>
                  {semana.length ? semana.map(a => <ArticleCard key={a.id} article={a}/>) : <div className="p-10 text-center bg-white border border-dashed rounded-xl text-slate-400 font-medium italic">Sin publicaciones registradas en los últimos 7 días.</div>}
                </section>
              </div>
            ) : viewMode === 'biologia' ? (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl flex items-start gap-4 mb-2 shadow-sm">
                  <Leaf className="text-teal-700 mt-1" />
                  <div>
                    <h2 className="font-bold text-teal-900 text-lg">Enfoque: Biología y Ciencias de la Vida</h2>
                    <p className="text-sm text-teal-800 font-medium">Genética, ecología, evolución, botánica, zoología y educación para la sostenibilidad.</p>
                  </div>
                </div>
                <ToolbarHeader count={articulosBiologia.length} />
                {articulosBiologia.length > 0 ? (
                  <>
                    {articulosBiologia.slice(0, visibleCount).map(a => <ArticleCard key={a.id} article={a}/>)}
                    <LoadMoreButton total={articulosBiologia.length} />
                  </>
                ) : (
                  <div className="p-10 text-center bg-white border border-dashed rounded-xl text-slate-400 font-medium italic">
                    No se han detectado artículos con este enfoque en el periodo seleccionado.
                  </div>
                )}
              </div>
            ) : viewMode === 'geologia' ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex items-start gap-4 mb-2 shadow-sm">
                  <Mountain className="text-amber-700 mt-1" />
                  <div>
                    <h2 className="font-bold text-amber-900 text-lg">Enfoque: Geología y Ciencias de la Tierra</h2>
                    <p className="text-sm text-amber-800 font-medium">Tectónica, paleontología, mineralogía, procesos geológicos y geociencias.</p>
                  </div>
                </div>
                <ToolbarHeader count={articulosGeologia.length} />
                {articulosGeologia.length > 0 ? (
                  <>
                    {articulosGeologia.slice(0, visibleCount).map(a => <ArticleCard key={a.id} article={a}/>)}
                    <LoadMoreButton total={articulosGeologia.length} />
                  </>
                ) : (
                  <div className="p-10 text-center bg-white border border-dashed rounded-xl text-slate-400 font-medium italic">
                    No se han detectado artículos con este enfoque en el periodo seleccionado.
                  </div>
                )}
              </div>
            ) : viewMode === 'historico' ? (
              <div className="space-y-4">
                <ToolbarHeader count={filteredArticles.length} />
                {filteredArticles.slice(0, visibleCount).map(a => <ArticleCard key={a.id} article={a}/>)}
                <LoadMoreButton total={filteredArticles.length} />
              </div>
            ) : null}
          </div>
        )}
      </main>

      <footer className="mt-8 py-6 border-t border-slate-200 text-center flex-shrink-0">
        <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
          Impulsado por la API abierta de 
          <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 font-bold">
            OpenAlex <ExternalLink size={12} />
          </a>
        </p>
      </footer>

      {/* MODAL 1: INFORMACIÓN GENERAL DE LA APLICACIÓN */}
      {showAppInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAppInfo(false)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-800 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="w-6 h-6" /> Estado del Radar BioGeo</h2>
              <button onClick={() => setShowAppInfo(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <p className="text-slate-600 leading-relaxed text-base">
                <strong>EduPapers BioGeo</strong> es un radar de vigilancia científica y pedagógica especializado en <strong>Didáctica de la Biología y la Geología</strong>. 
                Monitoriza en tiempo real <span className="font-bold text-emerald-700">{JOURNALS.length} revistas científicas de referencia</span> a través de la API abierta de OpenAlex.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Leaf size={16} className="text-emerald-700"/> 
                  Revistas indexadas ({JOURNALS.length})
                </h4>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                  {['Biología', 'Geología', 'Medio Ambiente', 'Ciencias'].map(cat => (
                    <div key={cat}>
                      <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">{cat}</h5>
                      <ul className="text-sm text-slate-700 space-y-1.5 pl-2 border-l-2 border-emerald-200">
                        {JOURNALS.filter(j => j.category === cat).map(rev => (
                          <li key={rev.name} className="flex items-start justify-between gap-2">
                            <span className="font-medium">{rev.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{rev.issns[0]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AYUDA DEL SISTEMA DE FILTROS */}
      {showFilterInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFilterInfo(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2"><Filter size={24}/> Cómo funcionan los filtros</h2>
              <button onClick={() => setShowFilterInfo(false)} className="p-1 hover:bg-emerald-200 text-emerald-900 rounded-full transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Trophy className="text-amber-500" size={18}/> Pestaña "Más Citados"</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Consulta directamente los clásicos históricos más influyentes de nuestras 24 revistas. Puedes buscar cualquier término temático (ej. "evolución", "tectónica") para ver los estudios más referenciados de todos los tiempos sobre ese asunto.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Tag className="text-emerald-700" size={18}/> Conceptos Clave y Resaltado</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  OpenAlex clasifica automáticamente el <i>abstract</i> y título de cada investigación mediante modelos semánticos conectados a ontologías científicas globales.
                  <br/><br/>
                  Además, al escribir cualquier término en el buscador, las palabras encontradas se resaltarán automáticamente en los títulos y resúmenes.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Save className="text-slate-600" size={18}/> Pestañas Guardadas</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Al hacer clic en "Guardar como Pestaña", tu navegador memoriza tu combinación exacta de términos, revistas y etiquetas para que puedas consultarla siempre que abras el radar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
