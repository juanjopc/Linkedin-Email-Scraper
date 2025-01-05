require("dotenv").config();  // <-- Agregado para leer las variables de entorno

const fs = require("fs");
const { chromium } = require("playwright");

// Ahora las rutas se leen desde .env
const userDataDir = process.env.USER_DATA_DIR;
const executablePath = process.env.CHROME_EXE;

// Archivo JSON con la lista de URLs
const inputUrlsFile = "serper.json";

// Archivo donde guardaremos los datos finales
const outputProfilesFile = "playwright.json";

(async () => {
  try {
    console.log("\n=== LEYENDO LISTA DE URLs Y EXTRAER CONTACT INFO ===");

    // 1) Leemos el JSON con las URLs
    const rawData = fs.readFileSync(inputUrlsFile, "utf-8");
    let profileUrls = JSON.parse(rawData);

    // Reemplazamos "//pe." por "//" en las URLs
    profileUrls = profileUrls.map(url => {
      // url = url.replace("//pe.", "//");
      url = url.replace(/\/\/[a-z]{2}\./, '//');

      // Si la URL contiene "https://linkedin.com/in/", extraemos hasta el primer "/" o "?" después de ese prefijo
      const match = url.match(/https:\/\/linkedin\.com\/in\/([^/?]+)/);
      if (match) {
        return `https://linkedin.com/in/${match[1]}`;
      }

      return url; // Si no coincide con el patrón, devolvemos la URL sin cambios
    });

    let extractedProfiles = [];
    let profileCounter = 0;

    // Lanzamos el navegador por primera vez
    let browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: "chrome",
      executablePath: executablePath,
    });

    let page = await browserContext.newPage();

    for (const profileUrl of profileUrls) {
      console.log(`\nProcesando perfil: ${profileUrl}`);

      const contactInfoUrl = `${profileUrl}/overlay/contact-info/`;
      console.log(`  -> Visitando Contact Info: ${contactInfoUrl}`);

      let attempt = 0;
      let success = false;

      while (attempt < 2 && !success) {
        try {
          if (attempt > 0) {
            console.log("  -> Reiniciando navegador y reintentando...");
            if (browserContext) await browserContext.close();
            browserContext = await chromium.launchPersistentContext(userDataDir, {
              headless: false,
              channel: "chrome",
              executablePath: executablePath,
            });
            page = await browserContext.newPage();
          }

          await page.goto(contactInfoUrl);

          // Reducir zoom al 10%
          await page.evaluate(() => {
            document.body.style.zoom = '10%'; // Zoom al 10%
          });

          await page.waitForSelector('a[href="https://about.linkedin.com/"]', { timeout: 15000 });

          const pageContent = await page.evaluate(() => document.body.innerText);

          const profileData = {
            profileUrl,
            content: pageContent,
          };

          extractedProfiles.push(profileData);
          success = true;
        } catch (err) {
          console.warn(`    [!] Error en intento ${attempt + 1}: ${err.message}`);
          attempt++;
        }
      }

      if (!success) {
        console.warn("    [!] Falló después de 2 intentos. Pasando al siguiente perfil...");
        extractedProfiles.push({
          profileUrl,
          content: "",
        });
      }

      profileCounter++;

      // Limpiamos caché cada 10 perfiles
      if (profileCounter % 10 === 0) {
        console.log("\n=== Limpiando caché ===");
        try {
          const cdpSession = await page.context().newCDPSession(page);
          await cdpSession.send("Network.clearBrowserCache");
        } catch (error) {
          console.warn("   [!] No se pudo limpiar la caché: ", error.message);
        }
      }
    }

    // Guardamos el archivo JSON al final
    fs.writeFileSync(outputProfilesFile, JSON.stringify(extractedProfiles, null, 2), "utf-8");
    console.log(`\nLista de perfiles guardada en ${outputProfilesFile}`);

    // Cerramos el navegador
    await browserContext.close();
    console.log("\n*** PROCESO FINALIZADO ***");
  } catch (error) {
    console.error("Error:", error);
  }
})();
