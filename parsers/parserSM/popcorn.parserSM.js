// PARSER: 0.3 JSON

(function (Popcorn) {
  Popcorn.parser( "parseSM", function( data ) {

    var dataObj = [];
    data.text.replace( /#([\s\S]*?);/g, function( all, match1 ) {
      match1.replace( /([\s\S]*?):([\s\S]*)/, function( all, smatch1, smatch2 ) {
        dataObj[ smatch1 ] = smatch2;
      });
    });
    
    dataObj.NOTES = dataObj.NOTES.split( ":" );
    dataObj.NOTES[ 5 ] = dataObj.NOTES[ 5 ].split( "," );
    for ( var i = 0; i < dataObj.NOTES[ 5 ].length; i++ ) {
      var notes = [];
      dataObj.NOTES[ 5 ][ i ].replace( /^(\w\w\w\w)$/gm, function( all, match ) {
      
        notes.push( match );
      });
      dataObj.NOTES[ 5 ][ i ] = notes;
    }
    console.log( dataObj );

    // find #BPMS
    var bpms = dataObj.BPMS.split( "=" )[ 1 ];
    //console.log(bpms);
    var beatRate = 60 / bpms;
    //console.log( beatRate * dataObj.NOTES[ 5 ].length );
    var currentBeat = 0;
    
    var measures = data.notes.split( "," );
    
    for ( var i = 0; i < measures.length; i++ ) {
    
      var notes = measures[ i ].split( "\n" );
      
      var noteSize = beatRate / notes.length;
      for ( var j = 0; j < notes.length; j++ ) {
      
        var noteStart = currentBeat;
        var noteEnd = currentBeat + noteSize;
        retObj.data.push({
          start: noteStart,
          end: noteEnd,
          note: notes[ j ]
        });
      }
    }
        
    console.log( retObj.data );
    Popcorn.forEach( dataObj.data, function ( obj, key ) {
      retObj.data.push( obj );
    });

    return retObj;
  });

})( Popcorn );
