(function ( Popcorn ) {

  Popcorn.plugin.debug = true;
  var appended = 0;
  
  Popcorn.plugin( "goggles" , {

    manifest: {},
    _setup: function( options ) {

	
    },
    start: function( event, options ){
    
      if ( appended++ <= 0 ) {

        var script = document.createElement( "script" );
        script.src = "http://labs.toolness.com/temp/webxray-dev/webxray.js";
        script.className = "webxray";
        document.head.appendChild( script );
      }
    },
    end: function( event, options ){
    
      if ( --appended <= 0 ) {

        webxrayUI && webxrayUI.emit( "quit" );
      }
    },
    _teardown: function( options ) {
    
      
    }
  });

})( Popcorn );
