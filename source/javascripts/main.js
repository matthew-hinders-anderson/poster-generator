MEME = {
  $: jQuery,

  render: function() {
    this.canvas && this.canvas.render();
  },

  init: function() {
    this.model = new this.MemeModel(window.MEME_SETTINGS || {});

    // Create renderer view:
    this.canvas = new this.MemeCanvasView({
      el: '#meme-canvas-view',
      model: this.model
    });

    // Create editor view:
    this.editor = new this.MemeEditorView({
      el: '#meme-editor-view',
      model: this.model
    });

    /* Re-render view after all fonts load:
    this.waitForFonts().then(function() {
      MEME.render();
    }); */


    fontDelay = function(){
      console.log('delayed re-render.');
      setTimeout( MEME.render(), 100);
    }
    // Re-render after delay for webfonts
    setTimeout( fontDelay, 2000);
    setTimeout( fontDelay, 4000);
    setTimeout( fontDelay, 10000);
  }
};

MEME.$(function() {
  MEME.init();
});
