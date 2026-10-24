/* VIDEOS DE CLASES GRABADAS (YouTube), por semestre.
 Para agregar uno: copia una línea { ... } y cambia materia, docente y url. */
const VIDEOS = {
  2: [
    { materia: "Química Inorgánica", docente: "Pedraza Orlando", url: "https://youtube.com/playlist?list=PLlUk6MV4mU3YW8M5jZKWvKs3pKyKyyrf0" },
    { materia: "Química Inorgánica", docente: "Barbeito Juan", url: "https://youtube.com/playlist?list=PLupkxOOMiGczx8aTu9y55AFMD94SlzZBa" },
  ],
  3: [
    { materia: "Físicoquimica", docente: "Colanzi Carlos", url: "https://youtube.com/playlist?list=PLupkxOOMiGcw1aJ7O_qm26x9SHWsRH9Cg" },
    { materia: "Química Orgánica II", docente: "Casal Yamile", url: "https://youtube.com/playlist?list=PLupkxOOMiGcyYnEoBBrUlglmnDU7UsHlU" },
    { materia: "Química Orgánica II", docente: "Tejerina Julio", url: "https://youtube.com/playlist?list=PLupkxOOMiGcxgMBF4mgux74EE9mnJDKIu" },
    { materia: "Química Analítica", docente: "De Los Ríos Efraín", url: "https://youtube.com/playlist?list=PLxp4I9zCcH4nQJREkrRwdlLabkei2pEW3" },
    { materia: "Química Analítica", docente: "Barbeito Juan", url: "https://youtube.com/playlist?list=PLupkxOOMiGczZ7wk6b-wZxfJKyKdy_4uo" },
  ],
  4: [
    { materia: "Procesos de Tratamiento de Agua", docente: "Pedraza Orlando", url: "https://youtube.com/playlist?list=PLFwojyo5s7rj9lSuRsxnUTrGN_vNgnxHS" },
    { materia: "Microbiología Industrial", docente: "Pedraza Orlando", url: "https://youtube.com/playlist?list=PLFwojyo5s7riI2EEf3-BkxMnRnEtfef8T" },
    { materia: "Metodología de la Investigación Aplicada a la Ingeniería de Control de Procesos", docente: "Soria Ortiz Freddy", url: "https://youtube.com/playlist?list=PLgLVduxobHYB2OmrH6ERt42EuMbxdZQG3" },
    { materia: "Cálculo Numérico", docente: "López Leonardo", url: "https://youtube.com/playlist?list=PL80KYGCJcO4l4OqtLxF3c6pMco41d_hy4" },
  ],
  5: [
    { materia: "Termodinámica", docente: "Rojas Morón Vismar Gonzalo", url: "https://youtube.com/playlist?list=PLgLVduxobHYBCelAcDy7KVuUwjL5Nblr5" },
    { materia: "Química Analítica Instrumental", docente: "Chávez Rivero Oddin", url: "https://youtube.com/playlist?list=PL80KYGCJcO4lXsHK_cpfWZW4-IhQq0Y1d" },
    { materia: "Química Analítica Aplicada", docente: "Abarca Sota Nancy", url: "https://youtube.com/playlist?list=PL80KYGCJcO4nHJpuwbQIM1DYoF1uzvytj" },
    { materia: "Control de Calidad", docente: "Paniagua Saucedo Jose Ernesto", url: "https://youtube.com/playlist?list=PLFwojyo5s7rgMyOvbA36j-aBI2728BPGB" },
  ],
  6: [
    { materia: "Procesos Azucareros", docente: "Roca Reyes Miguel Angel", url: "https://youtube.com/playlist?list=PLFwojyo5s7rgthka4pxAhJWhvJ0HI13Bf" },
    { materia: "Instrumentación Industrial I", docente: "Piérola Bejarano Roy Pastor", url: "https://youtube.com/playlist?list=PLFwojyo5s7riRMsZff9WgWwcOvVHe9vsk" },
    { materia: "Gestión Ambiental en la Industria", docente: "Yabeta Sánchez Walter", url: "https://youtube.com/playlist?list=PLgLVduxobHYCERbssPgK1RAEbEDpwO83g" },
    { materia: "Higiene y Seguridad Industrial", docente: "Capobianco Céspedes Andrés Efraín", url: "https://youtube.com/playlist?list=PLFwojyo5s7rgn7NF18loognBcPsN5aWv3" },
  ],
  7: [
    { materia: "Sistemas Analógicos y Digitales", docente: "Carvajal Cordero Marcio", url: "https://youtube.com/playlist?list=PL80KYGCJcO4mz0y5Jmv5QfU4-e4PBdefC" },
    { materia: "Análisis de Sistema de Control", docente: "Piérola Bejarano Roy Pastor", url: "https://youtube.com/playlist?list=PLbPNpPXVGMZfsPj6Lh17-sdQZ7N2UO3HV" },
    { materia: "Principios de Economía Industrial", docente: "Soria Ortiz Freddy", url: "https://youtube.com/playlist?list=PLFwojyo5s7rj7xtuRwoFJYb9u0dUTOh8G" },
  ],
  8: [
    { materia: "Controladores Lógicos Programables", docente: "Mendoza Ayaviri Ronald Javier", url: "https://youtube.com/playlist?list=PLFwojyo5s7rgK3L5ztGWKw3ymwRp00l1N" },
  ],
  9: [
    { materia: "Procesos de Fabricación de Sustancias Químicas", docente: "Chávez Rivero Oddin", url: "https://youtube.com/playlist?list=PLFwojyo5s7rhlPamipo257V-D7kqUyd0i" },
    { materia: "Sistemas Scada", docente: "Mendoza Ayaviri Ronald Javier", url: "https://youtube.com/playlist?list=PL80KYGCJcO4kjxgju4L0AF36OawByHw_t" },
  ],
};
