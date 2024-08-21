const WebSocket = require('ws');

require('dotenv').config();

const port = 6000;

const wss = new WebSocket.Server({ port: port });

portTostring = wss.options.port;

wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  

  // Enviar uma mensagem para o cliente
  ws.send(JSON.stringify({ message: 'Bem-vindo ao servidor WebSocket!' }));

  // Escutar mensagens do cliente
  ws.on('message', (message) => {
    console.log(`Recebido: ${message}`);
    
    // Responder ao cliente
    ws.send(JSON.stringify({ message: `Você disse: ${message}` }));
  });

  // Quando a conexão é fechada
  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

console.log('\nServidor WebSocket rodando em ws://localhost:' + wss.options.port);


const { exec } = require('child_process');

// Executa o script de web scraping
const child = exec('node ProtocolScrapeScript.js ', (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Erro: ${stderr}`);
    return;
  }
  
  // Recebe a saída do script de web scraping
  const scrapingResult = JSON.parse(stdout); // Converte a saída JSON em objeto
  console.log('Resultado do Web Scraping:', scrapingResult);
});
