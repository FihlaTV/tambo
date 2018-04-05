// Copyright 2018, University of Colorado Boulder

/**
 * main file for the tambo library demo and test harness
 */
define( function( require ) {
  'use strict';

  // modules
  var BooleanProperty = require( 'AXON/BooleanProperty' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var Property = require( 'AXON/Property' );
  var RadialGradient = require( 'SCENERY/util/RadialGradient' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Screen = require( 'JOIST/Screen' );
  var Sim = require( 'JOIST/Sim' );
  var SimLauncher = require( 'JOIST/SimLauncher' );
  var SimLikeComponentsModel = require( 'TAMBO/demo/sim-like-components/model/SimLikeComponentsModel' );
  var SimLikeComponentsScreenView = require( 'TAMBO/demo/sim-like-components/view/SimLikeComponentsScreenView' );
  var SonificationManager = require( 'TAMBO/SonificationManager' );
  var StringProperty = require( 'AXON/StringProperty' );
  var UiComponentsModel = require( 'TAMBO/demo/ui-components/model/UiComponentsModel' );
  var UiComponentsScreenView = require( 'TAMBO/demo/ui-components/view/UiComponentsScreenView' );

  // strings
  var tamboTitleString = require( 'string!TAMBO/tambo.title' );

  var simOptions = {
    credits: {
      leadDesign: 'John Blanco'
    }
  };

  // initialize the sonification manager
  SonificationManager.createInstance(
    // TODO: These properties are essentially stubbed for now, should be populated with the real things
    new BooleanProperty( false ),
    new BooleanProperty( true ),
    new StringProperty( 'enhanced' )
  );

  function createScreenIcon( color1, color2, gradientType ) {

    var colorGradient;
    if ( gradientType === 'radial' ) {
      colorGradient = new RadialGradient(
        Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width / 2,
        Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height / 2,
        0,
        Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width / 2,
        Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height / 2,
        Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width * 0.67
      ).addColorStop( 0, color1 ).addColorStop( 1, color2 );
    }
    else {
      colorGradient = new LinearGradient( 0, 0, Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width, 0 )
        .addColorStop( 0, color1 )
        .addColorStop( 1, color2 );
    }

    return new Rectangle(
      0,
      0,
      Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width,
      Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height,
      { fill: colorGradient }
    );
  }

  SimLauncher.launch( function() {
    new Sim( tamboTitleString, [

      // sim-like components screen
      new Screen(
        function() { return new SimLikeComponentsModel(); },
        function( model ) { return new SimLikeComponentsScreenView( model ); },
        {
          name: 'Sim-Like Components',
          backgroundColorProperty: new Property( '#f3fff3' ),
          homeScreenIcon: createScreenIcon( '#a31515', '#b75e2a', 'radial' )
        }
      ),

      // UI-components screen
      new Screen(
        function() { return new UiComponentsModel(); },
        function( model ) { return new UiComponentsScreenView( model ); },
        {
          name: 'UI Components',
          backgroundColorProperty: new Property( '#fff5ba' ),
          homeScreenIcon: createScreenIcon( '#71ddbf', '#8d49e5', 'linear' )
        }
      )

      // screen with global controls for sonification
      // TODO: add this

    ], simOptions ).start();
  } );
} );