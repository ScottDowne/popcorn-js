(function ( Popcorn ) {

  function makeDoctypeTag(doctype) {
    if (!doctype)
      return '';
    var tag = '<!DOCTYPE ' + doctype.name;
    if (doctype.publicId.length)
      tag += ' PUBLIC "' + doctype.publicId + '"';
    if (doctype.systemId.length)
      tag += ' "' + doctype.systemId + '"';
    return tag += '>';
  }
  var morphElementIntoDialog = function(options) {
    var input = options.input;
    var element = options.element;
    var body = options.body || document.body;
    var url = options.url;
    var overlay = $(element).overlayWithTagColor(1.0);
    var backdrop = $('<div class="webxray-base webxray-dialog-overlay">' +
                     '</div>');

    // Closing the dialog we make later will re-activate this for us.
    input.deactivate();

    $(body).append(backdrop);
    overlay.addClass('webxray-topmost');
    overlay.animate(jQuery.getModalDialogDimensions(), function() {
      var dialog = jQuery.modalDialog({
        input: input,
        body: body,
        url: url
      });
      
      backdrop.remove();

      dialog.iframe.one("load", function onLoad() {
        overlay.fadeOut(function() {
          overlay.remove();
          options.onLoad(dialog);
        });
      });        
    });
  };
  var morphDialogIntoElement = function(options) {
    var element = options.element;
    var dialog = options.dialog;
    var input = options.input;
    var overlay = dialog.iframe.overlay();
    
    overlay.applyTagColor(element, 1.0);
    overlay.hide();
    overlay.fadeIn(function() {
      dialog.close(function() {
        // input was just re-activated when the dialog closed, but
        // we want to deactivate it again because we're not actually
        // done with our transition.
        input.deactivate();
        overlay.resizeTo(element, function() {
          $(this).fadeOut(function() {
            $(this).remove();
            input.activate();
          });
          options.onDone();
        });
      });
    });
  };

  Popcorn.plugin.debug = true;
  var jQueryReady = false;
  
  Popcorn.plugin( "goggles" , {

    manifest: {},
    _setup: function( options ) {
    
      var self = this;
      var scriptReady = function() {

        jQuery.fn.extend({
          uprootIgnoringWebxray: function(cb) {
            $(document).uproot({
              success: cb,
              ignore: $(".webxray-hud-box, .webxray-overlay, " +
                        ".webxray-dialog-overlay, link.webxray, " +
                        "#webxray-is-active, .webxray-toolbar, " +
                        ".webxray-style-info, .webxray-tmsg-overlay")
            });
          },
          uproot: function(cb) {
            var options = {
              ignore: $()
            };
            if (typeof(cb) == 'object') {
              options = cb;
              cb = options.success;
            }
            var elem = this[0];
            var document = elem.contentDocument || elem;
            if (document.nodeName != "#document")
              throw new Error("first item of query must be a document or iframe");
            var base = document.createElement('base');
            if ($('base', document).length == 0) {
              $(base).attr('href', document.location.href);
              $(document.head).prepend(base);
            }
            if (cb)
              setTimeout(function() {
                var ignore = options.ignore.add('script', document);
                //var removal = ignore.temporarilyRemove();
                var doctype = makeDoctypeTag(document.doctype);
                var html = doctype + '\n<html>' +
                           document.documentElement.innerHTML + '</html>';
                var head = document.head.innerHTML;
                var body = document.body.innerHTML;
                //removal.undo();
                $(base).remove();
                cb.call(elem, html, head, body);
              }, 0);
          }
        });
        jQuery.fn.extend({
          // Turns all URLs in src and href attributes into absolute URLs
          // if they're not already.
          absolutifyURLs: function() {
            var URL_PROPS = ['href', 'src'];
            this.find('*').andSelf().each(function() {
              var self = this;
              URL_PROPS.forEach(function(name) {
                if (name in self && self[name]) {
                  $(self).attr(name, self[name]);
                }
              });
            });
            return this;
          },
          // returns whether at least one of the matched elements is a
          // void element (i.e., has no closing tag).
          isVoidElement: function() {
            // Taken from:
            // http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
            return this.is("area, base, br, col, command, embed, hr, img, " +
                           "input, keygen, link, meta, param, source, " +
                           "track, wbr");
          },
          // works much like jQuery's html() with no arguments, but
          // includes HTML code for the matched elements themselves.
          // unlike jQuery, this will include all matched elements.
          outerHtml: function outerHtml() {
            var clonedElement = this.clone();
            var trivialParent = $('<div></div>').append(clonedElement);
            return trivialParent.html();
          },
          // Given a descendant on the first matched element, returns a CSS
          // selector that uniquely selects only the descendant from the
          // first matched element.
          pathTo: function pathTo(descendant) {
            var root = this[0];
            var target = $(descendant).get(0);
            var parts = [];

            for (var node = target; node && node != root; node = node.parentNode) {
              var n = $(node).prevAll(node.nodeName.toLowerCase()).length + 1;
              var id = $(node).attr("id");
              var className = $(node).attr("class");
              var selector = node.nodeName.toLowerCase();

              // Class and id parts are based on jQuery-GetPath code.
              if (typeof(id) != "undefined" && id.length)
                selector += "#" + id;
              if (typeof(className) != "undefined" && className.length)
                selector += "." + jQuery.trim(className).split(/[\s\n]+/).join('.');

              selector += ':nth-of-type(' + n + ')';
              parts.push(selector);
            }
            
            parts.reverse();
            return ' > ' + parts.join(' > ');
          },

          // Temporarily remove the set of matched elements,
          // returning a removal object with one method,
          // undo(), that can be used to undo the removal.
          temporarilyRemove: function temporarilyRemove() {
            var undoers = [];
            jQuery.each(this, function(i, element) {
              var document = element.ownerDocument;
              var replacer = document.createTextNode('');
              element.parentNode.replaceChild(replacer, element);
              undoers.push(function() {
                replacer.parentNode.replaceChild(element, replacer);
              });
            });
            return {
              undo: function undo() {
                jQuery.each(undoers, function(i, undoer) {
                  undoer();
                });
                undoers = null;
              }
            };
          },
          
          // Return the nth ancestor of the first matched element.
          ancestor: function ancestor(generation) {
            var ancestor = this[0];
            
            for (var i = 0; i < generation; i++)
              if (ancestor.parentNode)
                ancestor = ancestor.parentNode;
              else
                return null;

            return $(ancestor);
          },
          // Create and return a div that floats above the first
          // matched element.
          overlay: function overlay() {
            var pos = this.offset();
            var body = this.get(0).ownerDocument.body;
            var overlay = $('<div class="webxray-base webxray-overlay">' +
                            '&nbsp;</div>');
            overlay.css({
              top: pos.top,
              left: pos.left,
              height: this.outerHeight(),
              width: this.outerWidth()
            });
            $(body).append(overlay);

            return overlay;
          },
          // Like jQuery.append(), but accepts an arbitrary number of arguments,
          // and automatically converts string arguments into text nodes.
          emit: function emit() {
            for (var i = 0; i < arguments.length; i++) {
              var arg = arguments[i];
              if (typeof(arg) == "string")
                arg = document.createTextNode(arg);
              this.append(arg);
            }
          },
          // Resizes and repositions the currently matched element to
          // match the size and position of the given target by animating
          // it and then executing the given callback.
          resizeTo: function resizeTo(target, cb) {
            var overlay = this;

            var hasNoStyle = $(target).attr('style') === undefined;
            var pos = $(target).offset();
            overlay.animate({
              top: pos.top,
              left: pos.left,
              height: $(target).outerHeight(),
              width: $(target).outerWidth()
            }, cb);
            if (hasNoStyle && $(target).attr('style') == '')
              $(target).removeAttr('style');
          },
          // Resizes and repositions the currently matched element to
          // match the size and position of the given target by animating
          // it, then fades out the currently matched element and
          // removes it from the DOM.
          resizeToAndFadeOut: function resizeToAndFadeOut(target) {
            this.resizeTo(target, function() {
              $(this).fadeOut(function() { $(this).remove(); });
            });
          },
          // Removes the class and, if the class attribute is now empty, 
          // removes the attribute as well (jQuery remove class does not)..
          reallyRemoveClass: function reallyRemoveClass(classname) {
            this.removeClass(classname).filter('[class=""]').removeAttr('class');
            return this;
          }
        });
        
        jQuery.fn.extend({
          postMessage: function(message, targetOrigin) {
            if ((jQuery.browser.mozilla && typeof(self) == "object" &&
                 self.port && self.port.emit) ||
                (typeof(chrome) == "object" && chrome.extension)) {
              // We're most likely in a Jetpack, and need to work around
              // bug 666547. Or, we're in a Chrome extension and are
              // stymied by http://stackoverflow.com/q/4062879.

              if (!this.attr("id"))
                // Likelyhood of a naming collision here is very low,
                // and it's only a temporary workaround anyways.
                this.attr("id", "webxray-iframe-" + Math.random());

              var script = document.createElement("script");

              script.text = "(" + (function(id, message) {
                var iframe = document.getElementById(id);
                iframe.contentWindow.postMessage(message, "*");
              }).toString() + ")(" + JSON.stringify(this.attr("id")) + ", " +
              JSON.stringify(message) + ");";

              document.body.appendChild(script);
              document.body.removeChild(script);
            } else {
              this[0].contentWindow.postMessage(message, targetOrigin);
            }
          }
        });

        options.div = $('<div class="webxray-base webxray-dialog-overlay">' +
                    '<div class="webxray-base webxray-dialog-outer">' +
                    '<div class="webxray-base webxray-dialog-middle">' +
                    '<div class="webxray-base webxray-dialog-inner">' +
                    '<iframe class="webxray-base" src="http://labs.toolness.com/temp/webxray-dev/easy-remix-dialog/index.html"></iframe>' +
                    '</div></div></div></div>');

        

        var iframe = options.div.find("iframe");
        
        function onMessage(event) {
          if (event.source == iframe.get(0).contentWindow) {
          
            options.div.fadeOut( 400, function() {
              options.div.remove();
              options.play && self.media.play();
              options.play = false;
            });
          }
        }

        window.addEventListener("message", onMessage, false);
        
        iframe[ 0 ].addEventListener( "load", function() {
            $(document).uprootIgnoringWebxray(function (html, head, body) {

              iframe.postMessage(JSON.stringify({
                languages: ["en", "en-us"], // this is temporary, need to check the docs on popcorn.locale
                startHTML: {
                  head: head,
                  body: body,
                  selector: $(document.body).pathTo( document.getElementById( options.target ) )
                },
                baseURI: document.location.href
              }), "*");
            });
        }, false );

        jQueryReady = true;
      };

      if ( !window.jQuery && !window.$ ) {

        Popcorn.getScript( "http://code.jquery.com/jquery-1.7.1.min.js", scriptReady );
      } else {

        scriptReady();
      }
    },
    start: function( event, options ){
      
      var self = this;
      if ( options.pause && !this.media.paused ) {
      
        options.play = true;
        this.media.pause();
      }
      if ( options.pause > 0 ) {

        //this.media.pause();
        setTimeout( function() {
        
          options.div.fadeOut( 400, function() {

            options.div.remove();
            options.play && self.media.play();
            options.play = false;
          });
        }, options.pause * 1000 );
      }
      $(document.body).append( options.div );
      options.div.hide();
      options.div.fadeIn( 400 );
    },
    end: function( event, options ){

      options.div.fadeOut( 400, function() {
        options.div.remove();
      });
    },
    _teardown: function( options ) {
    
      // meep?
    }
  });

})( Popcorn );
