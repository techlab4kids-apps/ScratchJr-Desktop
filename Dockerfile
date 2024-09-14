# Utilizza Ubuntu 16.04 LTS come base
FROM ubuntu:16.04

# Imposta le variabili d'ambiente per evitare domande interattive durante l'installazione
ENV DEBIAN_FRONTEND=noninteractive

# Aggiorna il sistema e installa le dipendenze di base
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libgtk2.0-0 \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xz-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Installa nvm
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=v16.20.2

RUN mkdir -p $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Installa Node.js e imposta i percorsi
RUN . $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm use --delete-prefix $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    ln -s $NVM_DIR/versions/node/$NODE_VERSION/bin/node /usr/local/bin/node && \
    ln -s $NVM_DIR/versions/node/$NODE_VERSION/bin/npm /usr/local/bin/npm && \
    ln -s $NVM_DIR/versions/node/$NODE_VERSION/bin/npx /usr/local/bin/npx

# Imposta la directory di lavoro
WORKDIR /app

# Copia il file package.json e package-lock.json (se presente)
COPY package*.json ./

# Installa le dipendenze del progetto
RUN npm install

# Copia il resto dell'applicazione
COPY . .

RUN pwd

RUN ls -la

# Comando di default per costruire l'applicazione
CMD ["npm", "run", "make"]
