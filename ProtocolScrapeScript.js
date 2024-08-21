const puppeteer = require('puppeteer');
const { waitForElement } = require('./WaitForSelector.js');

(async () => {

  Codigo_de_protocolo_teste = 200245870;
  
  // Inicia o navegador em modo não-headless (com interface gráfica)
  const browser = await puppeteer.launch({ headless: false });
  
  // Abre uma nova página
  const page = await browser.newPage();
  
  // Navega até a URL especificada
  await page.goto('https://crea-pe.sitac.com.br/app/view/pages/login/login.php#!');
  
  // Procura o elemento de login e senha, caso ele seja encontrado, o campo de login é preenchido.
  if (await waitForElement(page, '#username', 5000)) {
    await page.type('#username', 'fabriciov');
  }
  
  if (await waitForElement(page, '#password', 5000)) {
    await page.type('#password', 'Anderbag@0Sitac');
  }
  
  if (await waitForElement(page, '#submit', 5000)) {
    await page.click('#submit');
  }
  
  
  if (await waitForElement(page, '#logo_fake', 10000)) {
    await page.goto('https://crea-pe.sitac.com.br/app/view/sight/main?form=PesquisarProtocolo');
  }
  
  
  if(await waitForElement(page,'#NUMERO',5000)){
    await page.type('#NUMERO',Codigo_de_protocolo_teste.toString());
  }
  
  
  if(await waitForElement(page,'.botao_ver_todos_dados',5000)){
    await page.click('.botao_ver_todos_dados');
  }
  
  if (await waitForElement(page, '.ESPACAMENTO', 5000)) {
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
  
    console.log(espancamentoData.join('\n')); // Imprime os dados no formato desejado
  }
  


  if(await waitForElement(page,'#ResultAjax_movimento',60000)){
    const tableData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const columns = Array.from(row.querySelectorAll('td'));
        return {
          passo: columns[0]?.innerText,
          usuario_de_origem: columns[1]?.innerText,
          usuario_de_destino: columns[2]?.innerText,
          setor_de_origem: columns[3]?.innerText,
          setor_de_destino: columns[4]?.innerText,
          descricao: columns[5]?.innerText,
          data: columns[6]?.innerText,
          hora: columns[7]?.innerText,
          sigiloso: columns[8]?.innerText,
          verItem: columns[9]?.innerText,
        };
      });
    });
  
    console.log(tableData);
  }
  
   
  
  
  // Fecha o navegador
  //await browser.close();
})();
