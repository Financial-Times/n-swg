// TODO: Implement listener for when swg becomes available (and maybe an event queue should this run before that?).

class SubscribeButton {

  constructor() {
    this.buttons = Array.from(document.querySelectorAll('[data-n-swg-button]'));

    this.bindEvents();
  }

  bindEvents() {
    this.buttons.map((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const sku = e.target.getAttribute('n-swg-button-sku');

        swg.subscribe(sku).then(() => {
          // console.log('success');
          // console.log(arguments);
        }).catch((e) => {
          // console.log('nope');
          // console.log(e);
        });
      });
    });
  }
  
}

module.exports = SubscribeButton;