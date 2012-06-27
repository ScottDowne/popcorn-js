Popcorn.player( "remixer", {
  _canPlayType: function( nodeName, url ) {

    return ( typeof url !== "string" & url.length >= 1 );
  },
  _setup: function( options ) {

    var i = 0,
        varps = [],
        media = this,
        loaded = 0,
        loading = 0,
        containerPrime = document.getElementById( media.id ),
        duration = 0,
        durOffset = 0,
        currentPlayer = 0,
        currentTime = 0,
        paused = true,
        seeking = false,
        childContainer,
        playerQueue = Popcorn.player.playerQueue();

    var play = function() {

      paused = false;
      media.dispatchEvent( "play" );
      media.dispatchEvent( "playing" );
      playerQueue.next();
    };

    var pause = function() {

      paused = true;
      media.dispatchEvent( "pause" );
      playerQueue.next();
    };

    var timeUpdate = function() {

      currentTime = durOffset + this.currentTime();
      media.dispatchEvent( "timeupdate" );
      playerQueue.next();
    };

    var ended = function() {

      if ( varps[ currentPlayer + 1 ] ) {

        seekTo( currentTime + 1 );
        varps[ currentPlayer ].popcorn.play();
      } else {
        media.dispatchEvent( "ended" );
      }
    };

    var toggleEvents = function( eventFunction ) {

      eventFunction.call( varps[ currentPlayer ].popcorn, "play", play );
      eventFunction.call( varps[ currentPlayer ].popcorn, "pause", pause );
      eventFunction.call( varps[ currentPlayer ].popcorn, "timeupdate", timeUpdate );
      eventFunction.call( varps[ currentPlayer ].popcorn, "ended", ended );
    };

    var setPlayer = function( index ) {

      var state = varps[ currentPlayer ].popcorn.paused();

      varps[ currentPlayer ].popcorn.media.style.height = "0px";
      varps[ currentPlayer ].popcorn.media.style.width = "0px";
      varps[ currentPlayer ].popcorn.media.style.visibility = "hidden";

      toggleEvents( varps[ currentPlayer ].popcorn.off );
      currentPlayer = index;
      toggleEvents( varps[ currentPlayer ].popcorn.on );

      varps[ currentPlayer ].popcorn.media.style.height = media.offsetHeight + "px";
      varps[ currentPlayer ].popcorn.media.style.width = media.offsetWidth + "px";
      varps[ currentPlayer ].popcorn.media.style.visibility = "visible";

      if ( state ) {
        varps[ currentPlayer ].popcorn.pause();
      } else {
        varps[ currentPlayer ].popcorn.play();
      }
    };

    var seekTo = function( time ) {

      durOffset = 0;

      for ( i = 0; i < varps.length; i++ ) {

        if ( time < durOffset + varps[ i ].popcorn.duration() ) {

          if ( i !== currentPlayer ) {

            setPlayer( i );
          }

          varps[ currentPlayer ].popcorn.currentTime( time - durOffset );
          return;
        }

        durOffset += varps[ i ].popcorn.duration();
      }
    };

    Popcorn.player.defineProperty( media, "currentTime", {
      set: function( val ) {

        if ( options.destroyed ) {
          return;
        }

        seeking = true;
        // make sure val is a number
        currentTime = Math.round( +val * 100 ) / 100;
        seekTo( currentTime );
      },
      get: function() {

        return currentTime;
      }
    });

    Popcorn.player.defineProperty( media, "paused", {
      get: function() {

        return paused;
      }
    });

    media.play = function() {

      if ( options.destroyed ) {

        return;
      }

      paused = false;
      playerQueue.add(function() {

        if ( varps[ currentPlayer ].popcorn.paused() ) {

          seeking = false;
          varps[ currentPlayer ].popcorn.play();
        } else {
          playerQueue.next();
        }
      });
    };

    media.pause = function() {

      if ( options.destroyed ) {

        return;
      }

      paused = true;
      playerQueue.add(function() {

        if ( !varps[ currentPlayer ].popcorn.paused() ) {

          varps[ currentPlayer ].popcorn.pause();
        } else {
          playerQueue.next();
        }
      });
    };

    for ( i = 0; i < media.src.length; i++ ) {

      childContainer = document.createElement( "div" );
      childContainer.id = Popcorn.guid( "remixer" );
      childContainer.style.visibility = "hidden";
      childContainer.style.height = containerPrime.offsetHeight + "px";
      childContainer.style.width = containerPrime.offsetWidth + "px";
      containerPrime.appendChild( childContainer );

      loading++;
      varps.push( { popcorn: Popcorn.smart( "#" + childContainer.id, media.src[ i ] ) } );
      varps[ varps.length - 1 ].popcorn.on( "canplaythrough", function( e ) {

        this.controls( false );
        // this is the varps, and not the remixer media.
        duration += this.duration();

        if ( ++loaded === loading ) {

          media.duration = duration;
          setPlayer( currentPlayer );

          media.dispatchEvent( "durationchange" );
          media.dispatchEvent( "loadedmetadata" );
          media.dispatchEvent( "loadeddata" );
          media.readyState = 4;
          media.dispatchEvent( "canplaythrough" );
        }
      });
    }
  },
  _teardown: function( options ) {

  }
});
