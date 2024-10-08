const puppeteer = require('puppeteer');
const fs = require('fs'); // Importa o módulo fs para manipulação de arquivos
require('dotenv').config();


const PROTOCOL_INFO_PATH = "./resultados.json";
const SCRAPE_LOG_PATH = "./Logs/FullScrape_log.txt"
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
  
  const Codigo_de_protocolo_Para_Pesquisar = process.argv.slice(2);;
  
  if (!Codigo_de_protocolo_Para_Pesquisar) {
    console.error('Erro: Código de protocolo não fornecido.');
    process.exit(1);
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
  
  if (await waitForElement(page, '#logo_fake', 10000)) {
    await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocolo');
    logToFile('Navegando para a página de pesquisa de protocolo.');
  }
  
  foreach(protocoloParaPesquisar in codigo_de_protocolo_Para_Pesquisar){
  
    if(await waitForElement(page,'#NUMERO',5000)){
      await page.type('#NUMERO', protocoloParaPesquisar.toString());
      logToFile(`Número de protocolo ${protocoloParaPesquisar} inserido.`);
    }
    
    if(await waitForElement(page,'.botao_ver_todos_dados',5000)){
      await page.click('.botao_ver_todos_dados');
      logToFile('Botão para ver todos os dados clicado.');
    }
    
    if (await waitForElement(page, '.ESPACAMENTO', 5000)) {
      const espancamentoData = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('.ESPACAMENTO'));
  
          return elements.map(element => {
              const roleElement = element.querySelector('.listar_label_valor label');
              const infoElement = element.querySelector('.cad_form_cont_campobox .listar_label_result') || 
                                 element.querySelector('.cad_form_cont_campo .listar_label_result'); // Busca em ambas as classes
              
              // Verifica se roleElement e infoElement existem
              if (roleElement && infoElement) {
                  const roleText = roleElement.innerText.trim();
                  const infoText = infoElement.innerText.trim();
  
                  // Verifica se o roleElement é "Descrição: "
                  if (roleText === "Descrição: ") {
                      return infoText.length > 2 ? infoText : "Sem Descrição";
                  } 
                  
                  // Verifica se roleElement e infoText não estão vazios
                  if (roleText && infoText) {
                      return `${roleText}: ${infoText}`;
                  }
              }
          }).filter(item => item);
      });
  
      // Armazena os dados do cabeçalho na variável data
      if (espancamentoData.length > 0) {
          data.Header = espancamentoData;
      }
    }
  
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
      
      // Salva os dados da tabela em um arquivo JSON OU envia-los por webscoket
      fs.writeFileSync('resultados.json', JSON.stringify(data, null, 2), 'utf8');
  
    }
  
    await browser.close();
    logToFile('Navegador fechado. Script concluído.');
  }
  
  
})();