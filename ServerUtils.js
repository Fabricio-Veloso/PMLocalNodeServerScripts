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
  
  ExistentActions = ["ProtocolScrape,ActionSendMessage"]; 
  
  tokens = recivedmessage.split(" ");
  
  const requestedAction = tokens[0]; // Obtém o primeiro token
  
  ExistentActions.forEach(action => {
    if ( requestedAction === action) { // Compara o primeiro token com cada ação existente
        console.log(`Ação correspondente encontrada: ${action}`);
        parameters = tokens;
        ServerPerformAction(action,parameters);
        // Aqui você pode chamar a função correspondente ou executar a lógica desejada
    }
    else{
      console.log("no action was identified in the mensage");
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
    websocket = parameters[1];
    message = parameters[0];
    // Responder ao clinte
    ActionSendMessage(websocket,message);
  
    default:
      console.log("Ação não recohecida");
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
    console.log("Resultado do Web Scraping:", scrapingResult);
  });

}

function SA_SendMessage(ws, messageToSend) {
  ws.send(JSON.stringify({ messageToSend: `Você disse: ${messageToSend}` }));
}



/*UTIL FUNCTIONS*/

export{SA_ProtocolScrape,ServerPerformAction,RequisitionLexicalAnalysis,SA_SendMessage};


