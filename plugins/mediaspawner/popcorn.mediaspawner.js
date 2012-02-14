( function( Popcorn, global ) {

  var processMedia = {
    youtube: function( options ) {
      return Popcorn.youtube( "#" + options._container.id, options.mediaSource );
    },
    vimeo: function( options ){
      return Popcorn.vimeo( options._container.id, options.mediaSource ); 
    },
    soundcloud: function( options ){
      return Popcorn.soundcloud( options._container.id, options.mediaSource );
    }
  };
  Popcorn.plugin( "mediaspawner" , {
    manifest: {
      about: {
        name: "Popcorn Media Spawner Plugin",
        version: "0.1",
        author: "Matthew Schranz, @mjschranz",
        website: "mschranz.wordpress.com"
      },
      options: {
        mediaType: {
          elem: "select",
          options: [ "YOUTUBE", "VIMEO", "SOUNDCLOUD"],
          label: "Media Type:"
        },
        caption: {
          elem: "input",
          type: "text",
          label: "Media Caption:"
        },
        mediaSource: {
          elem: "input",
          type: "text",
          label: "Media Source:"
        },
        target: "tumblr-container",
        start: {
          elem: "input",
          type: "number",
          label: "Start_Time"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End_Time"
        }
      }
    },
    _setup: function( options ) {
      var target = document.getElementById( options.target ),
          validType,
          caption = options.caption || "",
          pop;

      // Valid types of retrieval requests
      validType = function( type ) {
        return ( [ "youtube", "vimeo", "soundcloud" ].indexOf( type ) > -1 );
      };

      // Lowercase the types incase user enters it in another way
      options.mediaType = options.mediaType.toLowerCase();

      !validType( options.mediaType ) && Popcorn.error( "Invalid Media Type.");

      ( !options.mediaSource || !options.target) && Popcorn.error( "Must include a Media Source and target container.");

      // Create seperate container for plugin
      options._container = document.createElement( "div" );
      options._container.id = "mediaSpawnerdiv-" + Popcorn.guid();
      options._container.innerHTML = caption + "<br/>";
      
      document.body.appendChild( options._container );
      options.pop = processMedia[ options.mediaType ]( options );

      options._container.style.display = "none";
      target && target.appendChild( options._container );
    },
    start: function( event, options ){
      if ( options._container ) {
        options._container.style.display = "";
      }
    },
    end: function( event, options ){
      if( options._container ) {
        options._container.style.display = "none";
      }
    },
    _teardown: function( options ){
      document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
    }
  });
})( Popcorn, this );