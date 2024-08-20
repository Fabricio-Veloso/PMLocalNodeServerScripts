// helpers.js

async function waitForElement(page, selector) {
  try {
      await page.waitForSelector(selector, 5000);
      console.log('Seletor encontrado: ' + selector);
      return true; // Retorna verdadeiro se o seletor for encontrado
  } catch (error) {
      console.log('Timeout atingido: o seletor ' + selector + ' não foi encontrado.');
      return false; // Retorna falso se o seletor não for encontrado
  }
}

// Exporte a função para que ela possa ser usada em outros arquivos
module.exports = { waitForElement };
