import ArrowTooltip from './components/ArrowTooltip.vue';
import IconButton from './components/IconButton.vue';
import InlineEdit from './components/InlineEdit.vue';

export default {
  install(app) {
    app.component('ArrowTooltip', ArrowTooltip);
    app.component('IconButton', IconButton);
    app.component('InlineEdit', InlineEdit);
  },
};
