/******************************************************
 * gemini.js
 ******************************************************/
require("dotenv").config();
const fs = require("fs");
const XLSX = require("xlsx");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Aquí desestructuramos los argumentos de terminal:
// node gemini.js searchTerm countryCode pageNumber
const [,, searchTerm, countryCode, pageNumber] = process.argv;

// ================
// 1) CONFIGURACIÓN
// ================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_API_KEY) {
  throw new Error("No se encontró la clave API de Gemini. Asigna GEMINI_API_KEY en .env o en el entorno.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  systemInstruction: `
You will receive a JSON with the following fields: profileUrl and content. For each object in the JSON, perform the following tasks:

1) Extract all unique email addresses found in the content field.
2) Extract all complete phone numbers (with or without an international prefix) found in the content field.
3) Attempt to identify the name of the person if it appears in the content.
4) Attempt to identify the person's position (job title) if it appears in the content.
5) Attempt to identify the person's company if it appears in the content, but only if it is a travel agency. 
   If the person's company is not a travel agency or cannot be identified, leave the "company" field as an empty string.

Return a structured JSON that includes:

- "profileUrl": The profile URL as provided.
- "mails": A list of unique email addresses (strings).
- "phones": A list of unique phone numbers (strings).
- "name": The name of the person if found, or empty string if not found.
- "position": The person's position if found, or empty string if not found.
- "company": The company name only if it's a travel agency, otherwise an empty string.

The exact result format should be an array of objects, for example:

[
  {
    "profileUrl": "https://example.com/profile1",
    "mails": ["email1@example.com", "email2@example.com"],
    "phones": ["+1234567890", "9876543210"],
    "name": "John Doe",
    "position": "Travel Agent",
    "company": "Global Travel Agency"
  },
  {
    "profileUrl": "https://example.com/profile2",
    "mails": [],
    "phones": [],
    "name": "",
    "position": "",
    "company": ""
  }
]

Ensure that:

- The order of objects in the output matches the order of the input JSON.
- Each profileUrl from the input JSON is included in the final result, without any duplicates.
- Each email in "mails" is unique for that profile.
- Each phone in "phones" is unique for that profile.
- If no emails are found, "mails" must be an empty array.
- If no phones are found, "phones" must be an empty array.
- If no name is found, "name" must be an empty string.
- If no position is found, "position" must be an empty string.
- If the company is not a travel agency or cannot be determined, "company" must be an empty string.
- All records from the input JSON must be processed completely and thoroughly.
  `,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// ========================
// 2) MUTEX (Exclusión mutua)
// ========================
class Mutex {
  constructor() {
    this.locked = false;
    this.waitingResolvers = [];
  }

  lock() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waitingResolvers.push(resolve);
      }
    });
  }

  unlock() {
    if (this.waitingResolvers.length > 0) {
      const nextResolver = this.waitingResolvers.shift();
      nextResolver();
    } else {
      this.locked = false;
    }
  }
}

// ========================
// 3) RATE LIMITER (10 / min)
// ========================
const MAX_CALLS_PER_MINUTE = 10;
const callTimes = [];
const rateLimitMutex = new Mutex();

async function rateLimitedGeminiCall(userMessage) {
  await rateLimitMutex.lock();
  try {
    // Revisar cuántas llamadas en el último minuto
    while (
      callTimes.length >= MAX_CALLS_PER_MINUTE &&
      Date.now() - callTimes[0] < 60_000
    ) {
      const sleepTime = 60_000 - (Date.now() - callTimes[0]);
      console.log(
        `[RateLimiter] Límite de 10 solicitudes/min alcanzado. Durmiendo ${(sleepTime / 1000).toFixed(
          1
        )} seg...`
      );
      await new Promise((r) => setTimeout(r, sleepTime));
    }

    // Limpiar timestamps antiguos (> 60s)
    while (callTimes.length && Date.now() - callTimes[0] >= 60_000) {
      callTimes.shift();
    }

    // Llamada a Gemini
    const chatSession = model.startChat({ generationConfig });
    const geminiRawResponse = await chatSession.sendMessage(userMessage);
    callTimes.push(Date.now());

    const textResponse = geminiRawResponse.response.text();
    try {
      return JSON.parse(textResponse);
    } catch (error) {
      console.error("[ERROR] No se pudo parsear la respuesta como JSON. Retornando [].");
      return [];
    }
  } finally {
    rateLimitMutex.unlock();
  }
}

// ========================
// 4) DIVIDIR EN BLOQUES (ahora de 10)
// ========================
function chunkArray(array, size = 10) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ========================
// 5) PROCESAR UN CHUNK
// ========================
async function processChunk(chunkData) {
  // Sólo enviamos el JSON crudo al modelo, ya que la instrucción vive en systemInstruction
  const chunkAsJson = JSON.stringify(chunkData, null, 2);

  console.log(`[INFO] Procesando chunk de tamaño ${chunkData.length}...`);
  const response = await rateLimitedGeminiCall(chunkAsJson);

  if (Array.isArray(response)) {
    return response;
  } else {
    return [];
  }
}

// ========================
// 6) PROCESO PRINCIPAL
// ========================
async function main() {
  try {
    // a) Leemos el archivo JSON de entrada
    const inputFile = "playwright.json";
    const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));
    console.log(`[INFO] Total de registros en playwright.json: ${data.length}`);

    // b) Partir en bloques de 10
    const dataChunks = chunkArray(data, 10);
    console.log(`[INFO] Bloques totales: ${dataChunks.length}`);

    // c) Procesar con concurrencia limitada (5 en paralelo)
    const concurrencyLimit = 5;
    const allResults = [];
    let index = 0;

    while (index < dataChunks.length) {
      const slice = dataChunks.slice(index, index + concurrencyLimit);
      const promises = slice.map((chunk) => processChunk(chunk));
      const settledResults = await Promise.allSettled(promises);

      for (const sr of settledResults) {
        if (sr.status === "fulfilled") {
          allResults.push(...sr.value);
        } else {
          console.error("[ERROR] Un chunk falló:", sr.reason);
        }
      }
      index += concurrencyLimit;
    }

    // d) Generar el Excel uniendo la información (mails y phones) con name, position y company
    const mailsRows = [];
    const phonesRows = [];

    allResults.forEach((obj) => {
      const url = obj?.profileUrl || "";
      const personName = obj?.name || "";
      const position = obj?.position || "";
      const company = obj?.company || "";

      // Por cada mail
      const mails = obj?.mails || [];
      mails.forEach((mail) => {
        mailsRows.push({
          profileUrl: url,
          name: personName,
          position: position,
          company: company,
          mail: mail,
        });
      });

      // Por cada phone
      const phones = obj?.phones || [];
      phones.forEach((phone) => {
        phonesRows.push({
          profileUrl: url,
          name: personName,
          position: position,
          company: company,
          phone: phone,
        });
      });

      // Si el perfil no tiene mails ni phones, igual podemos reflejar 
      // la info de name/position/company si lo deseas:
      // (Descomenta si quieres una fila "vacía" para esos casos)
      /*
      if (mails.length === 0 && phones.length === 0) {
        mailsRows.push({
          profileUrl: url,
          name: personName,
          position: position,
          company: company,
          mail: "",
        });
      }
      */
    });

    const mailsWorksheet = XLSX.utils.json_to_sheet(mailsRows);
    const phonesWorksheet = XLSX.utils.json_to_sheet(phonesRows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, mailsWorksheet, "mails");
    XLSX.utils.book_append_sheet(workbook, phonesWorksheet, "phones");

    // e) Nombrar el archivo usando los 3 argumentos: gemini_searchTerm_countryCode_pageNumber.xlsx
    const excelFile = `${searchTerm}_${countryCode}_${pageNumber}.xlsx`;
    XLSX.writeFile(workbook, excelFile);
    console.log(`[OK] Archivo Excel generado: ${excelFile}`);
  } catch (error) {
    console.error("[ERROR] Error en main():", error);
  }
}

// ========================
// 7) EJECUTAR
// ========================
main();
