require("dotenv").config();

const SERPER_API_KEY = process.env.SERPER_API_KEY; // Obtiene la clave desde .venv

const fs = require("fs");

const searchTerm = process.argv[2];
const countryCode = process.argv[3];
const pageNumber = parseInt(process.argv[4], 10); // Tercer argumento para el número de página

const isoCountries = {
    "af": "Afghanistan",
    "ax": "Aland Islands",
    "al": "Albania",
    "dz": "Algeria",
    "as": "American Samoa",
    "ad": "Andorra",
    "ao": "Angola",
    "ai": "Anguilla",
    "aq": "Antarctica",
    "ag": "Antigua and Barbuda",
    "ar": "Argentina",
    "am": "Armenia",
    "aw": "Aruba",
    "au": "Australia",
    "at": "Austria",
    "az": "Azerbaijan",
    "bs": "Bahamas",
    "bh": "Bahrain",
    "bd": "Bangladesh",
    "bb": "Barbados",
    "by": "Belarus",
    "be": "Belgium",
    "bz": "Belize",
    "bj": "Benin",
    "bm": "Bermuda",
    "bt": "Bhutan",
    "bo": "Bolivia",
    "ba": "Bosnia and Herzegovina",
    "bw": "Botswana",
    "bv": "Bouvet Island",
    "br": "Brazil",
    "io": "British Indian Ocean Territory",
    "bn": "Brunei Darussalam",
    "bg": "Bulgaria",
    "bf": "Burkina Faso",
    "bi": "Burundi",
    "kh": "Cambodia",
    "cm": "Cameroon",
    "ca": "Canada",
    "cv": "Cape Verde",
    "ky": "Cayman Islands",
    "cf": "Central African Republic",
    "td": "Chad",
    "cl": "Chile",
    "cn": "China",
    "cx": "Christmas Island",
    "cc": "Cocos (Keeling) Islands",
    "co": "Colombia",
    "km": "Comoros",
    "cg": "Congo",
    "cd": "Congo, the Democratic Republic of the",
    "ck": "Cook Islands",
    "cr": "Costa Rica",
    "ci": "Côte d'Ivoire",
    "hr": "Croatia",
    "cu": "Cuba",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "dk": "Denmark",
    "dj": "Djibouti",
    "dm": "Dominica",
    "do": "Dominican Republic",
    "ec": "Ecuador",
    "eg": "Egypt",
    "sv": "El Salvador",
    "gq": "Equatorial Guinea",
    "er": "Eritrea",
    "ee": "Estonia",
    "et": "Ethiopia",
    "fk": "Falkland Islands (Malvinas)",
    "fo": "Faroe Islands",
    "fj": "Fiji",
    "fi": "Finland",
    "fr": "France",
    "gf": "French Guiana",
    "pf": "French Polynesia",
    "tf": "French Southern Territories",
    "ga": "Gabon",
    "gm": "Gambia",
    "ge": "Georgia",
    "de": "Germany",
    "gh": "Ghana",
    "gi": "Gibraltar",
    "gr": "Greece",
    "gl": "Greenland",
    "gd": "Grenada",
    "gp": "Guadeloupe",
    "gu": "Guam",
    "gt": "Guatemala",
    "gg": "Guernsey",
    "gn": "Guinea",
    "gw": "Guinea-Bissau",
    "gy": "Guyana",
    "ht": "Haiti",
    "hm": "Heard Island and McDonald Islands",
    "va": "Holy See (Vatican City State)",
    "hn": "Honduras",
    "hk": "Hong Kong",
    "hu": "Hungary",
    "is": "Iceland",
    "in": "India",
    "id": "Indonesia",
    "ir": "Iran, Islamic Republic of",
    "iq": "Iraq",
    "ie": "Ireland",
    "im": "Isle of Man",
    "il": "Israel",
    "it": "Italy",
    "jm": "Jamaica",
    "jp": "Japan",
    "je": "Jersey",
    "jo": "Jordan",
    "kz": "Kazakhstan",
    "ke": "Kenya",
    "ki": "Kiribati",
    "kp": "Korea, Democratic People's Republic of",
    "kr": "Korea, Republic of",
    "kw": "Kuwait",
    "kg": "Kyrgyzstan",
    "la": "Lao People's Democratic Republic",
    "lv": "Latvia",
    "lb": "Lebanon",
    "ls": "Lesotho",
    "lr": "Liberia",
    "ly": "Libya",
    "li": "Liechtenstein",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "mo": "Macao",
    "mk": "North Macedonia",
    "mg": "Madagascar",
    "mw": "Malawi",
    "my": "Malaysia",
    "mv": "Maldives",
    "ml": "Mali",
    "mt": "Malta",
    "mh": "Marshall Islands",
    "mq": "Martinique",
    "mr": "Mauritania",
    "mu": "Mauritius",
    "yt": "Mayotte",
    "mx": "Mexico",
    "fm": "Micronesia",
    "md": "Moldova",
    "mc": "Monaco",
    "mn": "Mongolia",
    "me": "Montenegro",
    "ms": "Montserrat",
    "ma": "Morocco",
    "mz": "Mozambique",
    "mm": "Myanmar",
    "na": "Namibia",
    "nr": "Nauru",
    "np": "Nepal",
    "nl": "Netherlands",
    "nc": "New Caledonia",
    "nz": "New Zealand",
    "ni": "Nicaragua",
    "ne": "Niger",
    "ng": "Nigeria",
    "nu": "Niue",
    "nf": "Norfolk Island",
    "mp": "Northern Mariana Islands",
    "no": "Norway",
    "om": "Oman",
    "pk": "Pakistan",
    "pw": "Palau",
    "ps": "Palestine, State of",
    "pa": "Panama",
    "pg": "Papua New Guinea",
    "py": "Paraguay",
    "pe": "Peru",
    "ph": "Philippines",
    "pn": "Pitcairn",
    "pl": "Poland",
    "pt": "Portugal",
    "pr": "Puerto Rico",
    "qa": "Qatar",
    "re": "Reunion",
    "ro": "Romania",
    "ru": "Russian Federation",
    "rw": "Rwanda",
    "bl": "Saint Barthelemy",
    "sh": "Saint Helena",
    "kn": "Saint Kitts and Nevis",
    "lc": "Saint Lucia",
    "mf": "Saint Martin",
    "pm": "Saint Pierre and Miquelon",
    "vc": "Saint Vincent and the Grenadines",
    "ws": "Samoa",
    "sm": "San Marino",
    "st": "Sao Tome and Principe",
    "sa": "Saudi Arabia",
    "sn": "Senegal",
    "rs": "Serbia",
    "sc": "Seychelles",
    "sl": "Sierra Leone",
    "sg": "Singapore",
    "sx": "Sint Maarten",
    "sk": "Slovakia",
    "si": "Slovenia",
    "sb": "Solomon Islands",
    "so": "Somalia",
    "za": "South Africa",
    "gs": "South Georgia",
    "ss": "South Sudan",
    "es": "Spain",
    "lk": "Sri Lanka",
    "sd": "Sudan",
    "sr": "Suriname",
    "sz": "Swaziland",
    "se": "Sweden",
    "ch": "Switzerland",
    "sy": "Syrian Arab Republic",
    "tw": "Taiwan",
    "tj": "Tajikistan",
    "tz": "Tanzania",
    "th": "Thailand",
    "tl": "Timor-Leste",
    "tg": "Togo",
    "tk": "Tokelau",
    "to": "Tonga",
    "tt": "Trinidad and Tobago",
    "tn": "Tunisia",
    "tr": "Turkey",
    "tm": "Turkmenistan",
    "tc": "Turks and Caicos Islands",
    "tv": "Tuvalu",
    "ug": "Uganda",
    "ua": "Ukraine",
    "ae": "United Arab Emirates",
    "gb": "United Kingdom",
    "us": "United States",
    "uy": "Uruguay",
    "uz": "Uzbekistan",
    "vu": "Vanuatu",
    "ve": "Venezuela",
    "vn": "Vietnam",
    "wf": "Wallis and Futuna",
    "eh": "Western Sahara",
    "ye": "Yemen",
    "zm": "Zambia",
    "zw": "Zimbabwe"
};

const countryName = isoCountries[countryCode?.toLowerCase()];

const myHeaders = {
  "X-API-KEY": SERPER_API_KEY,
  "Content-Type": "application/json",
};

function buildSerperRequest(term, location, gl, page) {
  return JSON.stringify({
    q: `site:https://${gl.toLowerCase()}.linkedin.com/in/ {${term}} ("@gmail.com" OR "@outlook.com" OR "@yahoo.com" OR "@hotmail.com")`,
    location, // Ej: "Colombia"
    gl: gl.toLowerCase(), // Ej: "co"
    hl: "es-419",
    num: 100,
    page,
  });
}

function cleanLink(link) {
  const match = link.match(/https:\/\/(\w+)\.linkedin\.com\/in\/([^/?]*)/);
  return match ? `https://${match[1]}.linkedin.com/in/${match[2]}` : link;
}

(async () => {
  try {
    const allLinks = [];

    console.log(`\n--- Solicitando página ${pageNumber} desde Serper ---`);

    const raw = buildSerperRequest(searchTerm, countryName, countryCode, pageNumber);
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch("https://google.serper.dev/search", requestOptions);
    if (!response.ok) {
      throw new Error(`Error en Serper (página ${pageNumber}): ${response.statusText}`);
    }

    const jsonResult = await response.json();

    if (!jsonResult.organic || !Array.isArray(jsonResult.organic)) {
      console.warn(`No hay resultados 'organic' en la página ${pageNumber}.`);
      return;
    }

    jsonResult.organic.forEach((item) => {
      if (item.link) {
        allLinks.push(cleanLink(item.link));
      }
    });

    console.log(`Página ${pageNumber} - enlaces obtenidos: ${jsonResult.organic.length}`);

    const outputFileName = `serper.json`;
    fs.writeFileSync(outputFileName, JSON.stringify(allLinks, null, 2), "utf-8");

    console.log(`\nLista de enlaces guardada en ${outputFileName}`);
  } catch (error) {
    console.error("Error:", error);
  }
})();
