// Copyright 2018-2019, University of Colorado Boulder

/**
 * view for a screen that demonstrates views and sounds for components that interact with the model in some way
 *
 * @author John Blanco (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const ABSwitch = require( 'SUN/ABSwitch' );
  const AquaRadioButton = require( 'SUN/AquaRadioButton' );
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const Checkbox = require( 'SUN/Checkbox' );
  const DerivedProperty = require( 'AXON/DerivedProperty' );
  const Dimension2 = require( 'DOT/Dimension2' );
  const HBox = require( 'SCENERY/nodes/HBox' );
  const HSlider = require( 'SUN/HSlider' );
  const Image = require( 'SCENERY/nodes/Image' );
  const inherit = require( 'PHET_CORE/inherit' );
  const NumberPicker = require( 'SCENERY_PHET/NumberPicker' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const Panel = require( 'SUN/Panel' );
  const PhetFont = require( 'SCENERY_PHET/PhetFont' );
  const PlayPauseButton = require( 'SCENERY_PHET/buttons/PlayPauseButton' );
  const Property = require( 'AXON/Property' );
  const Range = require( 'DOT/Range' );
  const ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  const ResetAllSoundGenerator = require( 'TAMBO/sound-generators/ResetAllSoundGenerator' );
  const ScreenView = require( 'JOIST/ScreenView' );
  const SoundClip = require( 'TAMBO/sound-generators/SoundClip' );
  const soundManager = require( 'TAMBO/soundManager' );
  const tambo = require( 'TAMBO/tambo' );
  const Text = require( 'SCENERY/nodes/Text' );
  const TextPushButton = require( 'SUN/buttons/TextPushButton' );
  const Util = require( 'DOT/Util' );
  const VBox = require( 'SCENERY/nodes/VBox' );

  // constants
  const SLIDER_MAX = 5;
  const SLIDER_TRACK_SIZE = new Dimension2( 150, 5 );
  const SLIDER_THUMB_SIZE = new Dimension2( 22, 45 );
  const NUM_TICK_MARKS = SLIDER_MAX + 1;
  const CHECK_BOX_SIZE = 16;
  const FONT = new PhetFont( 16 );
  const NUM_BINS_FOR_CONTINUOUS_SLIDER = 8;
  const BIN_SIZE_FOR_CONTINUOUS_SLIDER = SLIDER_MAX / NUM_BINS_FOR_CONTINUOUS_SLIDER;

  const RADIO_BUTTON_FONT = new PhetFont( 14 );
  const RADIO_BUTTON_RADIUS = 6;

  // images
  const lightningImage = require( 'image!TAMBO/lightning.png' );

  // sounds
  const chargesInBodySound = require( 'sound!TAMBO/charges-in-body-better.mp3' );
  const marimbaSound = require( 'sound!TAMBO/bright-marimba.mp3' );
  const sliderDecreaseClickSound = require( 'sound!TAMBO/slider-click-02.mp3' );
  const sliderIncreaseClickSound = require( 'sound!TAMBO/slider-click-01.mp3' );
  const thunderSound = require( 'sound!TAMBO/thunder.mp3' );
  const pushButtonSounds = [
    require( 'sound!TAMBO/general-button-001.mp3' ),
    require( 'sound!TAMBO/general-button-002.mp3' ),
    require( 'sound!TAMBO/general-button-003.mp3' )
  ];
  const radioButtonSounds = [
    require( 'sound!TAMBO/radio-button-001.mp3' ),
    require( 'sound!TAMBO/radio-button-002.mp3' ),
    require( 'sound!TAMBO/radio-button-003.mp3' )
  ];
  const playPauseSounds = [
    require( 'sound!TAMBO/play-pause-001.mp3' ),
    require( 'sound!TAMBO/play-pause-002.mp3' ),
    require( 'sound!TAMBO/play-pause-003.mp3' ),
    require( 'sound!TAMBO/play-pause-004.mp3' )
  ];

  /**
   * @constructor
   */
  function UIComponentsScreenView( model ) {
    ScreenView.call( this );

    // add a slider with snap-to-ticks behavior
    const discreteSlider = new HSlider( model.discreteValueProperty, new Range( 0, SLIDER_MAX ), {
      trackSize: SLIDER_TRACK_SIZE,
      thumbSize: SLIDER_THUMB_SIZE,
      left: 115,
      top: 115,
      constrainValue: function( value ) {
        return Util.roundSymmetric( value );
      },
      keyboardStep: 1
    } );
    _.times( NUM_TICK_MARKS, function( index ) {
      discreteSlider.addMinorTick( index );
    } );
    this.addChild( discreteSlider );

    // create an inverted version of the reset-in-progress Property, used to mute sounds during reset
    const resetNotInProgressProperty = new DerivedProperty(
      [ model.resetInProgressProperty ],
      function( resetInProgress ) {
        return !resetInProgress;
      }
    );

    // add sound generators that will play a sound when the value controlled by the slider changes
    const sliderIncreaseClickSoundClip = new SoundClip( sliderIncreaseClickSound );
    soundManager.addSoundGenerator( sliderIncreaseClickSoundClip );
    const sliderDecreaseClickSoundClip = new SoundClip( sliderDecreaseClickSound, {
      initiateWhenDisabled: false,
      enableControlProperties: [ resetNotInProgressProperty ]
    } );
    soundManager.addSoundGenerator( sliderDecreaseClickSoundClip );
    model.discreteValueProperty.lazyLink( ( newValue, oldValue ) => {
      if ( newValue > oldValue ) {
        sliderIncreaseClickSoundClip.play();
      }
      else {
        sliderDecreaseClickSoundClip.play();
      }
    } );

    // add an AB switch that will turn on/off a looping sound
    const abSwitch = new ABSwitch(
      model.loopOnProperty,
      false,
      new Text( 'Off', { font: FONT } ),
      true,
      new Text( 'On', { font: FONT } ),
      { switchSize: new Dimension2( 60, 30 ), centerX: discreteSlider.centerX, top: discreteSlider.bottom + 30 }
    );
    this.addChild( abSwitch );

    // add a looping sound that is turned on/off by the switch
    const chargesInBodySoundClip = new SoundClip( chargesInBodySound, { loop: true } );
    soundManager.addSoundGenerator( chargesInBodySoundClip, { associatedViewNode: abSwitch } );
    model.loopOnProperty.link( loopOn => {

      // start the loop the first time the switch is set to the on position
      if ( loopOn && !chargesInBodySoundClip.isPlaying ) {
        chargesInBodySoundClip.play();
      }
      else if ( !loopOn && chargesInBodySoundClip.isPlaying ) {
        chargesInBodySoundClip.stop();
      }
    } );

    // flag that indicates whether slider is being dragged through keyboard interaction
    var sliderBeingDraggedByKeyboard = false;

    // Add a slider with continuous behavior.  We create our own thumb node so that we can observe it.
    const continuousSlider = new HSlider( model.continuousValueProperty, new Range( 0, SLIDER_MAX ), {
      trackSize: SLIDER_TRACK_SIZE,
      thumbSize: SLIDER_THUMB_SIZE,
      thumbFill: '#880000',
      thumbFillHighlighted: '#aa0000',
      left: discreteSlider.left,
      top: abSwitch.bottom + 30,
      startDrag: event => {
        if ( event.type === 'keydown' ) {
          sliderBeingDraggedByKeyboard = true;
        }
      },
      endDrag: () => { sliderBeingDraggedByKeyboard = false; }
    } );
    this.addChild( continuousSlider );

    // Play a sound when certain threshold values are crossed by the continuous Property value, or when a change occurs
    // in the absence of interaction with the slider, since that implies keyboard-driven interaction.
    const marimbaSoundClip = new SoundClip( marimbaSound, { enableControlProperties: [ resetNotInProgressProperty ] } );
    soundManager.addSoundGenerator( marimbaSoundClip );

    // define a function that will play the marimba sound at a pitch value based on the continuous value Property
    function playSoundForContinuousValue() {
      const playbackRate = Math.pow( 2, model.continuousValueProperty.get() / SLIDER_MAX );
      marimbaSoundClip.setPlaybackRate( playbackRate );
      marimbaSoundClip.play();
    }

    model.continuousValueProperty.lazyLink( ( newValue, oldValue ) => {

      function mapValueToBin( value ) {
        return Math.min( Math.floor( value / BIN_SIZE_FOR_CONTINUOUS_SLIDER ), NUM_BINS_FOR_CONTINUOUS_SLIDER - 1 );
      }

      // Play the sound when certain threshold values are crossed or when a change occurs in the absence of mouse/touch
      // interaction with the slider, which implies keyboard-driven interaction.
      if ( sliderBeingDraggedByKeyboard ||
           mapValueToBin( newValue ) !== mapValueToBin( oldValue ) ||
           newValue === 0 && oldValue !== 0 ||
           newValue === SLIDER_MAX && oldValue !== SLIDER_MAX ) {

        playSoundForContinuousValue();
      }
    } );

    // add the button that will cause a lightening bolt to be shown
    const fireLightningButton = new TextPushButton( 'Lightning', {
      font: FONT,
      listener: function() {
        model.lightningBoltVisibleProperty.set( true );
      }
    } );

    // disable button while lightning is visible
    model.lightningBoltVisibleProperty.link( lightningBoltVisible => {
      fireLightningButton.enabled = !lightningBoltVisible;
    } );

    // add a sound generator for thunder
    const thunderSoundClip = new SoundClip( thunderSound, {
      enableControlProperties: [ resetNotInProgressProperty ],
      initiateWhenDisabled: true
    } );
    soundManager.addSoundGenerator( thunderSoundClip );
    model.lightningBoltVisibleProperty.link( visible => {
      if ( visible ) {
        thunderSoundClip.play();
      }
    } );

    // a check box that controls whether the thunderSoundClip sound is locally enabled
    const thunderEnabledCheckbox = new Checkbox(
      new Text( 'Enabled', { font: FONT } ),
      thunderSoundClip.locallyEnabledProperty,
      { boxWidth: CHECK_BOX_SIZE }
    );

    // a check box that controls whether the thunderSoundClip sound can be initiated when disabled
    const initiateThunderWhenDisabledProperty = new BooleanProperty( thunderSoundClip.initiateWhenDisabled );
    initiateThunderWhenDisabledProperty.linkAttribute( thunderSoundClip, 'initiateWhenDisabled' );
    const initiateThunderWhenDisabledCheckbox = new Checkbox(
      new Text( 'Initiate when disabled', { font: FONT } ),
      initiateThunderWhenDisabledProperty,
      { boxWidth: CHECK_BOX_SIZE }
    );

    // create a set of controls for the thunderSoundClip
    const thunderControl = new VBox( {
      children: [
        new Text( 'Thunder: ', { font: new PhetFont( 16 ) } ),
        thunderEnabledCheckbox,
        initiateThunderWhenDisabledCheckbox
      ],
      align: 'left',
      spacing: 8
    } );

    // add a panel where thunderSoundClip and lightning are controlled
    const lightningControlPanel = new Panel(
      new HBox( { children: [ fireLightningButton, thunderControl ], spacing: 14, align: 'top' } ),
      {
        xMargin: 10,
        yMargin: 8,
        fill: '#FCFBE3',
        left: continuousSlider.left,
        top: continuousSlider.bottom + 30
      }
    );

    // add the lightning bolt that will appear when commanded by the user (and make him/her feel like Zeus)
    const lightningBoltNode = new Image( lightningImage, {
      left: lightningControlPanel.left + 25,
      top: lightningControlPanel.bottom - 3,
      maxHeight: 50
    } );

    // add in order for desired layering
    this.addChild( lightningBoltNode );
    this.addChild( lightningControlPanel );

    // only show the lightning when the model indicates - this is done after the panel is created so the layout works
    model.lightningBoltVisibleProperty.linkAttribute( lightningBoltNode, 'visible' );

    // create the button sound clips, which will be fired by the button press
    const pushButtonSoundClips = [];
    pushButtonSounds.forEach( buttonSound => {
      const buttonSoundClip = new SoundClip( buttonSound );
      soundManager.addSoundGenerator( buttonSoundClip );
      pushButtonSoundClips.push( buttonSoundClip );
    } );

    // create a number picker for choosing the button sound
    const selectedPushButtonSoundProperty = new NumberProperty( 1 );
    const soundSetNumberPicker = new NumberPicker(
      selectedPushButtonSoundProperty,
      new Property( new Range( 1, pushButtonSoundClips.length ) ),
      {
        font: new PhetFont( 20 ),
        arrowHeight: 6,
        arrowYSpacing: 6
      }
    );

    // add the button with a label and a sound selector
    const buttonSoundHBox = new HBox( {
      children: [
        new TextPushButton( 'Play Sound', {
          font: new PhetFont( 16 ),
          baseColor: 'lightgreen',
          listener: () => {
            const soundIndex = Math.min( selectedPushButtonSoundProperty.value, pushButtonSoundClips.length ) - 1;
            pushButtonSoundClips[ soundIndex ].play();
          }
        } ),
        new Text( 'Selected Button Sound:', { font: new PhetFont( 16 ) } ),
        soundSetNumberPicker
      ],
      spacing: 10,
      left: lightningControlPanel.right + 60,
      top: discreteSlider.top
    } );
    this.addChild( buttonSoundHBox );

    // create the sounds that can be played on radio box selections
    const radioButtonSoundClips = [];
    radioButtonSounds.forEach( sound => {
      const radioButtonSoundClip = new SoundClip( sound );
      soundManager.addSoundGenerator( radioButtonSoundClip );
      radioButtonSoundClips.push( radioButtonSoundClip );
    } );

    // create a selector for choosing which radio button sound should be used
    const selectedRadioButtonSoundProperty = new NumberProperty( 1 );
    const radioButtonSoundNumberPicker = new NumberPicker(
      selectedRadioButtonSoundProperty,
      new Property( new Range( 1, radioButtonSoundClips.length ) ),
      {
        font: new PhetFont( 20 ),
        arrowHeight: 6,
        arrowYSpacing: 6
      }
    );

    // TODO: I (jbphet) could probably consolidate the code for the radio button groups into a class that creates them

    // function to play a radio button sound based on the selected clip and the radio button index
    const playRadioButtonSound = ( selectionIndex, totalSelections ) => {
      const clip = radioButtonSoundClips[ selectedRadioButtonSoundProperty.value - 1 ];

      // calculate a playback rate that centers around 1 and puts 2 semitones (aka one whole tone) between each sound
      const playbackRate = Math.pow( 2, ( ( totalSelections - 1 ) / 2 - selectionIndex ) * ( 1 / 6 ) );
      clip.setPlaybackRate( playbackRate );
      clip.play();
    };

    const twoRadioButtonSelectorValueProperty = new NumberProperty( 0 );
    twoRadioButtonSelectorValueProperty.lazyLink( value => playRadioButtonSound( value, 2 ) );
    const fiveRadioButtonSelectorValueProperty = new NumberProperty( 0 );
    fiveRadioButtonSelectorValueProperty.lazyLink( value => playRadioButtonSound( value, 5 ) );

    const twoButtonGroupSelectionA = new AquaRadioButton(
      twoRadioButtonSelectorValueProperty,
      0,
      new Text( 'A', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const twoButtonGroupSelectionB = new AquaRadioButton(
      twoRadioButtonSelectorValueProperty,
      1,
      new Text( 'B', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const twoRadioButtonBox = new VBox( {
      children: [
        twoButtonGroupSelectionA,
        twoButtonGroupSelectionB
      ],
      align: 'left',
      spacing: 10
    } );

    const fiveButtonGroupSelectionA = new AquaRadioButton(
      fiveRadioButtonSelectorValueProperty,
      0,
      new Text( 'A', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const fiveButtonGroupSelectionB = new AquaRadioButton(
      fiveRadioButtonSelectorValueProperty,
      1,
      new Text( 'B', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const fiveButtonGroupSelectionC = new AquaRadioButton(
      fiveRadioButtonSelectorValueProperty,
      2,
      new Text( 'C', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const fiveButtonGroupSelectionD = new AquaRadioButton(
      fiveRadioButtonSelectorValueProperty,
      3,
      new Text( 'D', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const fiveButtonGroupSelectionE = new AquaRadioButton(
      fiveRadioButtonSelectorValueProperty,
      4,
      new Text( 'E', { font: RADIO_BUTTON_FONT } ), { radius: RADIO_BUTTON_RADIUS }
    );
    const fiveRadioButtonBox = new VBox( {
      children: [
        fiveButtonGroupSelectionA,
        fiveButtonGroupSelectionB,
        fiveButtonGroupSelectionC,
        fiveButtonGroupSelectionD,
        fiveButtonGroupSelectionE
      ],
      align: 'left',
      spacing: 10
    } );

    // create a panel with the radio button sound selector and the radio button sets
    const radioButtonSoundPanel = new Panel(
      new VBox(
        {
          children: [
            new HBox(
              {
                children: [
                  new Text( 'Selected Sound: ', { font: new PhetFont( 14 ) } ),
                  radioButtonSoundNumberPicker
                ],
                spacing: 10
              },
            ),
            new HBox(
              {
                children: [
                  twoRadioButtonBox,
                  fiveRadioButtonBox
                ],
                spacing: 50
              }
            )
          ],
          spacing: 20
        }
      ),
      {
        fill: '#FCFBE3',
        left: buttonSoundHBox.left,
        top: buttonSoundHBox.bottom + 30
      }
    );
    this.addChild( radioButtonSoundPanel );

    //-----------------------------------------------------------------------------------------------------------------
    // add play/pause sound test
    //-----------------------------------------------------------------------------------------------------------------

    // create the sounds that can be played on radio box selections
    const playPauseSoundClips = [];
    playPauseSounds.forEach( sound => {
      const playPauseSoundClip = new SoundClip( sound );
      soundManager.addSoundGenerator( playPauseSoundClip );
      playPauseSoundClips.push( playPauseSoundClip );
    } );

    // create a number picker for choosing the button sound
    const selectedPlayPauseSoundProperty = new NumberProperty( 1 );
    const playPauseSoundNumberPicker = new NumberPicker(
      selectedPlayPauseSoundProperty,
      new Property( new Range( 1, playPauseSoundClips.length ) ),
      {
        font: new PhetFont( 20 ),
        arrowHeight: 6,
        arrowYSpacing: 6
      }
    );

    const playingProperty = new BooleanProperty( true );
    const playPauseButton = new PlayPauseButton( playingProperty, { radius: 25 } );

    // play the play-pause sound when the playing state changes
    playingProperty.lazyLink( () => {
      const clip = playPauseSoundClips[ selectedPlayPauseSoundProperty.value - 1 ];
      clip.play();
    } );

    const playPauseSoundPanel = new Panel(
      new HBox(
        {
          children: [
            playPauseButton,
            playPauseSoundNumberPicker
          ],
          spacing: 20
        }
      ),
      {
        fill: '#FCFBE3',
        left: radioButtonSoundPanel.left,
        top: radioButtonSoundPanel.bottom + 30
      }
    );
    this.addChild( playPauseSoundPanel );




    // add the reset all button
    const resetAllButton = new ResetAllButton( {
      right: this.layoutBounds.maxX - 25,
      bottom: this.layoutBounds.maxY - 25,
      listener: function() {
        model.reset();
        selectedPushButtonSoundProperty.reset();
        thunderSoundClip.locallyEnabledProperty.reset();
      }
    } );
    this.addChild( resetAllButton );
    soundManager.addSoundGenerator( new ResetAllSoundGenerator( model.resetInProgressProperty ) );
  }

  tambo.register( 'UIComponentsScreenView', UIComponentsScreenView );

  return inherit( ScreenView, UIComponentsScreenView );
} );