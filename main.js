// main.js
const { spawn } = require("child_process");

// Obtenemos los argumentos
const searchTerm = process.argv[2];
const countryCode = process.argv[3];
const pageNumber = process.argv[4];

// Función para ejecutar scripts de Node en serie
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const processSpawn = spawn("node", [scriptPath, ...args]);

    processSpawn.stdout.on("data", (data) => {
      console.log(`${scriptPath}: ${data}`);
    });

    processSpawn.stderr.on("data", (data) => {
      console.error(`${scriptPath} error: ${data}`);
    });

    processSpawn.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${scriptPath} salió con código ${code}`));
      } else {
        resolve();
      }
    });
  });
}

(async () => {
  try {
    // 1) Ejecutar serper.js con los 3 argumentos
    await runScript("serper.js", [searchTerm, countryCode, pageNumber]);
    console.log("=== Finalizó serper.js correctamente ===");

    // 2) Ejecutar playwright.js (sin argumentos)
    await runScript("playwright.js");
    console.log("=== Finalizó playwright.js correctamente ===");

    // 3) Ejecutar gemini.js (esta vez con los 3 argumentos)
    await runScript("gemini.js", [searchTerm, countryCode, pageNumber]);
    console.log("=== Finalizó gemini.js correctamente ===");

    console.log("=== Proceso finalizado sin generación de XLSX en main.js ===");
  } catch (error) {
    console.error("Error en la ejecución:", error.message);
  }
})();

