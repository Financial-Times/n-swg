let hasClientAlready = !!document.querySelector('#swg-client');

module.exports = () => {
  // Prevent importing more than once.
  if (hasClientAlready) return;
  
  let script = document.createElement('SCRIPT');

  script.src = 'https://subscribe.sandbox.google.com/swglib/swg.js';
  script.async = true;
  script.id = 'swg-client';
  hasClientAlready = true;
  
  document.body.appendChild(script);
};