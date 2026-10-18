import {initializeTermPanel} from './term-panel.js';

const main = document.querySelector('main');
if (main) {
  for (const link of main.querySelectorAll('.course-keywords [data-open-term]')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', 'term-panel');
    link.setAttribute('aria-expanded', 'false');
  }
  initializeTermPanel({main, modal: true});
  document.body.classList.add('home-terms-ready');
}
