module.exports = () => {
  let script = document.createElement('SCRIPT');

  script.src = 'https://subscribe.sandbox.google.com/swglib/swg.js';
  script.async = true;
  
  document.body.appendChild(script);
};