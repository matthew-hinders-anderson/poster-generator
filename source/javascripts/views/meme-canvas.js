/*
* MemeCanvasView
* Manages the creation, rendering, and download of the Meme image.
*/
MEME.MemeCanvasView = Backbone.View.extend({

  initialize: function() {
    var canvas = document.createElement('canvas');
    var $container = MEME.$('#meme-canvas');

    // Display canvas, if enabled:
    if (canvas && canvas.getContext) {
      $container.html(canvas);
      this.canvas = canvas;
      this.setDownload();
      this.render();
    } else {
      $container.html(this.$('noscript').html());
    }

    // Listen to model for changes, and re-render in response:
    this.listenTo(this.model, 'change', this.render);
  },

  setDownload: function() {
    var a = document.createElement('a');
    if (typeof a.download == 'undefined') {
      this.$el.append('<p class="m-canvas__download-note">Right-click button and select "Download Linked File..." to save image.</p>');
    }
  },

  render: function() {
    // Return early if there is no valid canvas to render:
    if (!this.canvas) return;

    // Collect model data:
    var m = this.model;
    var d = this.model.toJSON();
    var ctx = this.canvas.getContext('2d');
    var padding = Math.round(d.width * d.paddingRatio);
    var watermarkWidth = m.watermark.width;

    switch (d.aspectRatio) {
      case "us-letter":
        d.width = 824, d.height = 1060;
        padding = Math.round(d.width * d.paddingRatio);
        break;
      case "us-tabloid":
        d.width = 1060, d.height = 1620;
        padding = Math.round(d.width * d.paddingRatio);
        d.fontSize = 150;
        d.eventInfoFontSize = 32;
        d.eventDescriptionFontSize = 22;
        break;
      case "a4":
        d.width = 820, d.height = 1100;
        padding = Math.round(d.width * d.paddingRatio);
        break;
      case "a3":
        d.width = 1100, d.height = 1580;
        padding = Math.round(d.width * d.paddingRatio);
        d.fontSize = 150;
        d.eventInfoFontSize = 32;
        d.eventDescriptionFontSize = 22;
    }

    // Reset canvas display:
    this.canvas.width = d.width;
    this.canvas.height = d.height;
    ctx.clearRect(0, 0, d.width, d.height);

    function renderBackground(ctx) {
      // Base height and width:
      var bh = m.background.height;
      var bw = m.background.width;

      /* user-scalable image
      if (bh && bw) {
        // Transformed height and width:
        // Set the base position if null
        var th = bh * d.imageScale;
        var tw = bw * d.imageScale;
        var cx = d.backgroundPosition.x || d.width / 2;
        var cy = d.backgroundPosition.y || d.height / 2;

        ctx.drawImage(m.background, 0, 0, bw, bh, cx-(tw/2), cy-(th/2), tw, th);
      }
      */
      // Constrain transformed height based on maximum allowed width:
      if (bh && bw) {
        // Calculate watermark maximum width:
        var mw = d.width - d.width*d.paddingRatio;

        // Constrain transformed height based on maximum allowed width:
        if (mw < bw) {
          th = bh * (mw / bw);
          tw = mw;
        }
        ctx.globalAlpha = d.imageOpacity;
        ctx.drawImage(m.background, 0, 0, bw, bh, (d.width-tw)/2, (d.height-th)/2-40, tw, th);
      }
    }

    function renderBackgroundColor(ctx) {
      if (d.backgroundColor) {
        ctx.save();
        ctx.fillStyle = d.backgroundColor;
        ctx.fillRect(0, 0, d.width, d.height);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function renderOverlay(ctx) {
      if (d.overlayColor) {
        ctx.save();
        ctx.globalAlpha = d.overlayAlpha;
        ctx.fillStyle = d.overlayColor;
        ctx.fillRect(0, 0, d.width, d.height);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    var headlineTextBoxHeight = d.fontSize;

    function renderHeadlineText(ctx) {
      var maxWidth = Math.round(d.width * 0.75);
      var x = padding;
      var y = (1.5 * padding) + d.fontSize/2;

      ctx.font = d.fontSize +'pt '+ 'folsom-web';
      ctx.fillStyle = d.fontColor;
      ctx.textBaseline = 'top';

      // Text alignment:
      if (d.textAlign == 'center') {
        ctx.textAlign = 'center';
        x = d.width / 2;

      } else if (d.textAlign == 'right' ) {
        ctx.textAlign = 'right';
        x = d.width - padding;

      } else {
        ctx.textAlign = 'left';
      }

      var words = d.headlineText.split(' ');
      var line  = '';
      var numberOfLines = 1;

      for (var n = 0; n < words.length; n++) {
        var testLine  = line + words[n] + ' ';
        var metrics   = ctx.measureText( testLine );
        var testWidth = metrics.width;
        if ( (testWidth > maxWidth && n > 0) ) {
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += Math.round(d.fontSize * 1.2);
          numberOfLines++;
        } else {
          line = testLine;
        }
        // crude calculation for the height of a multiline text headlineTextBoxHeight
        // replace with metrics.actualBoundingBoxAscent once browser support is good enough
        headlineTextBoxHeight = Math.round(d.fontSize * 1.4 * numberOfLines);
      }
      ctx.fillText(line, x, y);
      ctx.shadowColor = 'transparent';
    }

    function renderDateTimeText(ctx) {
      var maxWidth = Math.round(d.width * 0.75);
      var x = padding;
      var y = padding + headlineTextBoxHeight + d.fontSize/10 + 80;
      //var y = (1.5 * padding) + ( 1 * (d.height / 3) );

      ctx.font = 'bold ' + d.eventInfoFontSize + 'pt "IBM Plex Sans"';
      ctx.fillStyle = d.fontColor;
      ctx.textBaseline = 'top';

      // Text alignment:
      if (d.textAlign == 'center') {
        ctx.textAlign = 'center';
        x = d.width / 2;
      } else if (d.textAlign == 'right' ) {
        ctx.textAlign = 'right';
        x = d.width - padding;
      } else {
        ctx.textAlign = 'left';
      }

      ctx.fillText(d.dateTimeText, x, y);
      ctx.shadowColor = 'transparent';
    }

    function renderLocationText(ctx) {
      var maxWidth = Math.round(d.width * 0.75);
      var x = padding;
      var y = padding + headlineTextBoxHeight + d.fontSize/10 + 80 + d.eventInfoFontSize*2;

      ctx.font =  d.eventInfoFontSize + 'pt "IBM Plex Sans"';
      ctx.fillStyle = d.fontColor;
      ctx.textBaseline = 'top';

      // Text alignment:
      if (d.textAlign == 'center') {
        ctx.textAlign = 'center';
        x = d.width / 2;
      } else if (d.textAlign == 'right' ) {
        ctx.textAlign = 'right';
        x = d.width - padding;
      } else {
        ctx.textAlign = 'left';
      }

      ctx.fillText(d.locationText, x, y);
      ctx.shadowColor = 'transparent';
    }

    function renderLocationTwoText(ctx) {
      var maxWidth = Math.round(d.width * 0.75);
      var x = padding;
      var y = padding + headlineTextBoxHeight + d.fontSize/10 + 80 + d.eventInfoFontSize*4 + 30;

      ctx.font = d.eventDescriptionFontSize +'pt "IBM Plex Sans"';
      ctx.fillStyle = d.fontColor;
      ctx.textBaseline = 'top';

      // Text alignment:
      if (d.textAlign == 'center') {
        ctx.textAlign = 'center';
        x = d.width / 2;
      } else if (d.textAlign == 'right' ) {
        ctx.textAlign = 'right';
        x = d.width - padding;
      } else {
        ctx.textAlign = 'left';
      }

      var words = d.locationTwoText.split(' ');
      var line  = '';
      var numberOfLines = 1;

      for (var n = 0; n < words.length; n++) {
        var testLine  = line + words[n] + ' ';
        var metrics   = ctx.measureText( testLine );
        var testWidth = metrics.width;
        if ( (testWidth > maxWidth && n > 0) ) {
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += Math.round(d.eventDescriptionFontSize * 2.15);
          numberOfLines++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    }


    function renderWebsiteUrlText(ctx) {
      var maxWidth = Math.round(d.width * 0.75);
      var x = padding + watermarkWidth + 40;
      var y = d.height - padding - 5;

      ctx.font =  '18pt katwijk-mono-web';
      ctx.fillStyle = d.fontColor;
      ctx.textBaseline = 'baseline';

      // Text alignment:
      if (d.textAlign == 'center') {
        ctx.textAlign = 'center';
        x = d.width / 2;
      } else if (d.textAlign == 'right' ) {
        ctx.textAlign = 'right';
        x = d.width - padding;
      } else {
        ctx.textAlign = 'left';
      }

      var words = d.websiteUrlText.split(' ');
      var line  = '';

      for (var n = 0; n < words.length; n++) {
        var testLine  = line + words[n] + ' ';
        var metrics   = ctx.measureText( testLine );
        var testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += Math.round(d.fontSize * 1.9);
        } else {
          line = testLine;
        }
      }

      ctx.fillText(line, x, y);
      ctx.shadowColor = 'transparent';
    }

    function renderCredit(ctx) {
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillStyle = d.fontColor;
      ctx.font = 'normal '+ d.creditSize +'pt '+ d.fontFamily;
      ctx.fillText(d.creditText, padding, d.height - padding);
    }


    function renderWatermark(ctx) {
      // Base & transformed height and width:
      var bw, bh, tw, th;
      bh = th = m.watermark.height;
      watermarkWidth = bw = tw = m.watermark.width;

      if (bh && bw) {
        // Calculate watermark maximum width:
        var mw = d.width * d.watermarkMaxWidthRatio;

        // Constrain transformed height based on maximum allowed width:
        if (mw < bw) {
          th = bh * (mw / bw);
          watermarkWidth = tw = mw;
        }
        ctx.globalAlpha = d.watermarkAlpha;
        ctx.drawImage(m.watermark, 0, 0, bw, bh, padding-22, d.height-padding/2-th+10, tw, th);
        ctx.globalAlpha = 1;
      }
    }

    renderBackground(ctx);
    renderOverlay(ctx);
    renderBackgroundColor(ctx);
    renderWatermark(ctx);

    renderHeadlineText(ctx);
    renderDateTimeText(ctx);
    renderLocationText(ctx);
    renderLocationTwoText(ctx);
    renderWebsiteUrlText(ctx);

    //renderCredit(ctx);


    var data = this.canvas.toDataURL(); //.replace('image/png', 'image/octet-stream');
    this.$('#meme-download').attr({
      'href': data,
      'download': (d.downloadName || 'share') + '.png'
    });

    // Enable drag cursor while canvas has artwork:
    this.canvas.style.cursor = this.model.background.width ? 'move' : 'default';
  },

  events: {
    'mousedown canvas': 'onDrag'
  },

  // Performs drag-and-drop on the background image placement:
  onDrag: function(evt) {
    evt.preventDefault();

    // Return early if there is no background image:
    if (!this.model.hasBackground()) return;

    // Configure drag settings:
    var model = this.model;
    var d = model.toJSON();
    var iw = model.background.width * d.imageScale / 2;
    var ih = model.background.height * d.imageScale / 2;
    var origin = {x: evt.clientX, y: evt.clientY};
    var start = d.backgroundPosition;
    start.x = start.x || d.width / 2;
    start.y = start.y || d.height / 2;

    // Create update function with draggable constraints:
    function update(evt) {
      evt.preventDefault();
      model.set('backgroundPosition', {
        x: Math.max(d.width-iw, Math.min(start.x - (origin.x - evt.clientX), iw)),
        y: Math.max(d.height-ih, Math.min(start.y - (origin.y - evt.clientY), ih))
      });
    }

    // Perform drag sequence:
    var $doc = MEME.$(document)
      .on('mousemove.drag', update)
      .on('mouseup.drag', function(evt) {
        $doc.off('mouseup.drag mousemove.drag');
        update(evt);
      });
  }
});
