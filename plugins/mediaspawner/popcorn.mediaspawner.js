( function( Popcorn, global ) {

  var processMedia = {
    youtube: function( options ) {
      Popcorn.youtube( "#" + options._container.id, options.mediaSource );
    },
    vimeo: function( options ){
      Popcorn.vimeo( options._container.id, options.mediaSource ); 
    },
    soundcloud: function( options ){
      Popcorn.soundcloud( options._container.id, options.mediaSource );
    },
    image: function( options ){
      var img = document.createElement("img"),
          link = document.createElement("a");
      
      img.setAttribute( "src", options.mediaSource );
      link.setAttribute( "href", options.mediaSource );
      link.setAttribute( "target", "_blank" );
      link.appendChild( img );

      options._container.appendChild( link );
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
          options: [ "YOUTUBE", "VIMEO", "SOUNDCLOUD", "IMAGE"],
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
        return ( [ "youtube", "vimeo", "soundcloud", "image" ].indexOf( type ) > -1 );
      };

      // Lowercase the types incase user enters it in another way
      options.mediaType = options.mediaType.toLowerCase();

      !validType( options.mediaType ) && Popcorn.error( "Invalid Media Type.");

      ( !options.mediaSource || !options.target) && Popcorn.error( "Must include a Media Source and target container.");

      // Create seperate container for plugin
      options._container = document.createElement( "div" );
      options._container.id = "mediaSpawnerdiv-" + Popcorn.guid();
      options._container.innerHTML = "<p>" + caption + "</p>";
      
      document.body.appendChild( options._container );
      processMedia[ options.mediaType ]( options );

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