#!/bin/bash

# 1) Cambiamos al directorio donde está este script
cd "$(dirname "$0")"

# 2) Verificamos si ya están instalados los paquetes requeridos
PACKAGES=("dotenv" "playwright" "xlsx" "@google/generative-ai")

for pkg in "${PACKAGES[@]}"; do
    if ! npm list "$pkg" > /dev/null 2>&1; then
        echo "Instalando paquete $pkg..."
        npm install "$pkg"
    fi
done

# 3) Solicitamos al usuario los parámetros
read -p "Introduce el criterio de búsqueda (searchTerm): " searchTerm
read -p "Introduce el código del país (countryCode): " countryCode
read -p "Introduce el número de página (pageNumber): " pageNumber

# 4) Ejecutamos main.js con los tres argumentos
node main.js "$searchTerm" "$countryCode" "$pageNumber"
