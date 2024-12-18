/*LEMBRAR USUÁRIO DE NÃO ESTAR PRESENTE NA PÁGINA DO PROTOCOLO 
ENQUANDO USA A APLICAÇAO, POIS ISSO GERA COMPORTAMENTOS INESPERADOS
 NO PROCESSO DE SCRAPPING DE MESMO PROTOCOLO E PÁGINA ABERTA */

require('dotenv').config();

const puppeteer = require('puppeteer');

const fs = require('fs');

const PROTOCOL_INFO_PATH = "resultados.json";

const SERVER_LOG_FILE_PATH = "./Logs/Server_log.txt";

const SCRAPE_LOG_PATH = "./Logs/FullScrape_log.txt"

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
    
    case "UpdateGridWithFullProtocols":
      const protocolsToUpdateList = parameters[0];
      
      SA_UpdateGridWithFullProtocols(protocolsToUpdateList, websocket);
      break;
      
    case "CheckForProtocolUpdate":
      const codigosProtocolosPesquisar = parameters[0];
      const horasUltimoMovimento = parameters[1];
      
      SA_CheckForProtocolUpdate(codigosProtocolosPesquisar,horasUltimoMovimento,websocket);
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
  const ExistentActions = ["ProtocolScrape","ActionSendMessage","BySectorMiniProtocolsScrape","UpdateGridWithFullProtocols","CheckForProtocolUpdate"]; 
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
    const child = exec(`node BySubjectPSS.js ${Sector}`, (error, stdout, stderr) => {
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
      logToFile(err);
      return;
    }
    logToFile("Não houve erro no processo de leitura");
  
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
    
      // Apaga o arquivo de log se existir
    if (fs.existsSync(SCRAPE_LOG_PATH)) {
      fs.unlinkSync(SCRAPE_LOG_PATH);
      logToFile('Arquivo de log apagado.');
    }
  
    // Apaga o arquivo de resultados se existir
    if (fs.existsSync(PROTOCOL_INFO_PATH)) {
      fs.unlinkSync(PROTOCOL_INFO_PATH);
      logToFile('Arquivo de resultados apagado.');
    }
        
  }
  
}
async function SA_UpdateGridWithFullProtocols(codigos_de_protocolos_Para_Pesquisar, websocket){

  let data = {};
  
  let protocolosArray = [];
  
  let buttonIndex = 0;
  
  logToFile(JSON.stringify(codigos_de_protocolos_Para_Pesquisar));
  
  if (!codigos_de_protocolos_Para_Pesquisar) {
    console.error('Erro: Código de protocolo não fornecido.');
    process.exit(1);
  }else{
    protocolosArray = codigos_de_protocolos_Para_Pesquisar.split(',');
  }
  
  // Lança o puppeteer em modo headless
  const browser = await puppeteer.launch({ headless: true });
  
  // Abre uma nova página
  const page = await browser.newPage();
  
  // Navega até a URL especificada
  await page.goto('https://crea-pe.sitac.com.br/app/view/pages/login/login.php#!');
  
  // Procura o elemento de login e senha, caso ele seja encontrado, o campo de login é preenchido.
  if (await waitForElement(page, '#username', 5000)) {
    await page.type('#username', process.env.SITAC_LOGIN);
    logToFile('Campo de login preenchido.');
  }
  
  if (await waitForElement(page, '#password', 5000)) {
    await page.type('#password', process.env.SITAC_PASSWORD);
    logToFile('Campo de senha preenchido.');
  }
  
  if (await waitForElement(page, '#submit', 5000)) {
    await page.click('#submit');
    logToFile('Botão de login clicado.');
  }
  
  if (await waitForElement(page, '#logo_fake', 20000)) {
    await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocolo');
    logToFile('Navegando para a página de pesquisa de protocolo.');
  }
  
  for (const protocoloParaPesquisar of protocolosArray) {
    await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocolo');
    logToFile('Navegando para a página de pesquisa de protocolo.');

    const [numero, ano] = protocoloParaPesquisar.split('/');

    if (await waitForElement(page, '#NUMERO', 5000)) {
        await page.type('#NUMERO', numero);
        logToFile(`Número de protocolo ${numero} inserido.`);
    }

    if (await waitForElement(page, '#ANO', 5000)) {
        await page.type('#ANO', ano);
        logToFile(`Ano do protocolo ${ano} inserido.`);
    }

    // Aguarda até que os botões estejam disponíveis
    if (await waitForElement(page, '.botao_ver_todos_dados', 5000)) {
        let botoes = await page.$$('.botao_ver_todos_dados'); // Seleciona todos os botões "Ver todos os dados"
        let buttonIndex = 0; // Redefine o índice do botão para cada protocolo

        // Se houver botões, interaja com eles um a um
        while (buttonIndex < botoes.length) {
            botoes = await page.$$('.botao_ver_todos_dados'); // Atualiza a lista de botões
            const botao = botoes[buttonIndex]; // Obtém o botão no índice atual
            
            await botao.click();
            logToFile(`Botão para ver todos os dados clicado (índice: ${buttonIndex}).`);

            // Aguarda o carregamento dos dados da página
            if (await waitForElement(page, '.ESPACAMENTO', 10000)) {
                const espancamentoData = await page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('.ESPACAMENTO'));

                    return elements.map(element => {
                        const roleElement = element.querySelector('.listar_label_valor label');
                        const infoElement = element.querySelector('.cad_form_cont_campobox .listar_label_result') ||
                                            element.querySelector('.cad_form_cont_campo .listar_label_result');

                        if (roleElement && infoElement) {
                            const roleText = roleElement.innerText.trim();
                            const infoText = infoElement.innerText.trim();

                            if (roleText === "Descrição: ") {
                                return infoText.length > 2 ? infoText : "Sem Descrição";
                            }
                            if (roleText && infoText) {
                                return `${roleText}: ${infoText}`;
                            }
                        }
                    }).filter(item => item);
                });

                if (espancamentoData.length > 0) {
                    data.Header = espancamentoData;
                }
            }

            if (await waitForElement(page, '#ResultAjax_movimento', 60000)) {
                const divElement = await page.$('#ResultAjax_movimento');
                const selectElement = await divElement.$('select');

                if (selectElement) {
                    await page.evaluate(select => {
                        select.value = '-1';
                        select.dispatchEvent(new Event('change'));
                    }, selectElement);
                } else {
                    logToFile('Elemento select não encontrado dentro da div.');
                }

                const tableData = await page.evaluate(() => {
                    const table = document.querySelector('#ResultAjax_movimento');
                    const rows = Array.from(table.querySelectorAll('tbody tr'));
                    return rows.map(row => {
                        const columns = Array.from(row.querySelectorAll('td'));
                        return columns.slice(0, 9).map(column => column.innerText);
                    });
                });

                data.Moves = tableData;

                logToFile('Resultados da tabela salvos. \n' + JSON.stringify(data));

                const dadosParaEnviar = JSON.stringify(data);
                if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                    console.log("WebSocket não está pronto ou não existe.");
                } else {
                    websocket.send(dadosParaEnviar);
                }
            }

            // Incrementa o índice do botão
            buttonIndex++;

            // Volta para a página de pesquisa para escolher o próximo botão
            await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocolo');
            if (await waitForElement(page, '#NUMERO', 5000)) {
                await page.type('#NUMERO', numero);
                logToFile(`Número de protocolo ${numero} inserido.`);
            }

            if (await waitForElement(page, '#ANO', 5000)) {
                await page.type('#ANO', ano);
                logToFile(`Ano do protocolo ${ano} inserido.`);
            }
            await waitForElement(page, '.botao_ver_todos_dados', 10000); // Aguarda os botões estarem disponíveis novamente
        }
    }
  }




  
  await browser.close();
  logToFile('Navegador fechado. Script concluído.');
    
}
async function SA_CheckForProtocolUpdate(codigos_de_protocolos_Para_Pesquisar,horasUltimoMovimento, websocket) {
  
  // Lança o puppeteer em modo headless
  const browser = await puppeteer.launch({ headless: true });
  
  // Abre uma nova página
  const page = await browser.newPage();
  
  // Navega até a URL especificada
  await page.goto('https://crea-pe.sitac.com.br/app/view/pages/login/login.php#!');
  
  // Procura o elemento de login e senha, caso ele seja encontrado, o campo de login é preenchido.
  if (await waitForElement(page, '#username', 5000)) {
    await page.type('#username', process.env.SITAC_LOGIN);
    logToFile('Campo de login preenchido.');
  }
  
  if (await waitForElement(page, '#password', 5000)) {
    await page.type('#password', process.env.SITAC_PASSWORD);
    logToFile('Campo de senha preenchido.');
  }
  
  if (await waitForElement(page, '#submit', 5000)) {
    await page.click('#submit');
    logToFile('Botão de login clicado.');
  }
  
  if (await waitForElement(page, '#logo_fake', 20000)) {
    await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocoloFiltro');
    logToFile('Navegando para a página de pesquisa de protocolo com filtro.');
  }
  
  await waitFor(500);
  
  if(await waitForElement(page,'#EVTPROTOCOLOS',5000)){
    await page.click('#EVTPROTOCOLOS');
    logToFile(`Check box de busca por protocols clicada`);
  }
  
  if (await waitForElement(page, '#PROTOCOLOS', 1000)) {
    // Abre o dropdown
    await page.click('#PROTOCOLOS');
    logToFile(codigos_de_protocolos_Para_Pesquisar);
    
    for (const protocolo of codigos_de_protocolos_Para_Pesquisar.split(',')) {
      logToFile('escrevendo '+ protocolo);
      await page.type('.search-field input[type="text"]', protocolo);
      await page.keyboard.press('Enter');
      await waitFor(300);
    }
    
  }
  
  if(await waitForElement(page,'.botao_informacao',500)){
    await page.click('.botao_informacao');
  }
  
  if(await waitForElement(page,'.dataTables_wrapper',10000)){
  
    const divElement = await page.$('.dataTables_wrapper')
    const selectElement = await divElement.$('select');
    // Seleciona o valor -1 para mostrar todas as movimentações
    if (selectElement) {
      await page.evaluate(select => {
          select.value = '-1'; // Define o valor do select para "Todos"
          select.dispatchEvent(new Event('change')); // Dispara o evento change para aplicar a seleção
      }, selectElement);
    } else {
      logToFile('Elemento select não encontrado dentro da div.');
    }
  }
  
  if (await waitForElement(page, '.dataTables_wrapper', 10000)) {
    
    const divElement = await page.$('.dataTables_wrapper');
      
    const selectElement = await divElement.$('select');
      
    // Seleciona o valor -1 para mostrar todas as movimentações
    if (selectElement) {
      await page.evaluate(select => {
          select.value = '-1'; // Define o valor do select para "Todos"
          select.dispatchEvent(new Event('change')); // Dispara o evento change para aplicar a seleção
      }, selectElement);
    } else {
      logToFile('Elemento select não encontrado dentro da div.');
    }
    
    
    const tableData = await page.evaluate(() => {
      const table = document.querySelector('.dataTables_wrapper');
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const columns = Array.from(row.querySelectorAll('td'));
        // Suponha que a primeira coluna seja o número do protocolo e a segunda coluna a hora
        return {
          protocolo: columns[0].innerText, // Ajuste o índice conforme necessário
          hora: columns[11].innerText        // Ajuste o índice conforme necessário
        };
      });
    });
    
    logToFile(JSON.stringify(tableData));

    // Aqui começa a lógica corrigida para comparar os horários
    // Converter os códigos e horas em arrays
    const codigosArray = codigos_de_protocolos_Para_Pesquisar.split(',');
    const horasArray = horasUltimoMovimento.split(',');

    // Variável para armazenar protocolos que precisam ser atualizados
    const protocolosParaAtualizar = [];

    // Itera sobre os protocolos e horas simultaneamente
    for (let i = 0; i < codigosArray.length; i++) {
        const protocolo = codigosArray[i];
        const horaUltimoMovimento = horasArray[i];

        // Encontrar o protocolo correspondente na tabela extraída
        const protocoloData = tableData.find(data => data.protocolo === protocolo);

        if (protocoloData) {
            const horaTabela = protocoloData.hora;

            // Comparar as horas
            if (horaUltimoMovimento !== horaTabela) {
                protocolosParaAtualizar.push(protocolo);
            }
        } else {
            logToFile(`Protocolo ${protocolo} não encontrado na tabela extraída.`);
        }
    }

    logToFile("Comparação de horários feita, há " + protocolosParaAtualizar.length + " para atualizar");
    websocket.send(protocolosParaAtualizar.length);

    if (protocolosParaAtualizar.length > 0) {
        logToFile('Protocolos que precisam ser atualizados: '+ JSON.stringify(protocolosParaAtualizar));
        const protocolosParaAtualizarComV = protocolosParaAtualizar.join(",");
        logToFile( JSON.stringify(protocolosParaAtualizarComV));
        SA_UpdateGridWithFullProtocols(protocolosParaAtualizarComV,websocket);
    } else {
        logToFile('Não há protocolos para serem atualizados');
    }
    
  }
  
  await browser.close();
  logToFile('Navegador fechado. Script concluído.');
}
/*UTIL FUNCTIONS*/


/* UTIL FUNCTIONS FOR THE FULLSCRAPE PROCESS*/

/*I could not send the websocket to the UpdateGridWithFullProtocols 
so i created a function here at the ain server script to make the process*/
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    logToFile('Seletor encontrado: ' + selector);
    return true; // Retorna verdadeiro se o seletor for encontrado
  } catch (error) {
     logToFile('Timeout atingido: o seletor ' + selector + ' não foi encontrado.'  + selector);
    return false; // Retorna falso se o seletor não for encontrado
  }
}

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/* UTIL FUNCTIONS FOR THE FULLSCRAPE PROCESS*/

clearFiles();

const WebSocket = require('ws');
const { log } = require('console');

require('dotenv').config();

const port = 5247;

const wss = new WebSocket.Server({ port: port });

logToFile('\nServidor WebSocket rodando em ws://localhost:' + wss.options.port);

wss.on('connection', (ws) => {
  logToFile('Cliente conectado');

  // Escutar mensagens do cliente
  ws.on('message', (message) => {
    logToFile(`\nRecebido: ${message}`);
  
    //lexical analisis and action execution
    RequisitionLexicalAnalysis(message, ws);
  
  });
  
  

  // Quando a conexão é fechada
  ws.on('close', () => {
    logToFile('Cliente desconectado');
  });
});





