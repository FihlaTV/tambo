// Copyright 2018, University of Colorado Boulder

/**
 * white noise generator with optional low- and high-pass filters
 *
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var SoundGenerator = require( 'TAMBO/sound-generators/SoundGenerator' );
  var tambo = require( 'TAMBO/tambo' );

  // constants
  var NOISE_BUFFER_SECONDS = 2;
  var PARAMETER_CHANGE_TIME_CONSTANT = 0.015;
  var LFO_DEPTH_CHANGE_TIME_CONSTANT = 0.05;

  /**
   * @constructor
   */
  function NoiseGenerator( options ) {

    // set up options using default values, see base class for additional options
    options = _.extend( {
      noiseType: 'white', // valid values are 'white', 'pink', and 'brown'
      lowPassCutoffFrequency: null,
      highPassCutoffFrequency: null,
      centerFrequency: null,
      lfoInitiallyEnabled: false,
      lfoInitialFrequency: 2, // Hz
      lfoInitialDepth: 1, // valid values are from 0 to 1
      lfoType: 'sine',
      Q: null
    }, options );

    SoundGenerator.call( this, options );

    var now = this.audioContext.currentTime;

    // if specified, create the low-pass filter
    var lowPassFilter;
    if ( options.lowPassCutoffFrequency ) {
      lowPassFilter = this.audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime( options.lowPassCutoffFrequency, now );
    }

    // if specified, create the high-pass filter
    var highPassFilter;
    if ( options.highPassCutoffFrequency ) {
      highPassFilter = this.audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.setValueAtTime( options.highPassCutoffFrequency, now );
    }

    // if specified, create the band-pass filter
    if ( options.Q && options.centerFrequency ) {
      this.bandPassFilter = this.audioContext.createBiquadFilter();
      this.bandPassFilter.type = 'bandpass';
      this.bandPassFilter.frequency.setValueAtTime( options.centerFrequency, now );
      this.bandPassFilter.Q.setValueAtTime( options.Q, now );
    }

    // define the noise data
    var noiseBufferSize = NOISE_BUFFER_SECONDS * this.audioContext.sampleRate;
    this.noiseBuffer = this.audioContext.createBuffer( 1, noiseBufferSize, this.audioContext.sampleRate ); // @private
    var data = this.noiseBuffer.getChannelData( 0 );

    // fill in the sample buffer based on the noise type
    if ( options.noiseType === 'white' ) {
      for ( var i = 0; i < noiseBufferSize; i++ ) {
        data[ i ] = Math.random() * 2 - 1;
      }
    }
    else if ( options.noiseType === 'pink' ) {
      var b0 = 0;
      var b1 = 0;
      var b2 = 0;
      var b3 = 0;
      var b4 = 0;
      var b5 = 0;
      var b6 = 0;
      for ( i = 0; i < noiseBufferSize; i++ ) {
        var white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[ i ] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[ i ] *= 0.11; // adjust to 0dB, empirically determined, will be approximate due to randomness of data
        b6 = white * 0.115926;
      }
    }
    else if ( options.noiseType === 'brown' ) {
      var lastOut = 0;
      for ( i = 0; i < noiseBufferSize; i++ ) {
        white = Math.random() * 2 - 1;
        data[ i ] = ( lastOut + ( 0.02 * white ) ) / 1.02;
        lastOut = data[ i ];
        data[ i ] *= 3.5; // adjust to 0dB, empirically determined, will be approximate due to randomness of data
      }
    }
    else {
      throw new Error( 'unexpected value for noiseType: ' + options.noiseType );
    }

    // @private {AudioBufferSourceNode|null} - the source node from which the noise is played
    this.noiseSource = null;

    // define a low frequency oscillator (LFO) for amplitude modulation
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = options.lfoType;
    this.lfo.frequency.setValueAtTime( options.lfoInitialFrequency, now ); // initialize LFO frequency, updated through methods defined below
    this.lfo.start();

    // create a gain stage to attenuate the LFO output so that it will range from -0.5 to +0.5
    this.lfoAttenuatorGainNode = this.audioContext.createGain();
    this.lfoAttenuatorGainNode.gain.value = options.lfoInitialDepth / 2;
    this.lfo.connect( this.lfoAttenuatorGainNode );

    // create a gain stage for the LFO - the main sound path will run through here
    this.lfoControlledGainNode = this.audioContext.createGain();
    this.lfoControlledGainNode.gain.value = 0.5; // this value is added to the attenuated LFO output value

    // set the initial enabled state of the LFO
    if ( options.lfoInitiallyEnabled ) {
      this.lfoAttenuatorGainNode.gain.setTargetAtTime( 0.5, this.audioContext.currentTime, PARAMETER_CHANGE_TIME_CONSTANT );
      this.lfoAttenuatorGainNode.connect( this.lfoControlledGainNode.gain );
    }
    else {
      this.lfoAttenuatorGainNode.gain.setTargetAtTime( 1, this.audioContext.currentTime, PARAMETER_CHANGE_TIME_CONSTANT );
    }

    // wire up the audio path, working our way from the output back to the sound source(s)
    this.lfoControlledGainNode.connect( this.masterGainNode );
    var nextOutputToConnect = this.lfoControlledGainNode;
    if ( highPassFilter ) {
      highPassFilter.connect( nextOutputToConnect );
      nextOutputToConnect = highPassFilter;
    }
    if ( lowPassFilter ) {
      lowPassFilter.connect( nextOutputToConnect );
      nextOutputToConnect = lowPassFilter;
    }
    if ( this.bandPassFilter ) {
      this.bandPassFilter.connect( nextOutputToConnect );
      nextOutputToConnect = this.bandPassFilter;
    }

    // @private {AudioParam} - point where the noise source connects
    this.noiseSourceConnectionPoint = nextOutputToConnect;

    // @public (read-only) {boolean}
    this.isPlaying = false;
  }

  tambo.register( 'NoiseGenerator', NoiseGenerator );

  inherit( SoundGenerator, NoiseGenerator, {

    start: function() {

      // only do something if not already playing, otherwise ignore this request
      if ( !this.isPlaying ) {

        // TODO: Test code - this worked, so the buffer must not be right
        // this.noiseSource = this.audioContext.createOscillator();
        // this.noiseSource.type = 'square';
        // this.noiseSource.frequency.setValueAtTime( 440, this.audioContext.currentTime ); // value in hertz
        // this.noiseSource.connect( this.noiseSourceConnectionPoint );
        // this.noiseSource.start();

        //======================
        this.noiseSource = this.audioContext.createBufferSource();
        this.noiseSource.buffer = this.noiseBuffer;
        this.noiseSource.loop = true;
        this.noiseSource.connect( this.noiseSourceConnectionPoint );
        this.noiseSource.start( 0 );
        this.isPlaying = true;
      }
    },

    stop: function() {

      // only stop if playing, otherwise ignore
      if ( this.isPlaying ) {
        this.noiseSource.stop();
        this.noiseSource.disconnect( this.noiseSourceConnectionPoint );
        this.noiseSource = null;
        this.isPlaying = false;
      }
    },

    /**
     * set the frequency of the low frequency amplitude modulator (LFO)
     * @public
     */
    setLfoFrequency: function( frequency ) {
      this.lfo.frequency.setTargetAtTime( frequency, this.audioContext.currentTime, PARAMETER_CHANGE_TIME_CONSTANT );
    },

    /**
     * @param {number} depth - depth value from 0 (no modulation) to 1 (max modulcaiton)
     * @public
     */
    setLfoDepth: function( depth ) {
      this.lfoAttenuatorGainNode.gain.setTargetAtTime( depth / 2, this.audioContext.currentTime, LFO_DEPTH_CHANGE_TIME_CONSTANT );
    },

    /**
     * turn the low frequency amplitude modulation on/off
     * @param {boolean} enabled
     */
    setLfoEnabled: function( enabled ) {
      if ( enabled ) {
        this.lfoAttenuatorGainNode.gain.setTargetAtTime( 0.5, this.audioContext.currentTime, PARAMETER_CHANGE_TIME_CONSTANT );
        this.lfoAttenuatorGainNode.connect( this.lfoControlledGainNode.gain );
      }
      else {
        this.lfoAttenuatorGainNode.disconnect( this.lfoControlledGainNode.gain );
        this.lfoAttenuatorGainNode.gain.setTargetAtTime( 1, this.audioContext.currentTime, PARAMETER_CHANGE_TIME_CONSTANT );
      }
    },

    /**
     * set the Q value for the band pass filter, assumes that noise generator was created with this filter enabled
     * @param frequency
     * @param timeConstant
     */
    setBandpassFilterCenterFrequency: function( frequency, timeConstant ) {
      timeConstant = timeConstant || PARAMETER_CHANGE_TIME_CONSTANT;
      this.bandPassFilter.frequency.setTargetAtTime( frequency, this.audioContext.currentTime, timeConstant );
    }
  } );

  return NoiseGenerator;
} );