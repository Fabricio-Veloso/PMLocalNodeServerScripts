
const { Protocol } = require('puppeteer');

const fs = require('fs');


/*UTIL FUNCTIONS*/

/*lexical analisis function

responsable for recive messagens from the blazor webassemly aplication 
true the webscoket and parting it in to a action here in th script

no return, Recives the message as a string

is needed to define with actions exist so they can be called
They mus b defined in the action function

Every RequisitionLexicalAnalysis call must result in a Server Action

*/
function RequisitionLexicalAnalysis(recivedmessage){
  
  ExistentActions = ["ProtocolScrape","ActionSendMessage"]; 
  
  toStringRecivedMessage = recivedmessage.toString();
  
  tokens = toStringRecivedMessage.split(" ");
  
  const requestedAction = tokens[0]; // Obtém o primeiro token
  
  ExistentActions.forEach(action => {
    if ( requestedAction === action) { // Compara o primeiro token com cada ação existente
        logToFile(`Ação correspondente encontrada: ${action}`);
        const parameters = tokens.slice(1);
        ServerPerformAction(action,parameters);
        // Aqui você pode chamar a função correspondente ou executar a lógica desejada
    }
  });

}
/*
*/

/* action function 

is called when an action is needed do be perfomed by the node back-end
no return, recives the action and it"s parameters(as an aray) that must be performed as a string(for easy code reading )
*/
function ServerPerformAction(action,parameters){
  
  switch (action) {
  
    case "ProtocolScrape":
      ProtocolNumberIdetification = parameters[0];
      SA_ProtocolScrape(ProtocolNumberIdetification);
      break;
      
      case "Sendmessage":
        const websocket = parameters[1]; // Obtém o websocket
        const message = parameters[0]; // Obtém a mensagem
        // Responder ao cliente
        SA_SendMessage(websocket, message);
        break;
  
    default:
      logToFile("Ação não recohecida");
      break;
  }
  

}
/*
*/

function SA_ProtocolScrape(protocolNumber){

  const { exec } = require("child_process");
  
  // Executa o script de web scraping
  const child = exec(`node ProtocolScrapeScript.js ${protocolNumber}`, (error, stdout, stderr) => {
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
    logToFile("Resultado do Web Scraping:", scrapingResult);
  });

}

function SA_SendMessage(ws, messageToSend) {
  ws.send(JSON.stringify({ messageToSend: `Você disse: ${messageToSend}` }));
}

function logToFile(message) {
  const logFilePath = 'Server_log.txt'; // Nome do arquivo de log
  const timestamp = new Date().toISOString(); // Timestamp para log
  fs.appendFileSync(logFilePath, `${timestamp} - ${message}\n`, 'utf8'); // Adiciona mensagem ao arquivo de log
}
/*UTIL FUNCTIONS*/


const WebSocket = require('ws');

require('dotenv').config();

const port = 5247;

const wss = new WebSocket.Server({ port: port });

logToFile('\nServidor WebSocket rodando em ws://localhost:' + wss.options.port);

wss.on('connection', (ws) => {
  logToFile('Cliente conectado');
  

  // Enviar uma mensagem para o cliente
  ws.send(JSON.stringify({ message: 'Bem-vindo aos servidor WebSocket!' }));
  
  

  // Escutar mensagens do cliente
  ws.on('message', (message) => {
    logToFile(`Recebido: ${message}`);
  
    //lexical analisis and action execution
    RequisitionLexicalAnalysis(message);
    
    
  });

  // Quando a conexão é fechada
  ws.on('close', () => {
    logToFile('Cliente desconectado');
  });
});





