import importClient from '../swg-client';
let hasClient = false;

module.exports = (selector) => {
  const elementExists = !!document.querySelector(selector);

  if (elementExists && !hasClient) {
    importClient();

    hasClient = true;
  }

  return elementExists;
};