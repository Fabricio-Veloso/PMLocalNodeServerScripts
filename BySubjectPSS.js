const puppeteer = require('puppeteer');
const fs = require('fs'); // Importa o módulo fs para manipulação de arquivos
const { log } = require('util');
require('dotenv').config();

const PROTOCOL_INFO_PATH = "./resultados.json";

const SCRAPE_LOG_PATH = "./Logs/subscrape_log.txt"

// Função para esperar um certo número de milissegundos
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// Função para gravar logs em um arquivo
function logToFile(message) {
  const timestamp = new Date().toISOString(); // Timestamp para log
  fs.appendFileSync(SCRAPE_LOG_PATH, `${timestamp} - ${message}\n`, 'utf8'); // Adiciona mensagem ao arquivo de log
}

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

function clearFiles() {
  
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

(async () => {

  clearFiles();
  
  let data = {};
  
  setorFiltro = process.argv[2];
  
  if (!setorFiltro) {
    console.error('Erro: Assunto não recebido');
    process.exit(1);
  }
  
  filtroDeAssuntos = "filtro De Assuntos não recebido";
  
  const AssuntosFiltroLicitacao = [
    
   "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 04 - LICITAÇÃO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 05 - EXECUÇÃO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 06 - ADITIVO DE CONTRATO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 03 - CONTRATAÇÃO DIRETA",
    "SAC - SECRETARIA DE APOIO AO COLEGIADO - Processo de Aquisição de Bens e Serviços - PABS",
    "COMUNICAÇÃO - PABS",
    "POLÍTICAS INSTITUCIONAIS  - PABS",
    "PRESIDÊNCIA  - SOLICITAÇÃO DE BENS E SERVIÇOS - PABS",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 01 - SOLICITAÇÃO DE CONTRATAÇÃO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 02 - PLANEJAMENTO DE CONTRATAÇÃO"
  ];
  
  const AssuntosFiltroFiscalização = ["SOLICITAÇÃO DE DIÁRIAS - SEAD- SOLICITAÇÃO DE DIÁRIAS"]
  
  
  /*
 "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 04 - LICITAÇÃO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 05 - EXECUÇÃO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 06 - ADITIVO DE CONTRATO",
    "SAC - SECRETARIA DE APOIO AO COLEGIADO - Processo de Aquisição de Bens e Serviços - PABS",
    "COMUNICAÇÃO - PABS",
    "POLÍTICAS INSTITUCIONAIS  - PABS",
    "PRESIDÊNCIA  - SOLICITAÇÃO DE BENS E SERVIÇOS - PABS",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 01 - SOLICITAÇÃO DE CONTRATAÇÃO",
    "PROCESSO DE AQUISIÇÕES DE BENS E SERVIÇOS - PABS - CREA-PE - 02 - PLANEJAMENTO DE CONTRATAÇÃO",
  */
  AssuntosFiltroSetores = [AssuntosFiltroLicitacao,AssuntosFiltroFiscalização]; 
  
  switch (setorFiltro) {
    case "Licitacao":
    filtroDeAssuntos = AssuntosFiltroSetores[0]
      break;
      
    case "Fiscalizacao":
    filtroDeAssuntos = AssuntosFiltroSetores[1]
      break;
      
    default:
    logToFile("Nem uma lista de assuntos filtro compatível");
      break;
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
    await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocoloFiltro');
    logToFile('Navegando para a página de pesquisa de protocolo com filtro.');
  }
  await waitFor(500);
  
  if(await waitForElement(page,'#EVTASSUNTO',5000)){
    await page.click('#EVTASSUNTO');
    logToFile(`Check box de assunto clicada`);
  }
  
  if (await waitForElement(page, '#ASSUNTO_chosen', 1000)) {
    // Abre o dropdown
    await page.click('#ASSUNTO_chosen');
    
    for (const opcao of filtroDeAssuntos) {
      logToFile('escrevendo '+opcao);
      await page.type('.search-field input[type="text"]', opcao);
      await page.keyboard.press('Enter');
      await waitFor(300);
      
      
    }
    
  }

  if(await waitForElement(page,'#EVTSTATUS',5000)){
    await page.click('#EVTSTATUS');
    logToFile(`Check box de status clicada`);
    await page.click('#STATUS_chosen');
    logToFile('escrevendo Ativo');
    await page.type('.search-field input[type="text"]', 'aberto');
    await page.keyboard.press('Enter');
  }
  
  //
  
  if( await waitForElement(page,'#Evt_DataCadastro',5000)){
    await page.click('#EVTDATACADASTRO');
    const parentSelector = '#Evt_DataCadastro';
    // Preenche o campo "DATA_INICIO" dentro do contêiner pai
    const dataInicioSelector = `${parentSelector} #DATA_INICIO`;
    await page.waitForSelector(dataInicioSelector);
    //await page.click(dataInicioSelector, { clickCount: 3 }); // Seleciona o campo inteiro
    await page.type(dataInicioSelector, '01/01/2023'); // Substitua pela data desejada

    // Preenche o campo "DATA_FIM" dentro do contêiner pai
    const dataFimSelector = `${parentSelector} #DATA_FIM`;
    await page.waitForSelector(dataFimSelector);
    //await page.click(dataFimSelector, { clickCount: 3 }); // Seleciona o campo inteiro
    await page.type(dataFimSelector, '31/12/2024'); 
    
  }
  

  
  
  
  //
  
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
  
  // Avalia a tabela de movimentações
  const tableData = await page.evaluate(() => {
    const table = document.querySelector('.dataTables_wrapper');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const columns = Array.from(row.querySelectorAll('td'));
      return columns.slice(0, 12).map(column => column.innerText);
    });
  });
  
  data.MiniProtocols = tableData;
  
  
  
  // Salva os dados da tabela em um arquivo JSON
  fs.writeFileSync('resultados.json', JSON.stringify(data, null, 2), 'utf8');
  logToFile('Resultados da tabela salvos.');

  // Fecha o navegador
  await browser.close();
  logToFile('Navegador fechado. Script concluído.');
  
  
  /*
  
  if(await waitForElement(page,'.botao_ver_todos_dados',5000)){
    await page.click('.botao_ver_todos_dados');
    logToFile('Botão para ver todos os dados clicado.');
  }
  
  if (await waitForElement(page, '.ESPACAMENTO', 5000)) {
    logToFile('Div de cabeçalho encontrada');
    const espancamentoData = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('.ESPACAMENTO'));
      
      return elements.map(element => {
        const roleElement = element.querySelector('.listar_label_valor label');
        const infoElement = element.querySelector('.cad_form_cont_campo .listar_label_result');
  
        if (roleElement?.innerText.trim() && infoElement?.innerText.trim()) {
          return `${roleElement.innerText.trim()}: ${infoElement.innerText.trim()}`;
        }
      }).filter(item => item); // Remove elementos nulos ou indefinidos
    });
    logToFile('Dados de cabeçalho recolhidos');
    if (espancamentoData.length > 0) {
      data.Header = espancamentoData;
    }
  }
  200245998
  200248809
  200247190
  
  // Aguarda o carregamento do menu de movimentação
  if(await waitForElement(page,'#ResultAjax_movimento',60000)){
    const divElement = await page.$('#ResultAjax_movimento');
    
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
    
    // Avalia a tabela de movimentações
    const tableData = await page.evaluate(() => {
      const table = document.querySelector('#ResultAjax_movimento');
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const columns = Array.from(row.querySelectorAll('td'));
        return columns.slice(0, 9).map(column => column.innerText);
      });
    });
    
    data.Moves = tableData;
    
    logToFile('Resultados da tabela salvos.');
    
    // Salva os dados da tabela em um arquivo JSON
    fs.writeFileSync('resultados.json', JSON.stringify(data, null, 2), 'utf8');

    // Fecha o navegador
    await browser.close();
    logToFile('Navegador fechado. Script concluído.');
  }
  */
 
})();


