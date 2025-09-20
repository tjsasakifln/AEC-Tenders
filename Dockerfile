# Usa a imagem oficial do n8n
FROM n8nio/n8n:latest

# Muda para root para poder instalar coisas
USER root

# Adiciona git (necessário em alguns casos)
RUN apk add --no-cache git

# Copia o conteúdo do repositório (seu nó) para dentro da imagem
COPY . /custom

# Entra na pasta e instala globalmente o pacote do nó
WORKDIR /custom
RUN npm install -g .

# Diz ao n8n onde procurar extensões
ENV N8N_CUSTOM_EXTENSIONS=/usr/local/lib/node_modules

# Volta para o usuário padrão do n8n
USER node
