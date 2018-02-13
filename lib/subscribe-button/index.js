import { swgReady } from '../utils';

class SubscribeButton {

  constructor() {
    this.buttons = Array.from(document.querySelectorAll('[data-n-swg-button]'));
    this.alreadyInitialised = false;
    
    swgReady.then((swg) => {
      this.swgClient = swg;

      this.init();
    });
  }

  init() {
    this.buttons.map((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const sku = e.target.getAttribute('data-n-swg-button-sku');
        const manualInit = e.target.getAttribute('data-n-swg-manual-init');

        if (manualInit && !this.alreadyInitialised) {
          this.swgClient.init('ft.com');
          this.alreadyInitialised = true;
        }

        // this.swgClient.subscribe(sku);
        this.swgClient.subscribe('basic_daily_1');
        // this.swgClient.subscribe('premium_daily_1');
      });
    });
  }
  
}

module.exports = SubscribeButton;