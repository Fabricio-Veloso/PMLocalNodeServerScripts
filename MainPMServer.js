/*LEMBRAR USUÁRIO DE NÃO ESTAR PRESENTE NA PÁGINA DO PROTOCOLO 
ENQUANDO USA A APLICAÇAO, POIS ISSO GERA COMPORTAMENTOS INESPERADOS
 NO PROCESSO DE SCRAPPING DE MESMO PROTOCOLO E PÁGINA ABERTA */

const { Protocol } = require('puppeteer');

const fs = require('fs');

const PROTOCOL_INFO_PATH = "resultados.json";

const SERVER_LOG_FILE_PATH = "./Logs/Server_log.txt";

/*UTIL FUNCTIONS*/

/**/

/* action function 

is called when an action is needed do be perfomed by the node back-end
no return, recives the action and it"s parameters(as an aray) that must be performed as a string(for easy code reading )
*/
function ServerPerformAction(action, parameters, websocket){
  switch (action) {
  
    case"BySectorMiniProtocolsScrape":
      sector = parameters[0];
      SA_BySectorMiniProtocolScrape(sector,websocket);
      break;
  
    case "ProtocolScrape":
      protocolID = parameters[0];
      SA_ProtocolScrape(protocolID,websocket);
      break;
      
    case "Sendmessage":
      const message = parameters[0]; // Obtém a mensagem
      // Responder ao cliente
      SA_SendMessage(message, websocket);
      break;
  
    default:
      logToFile("Ação não recohecida");
      break;
  }
  

}/**/
/*lexical analisis function

responsable for recive messagens from the blazor webassemly aplication 
true the webscoket and parting it in to a action here in th script

no return, Recives the message as a string and the websocket (to pass it to functions that need it)

is needed to define with actions exist so they can be called
They mus b defined in the action function

Every RequisitionLexicalAnalysis call must result in a Server Action

*/
function RequisitionLexicalAnalysis(recivedmessage,ws){
  const ExistentActions = ["ProtocolScrape","ActionSendMessage"]; 
  const toStringRecivedMessage = recivedmessage.toString();
  const tokens = toStringRecivedMessage.split(" ");
  const requestedAction = tokens[0]; // Obtém o primeiro token
  
  ExistentActions.forEach(action => {
    if ( requestedAction === action) { // Compara o primeiro token com cada ação existente
        logToFile(`Ação correspondente encontrada: ${action}`);
        const parameters = tokens.slice(1);
        ServerPerformAction(action,parameters,ws);
        // Aqui você pode chamar a função correspondente ou executar a lógica desejada
    }
  });
} /**/
function SA_BySectorMiniProtocolScrape(Sector,websocket){

  const { exec } = require("child_process");
    // Executa o script de web scraping
    const child = exec(`node BBySubjectPSS.js ${Sector}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Erro: ${stderr}`);
        return;
      }
    
      SA_SendProtocolInfo(websocket);
    
    });
}
function SA_ProtocolScrape(protocolNumber,websocket){

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
    
      SA_SendProtocolInfo(websocket);
    
    });
}  
function SA_SendMessage(messageToSend,websocket) {
  websocket.send(JSON.stringify({ messageToSend: `Você disse: ${messageToSend}` }));
}
function SA_SendProtocolInfo(websocket){
  fs.readFile(PROTOCOL_INFO_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo JSON:", err);
      return;
    }
    // Envia o conteúdo do arquivo JSON via WebSocket
    websocket.send(data);
  });
}
function logToFile(message) {
  const timestamp = new Date().toISOString(); // Timestamp para log
  fs.appendFileSync(SERVER_LOG_FILE_PATH, `${timestamp} - ${message}\n`, 'utf8'); // Adiciona mensagem ao arquivo de log
}
function clearFiles() {
  
  // Apaga o arquivo de log se existir
  if (fs.existsSync(SERVER_LOG_FILE_PATH)) {
    fs.unlinkSync(SERVER_LOG_FILE_PATH);
    logToFile('Arquivo de log do servidor apagado.');
  }

}
/*UTIL FUNCTIONS*/

clearFiles();

const WebSocket = require('ws');

require('dotenv').config();

const port = 5247;

const wss = new WebSocket.Server({ port: port });

logToFile('\nServidor WebSocket rodando em ws://localhost:' + wss.options.port);

wss.on('connection', (ws) => {
  logToFile('Cliente conectado');

  // Escutar mensagens do cliente
  ws.on('message', (message) => {
    logToFile(`Recebido: ${message}`);
  
    //lexical analisis and action execution
    RequisitionLexicalAnalysis(message, ws);
  
  });

  // Quando a conexão é fechada
  ws.on('close', () => {
    logToFile('Cliente desconectado');
  });
});





