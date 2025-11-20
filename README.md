Fittoni - El Teu Entrenador Personal amb IA

Fittoni és una plataforma de fitness intel·ligent que transforma la teva càmera en un entrenador personal. Utilitzant intel·ligència artificial, analitza els teus moviments en temps real per corregir la teva postura, valorar la teva tècnica i assegurar que cada exercici es realitzi de forma segura i efectiva.

📜 Índex

Equip

Aplicació en Viu

Característiques Principals

Tecnologies Utilitzades

Instal·lació i Posada en Marxa Local

Gestió del Projecte

👥 Equip (Grup 6)

Aquest projecte ha estat desenvolupat com un esforç col·laboratiu per un equip de quatre persones, cadascuna aportant la seva experiència en àrees clau per a l'èxit de Fittoni.

Nom

Rol Principal

Usuaris GitHub

Javier

BBDD, Infraestructura i Gestió del Projecte

JavaGuper, Vers4t1l

Izan

Frontend i Integració d'IA

zaxtronic

Pariskar

Backend i API

a24parrijrij

Dani

Membre de l'Equip

-

Contribucions Destacades:

Javier (JavaGuper, Vers4t1l): Va liderar el disseny de la base de dades (E-R, SQL), el desplegament a Google Cloud (NGINX, Certbot) i l'estructura inicial i organització final del repositori.

Izan (zaxtronic): Responsable principal del desenvolupament del frontend amb Vue i Vuetify, i de la complexa integració de la IA al client amb TensorFlow.js i Gemini.

Pariskar (a24parrijrij): Desenvolupador principal del backend, construint l'API REST amb Node.js/Express i la lògica de WebSockets per a les sales en temps real.

🚀 Aplicació en Viu

👉 fittoni.dam.inspedralbes.cat

(Nota: L'aplicació requereix accés a la càmera per a la seva funcionalitat principal. Assegura't de concedir els permisos al teu navegador.)

✨ Característiques Principals

👤 Gestió d'Usuaris Completa: Registre segur amb validació d'email (ZeroBounce) i perfil personalitzat amb estadístiques.

🏋️ Ampli Catàleg d'Exercicis: Cercador intel·ligent connectat a diverses APIs amb més de 30 exercicis guiats per vídeo.

🤖 Sales d'Entrenament amb IA: Sales multijugador amb WebSockets, anàlisi de postura en temps real amb un "esquelet" digital i feedback instantani.

🏆 Sistema de Classificació: Taula de classificació (Leaderboard) al final de cada sessió per fomentar la competència.

🛠️ Tecnologies Utilitzades

Frontend (/final-app)

Framework: Vue 3, Vite, Vuetify 3.

Intel·ligència Artificial: TensorFlow.js, MoveNet, Google Gemini AI.

Backend (/virtual-trainer-backend)

Entorn: Node.js amb Express.js.

Comunicació: WebSockets (ws).

Base de Dades: MySQL 8.

Script Auxiliar d'IA (Python)

Un script (process_video.py) executat sota demanda per preprocessar vídeos de referència, utilitzant TensorFlow, OpenCV-Python i NumPy.

Infraestructura i Desplegament

Desenvolupament Local: Docker i Docker Compose.

Producció: Google Cloud, NGINX, HestiaCP i Certbot.

🔧 Instal·lació i Posada en Marxa Local

Segueix aquests passos per executar el projecte a la teva màquina.

Requisits Previs

Node.js (LTS): nodejs.org

Python 3.x: python.org

yt-dlp i ffmpeg:

Linux (Ubuntu/Debian): sudo apt update && sudo apt install yt-dlp ffmpeg

macOS (Homebrew): brew install yt-dlp ffmpeg

Windows (Chocolatey): choco install yt-dlp ffmpeg

Pas 1: Preparar el Projecte

Clona el repositori:

git clone [https://github.com/inspedralbes/tr1-type-racer-royale-dam_25_26_tr1g6.git](https://github.com/inspedralbes/tr1-type-racer-royale-dam_25_26_tr1g6.git)


Navega a la carpeta arrel del projecte.

Pas 2: Instal·lar Dependències del Frontend

Des de la carpeta arrel del projecte, navega al frontend i instal·la les seves dependències:

cd final-app
npm install
cd ..


Pas 3: Instal·lar Dependències del Backend

Navega a la carpeta del backend:

cd virtual-trainer-backend


Instal·la els paquets de Node.js:

npm install


Crea i activa l'entorn virtual de Python:

python3 -m venv venv
source venv/bin/activate  # A Linux/macOS
# .\venv\Scripts\activate # A Windows (utilitza aquesta si ets a Windows)


Instal·la els paquets de Python:

pip install -r requirements.txt


Pas 4: Configurar les Claus d'API

A la carpeta /final-app, canvia el nom de .env.example a .env i afegeix les teves claus.
Fes el mateix a la carpeta /virtual-trainer-backend.

Pas 5: Iniciar l'Aplicació!

Obre dues terminals separades.

➡️ Terminal 1 (Backend)

# Navega a la carpeta del backend des de l'arrel
cd virtual-trainer-backend

# Activa l'entorn virtual (Molt important!)
source venv/bin/activate

# Inicia el servidor
node index.js


➡️ Terminal 2 (Frontend)

# Navega a la carpeta del frontend des de l'arrel
cd final-app

# Inicia l'aplicació de desenvolupament
npm run dev


Un cop els dos servidors estiguin funcionant, obre http://localhost:5173 al teu navegador.

📋 Gestió del Projecte

La planificació i el seguiment de les tasques del projecte s'han gestionat amb les següents eines:

Taiga (Backlog): [https://tree.taiga.io/project/javaguper-dam_25_26_tr1g6/backlog]

GitHub (Repositori): [https://github.com/inspedralbes/tr1-type-racer-royale-dam_25_26_tr1g6]
