import { swgReady } from './utils';

class SubscribeButton {

  constructor() {
    this.buttons = Array.from(document.querySelectorAll('[data-n-swg-button]'));
    
    swgReady.then((swg) => {
      this.swgClient = swg;

      this.init();
    });
  }

  init() {
    this.buttons.map((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const sku = e.target.getAttribute('n-swg-button-sku');

        this.swgClient.subscribe(sku);
      });
    });
  }
  
}

module.exports = SubscribeButton;