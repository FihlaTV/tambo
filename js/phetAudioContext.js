// Copyright 2018, University of Colorado Boulder

/**
 * a singleton instance of a Web Audio audio context that can be included using RequireJS, creates a stubbed version on
 * platforms where Web Audio is not supported
 */
define( function( require ) {
  'use strict';

  // modules
  const audioContextStateChangeMonitor = require( 'TAMBO/audioContextStateChangeMonitor' );
  const platform = require( 'PHET_CORE/platform' );
  const tambo = require( 'TAMBO/tambo' );
  const TamboQueryParameters = require( 'TAMBO/TamboQueryParameters' );

  // constants
  const FORCE_STUBBED_AUDIO_CONTEXT = TamboQueryParameters.forceStubbedAudioContext; // used for testing, see below

  // helper function for logging warnings
  function logUnimplementedWarning() {
    assert && console.warn( 'warning: method called on stubbed audio context, no sound will be produced' );
  }

  // silent stub function, used in the stubbed audio context
  function silentStub() {}

  // Define a stubbed audio context (basically a subset of the API for AudioContext) that can be used in cases where
  // browsers don't support Web Audio.  This was created manually by identifying what portions of the Web Audio API were
  // being used in tambo and adding those methods and properties. This may need to be updated periodically as tambo and
  // our usage of Web Audio evolves.  See https://github.com/phetsims/tambo/issues/10.
  const STUBBED_AUDIO_CONTEXT = {

    // methods and properties are in alphabetical order, please maintain this for ease of maintenance

    createBiquadFilter: function() {
      logUnimplementedWarning();
      return {
        connect: silentStub,
        frequency: {
          setTargetAtTime: silentStub,
          setValueAtTime: silentStub
        },
        Q: {
          setValueAtTime: silentStub
        }
      };
    },
    createBuffer: function() {
      return {
        getChannelData: function() {
          return {};
        }
      };
    },
    createBufferSource: function() {
      return {
        connect: silentStub,
        disconnect: silentStub,
        start: silentStub,
        stop: silentStub
      };
    },
    createConvolver: function() {
      logUnimplementedWarning();
      return {
        connect: silentStub
      };
    },
    createDynamicsCompressor: function() {
      logUnimplementedWarning();
      return {
        attack: {
          setValueAtTime: silentStub
        },
        connect: silentStub,
        knee: {
          setValueAtTime: silentStub
        },
        ratio: {
          setValueAtTime: silentStub
        },
        release: {
          setValueAtTime: silentStub
        },
        threshold: {
          setValueAtTime: silentStub
        }
      };
    },
    createGain: function() {
      logUnimplementedWarning();
      return {
        connect: silentStub,
        disconnect: silentStub,
        gain: {
          cancelScheduledValues: silentStub,
          setTargetAtTime: silentStub,
          setValueAtTime: silentStub
        }
      };
    },
    createOscillator: function() {
      logUnimplementedWarning();
      return {
        connect: silentStub,
        start: silentStub,
        frequency: {
          linearRampToValueAtTime: silentStub,
          setValueAtTime: silentStub
        }
      };
    },
    currentTime: 0,
    decodeAudioData: logUnimplementedWarning,
    destination: null,
    resume: logUnimplementedWarning,
    state: 'running',

    // this is a flag that is specific to the stubbed audio context, allowing it to be identified
    isStubbed: true
  };

  // create a Web Audio context
  let phetAudioContext = null;
  if ( window.AudioContext && !FORCE_STUBBED_AUDIO_CONTEXT ) {
    phetAudioContext = new window.AudioContext();
  }
  else if ( window.webkitAudioContext && !FORCE_STUBBED_AUDIO_CONTEXT ) {
    phetAudioContext = new window.webkitAudioContext();
  }
  else {

    // the browser doesn't support creating an audio context, so use a stubbed out version
    phetAudioContext = STUBBED_AUDIO_CONTEXT;
    console.warn( 'warning: no support for Web Audio detected, using stubbed audio context' );
  }

  // If we are running on non-mobile Safari, add a handler to restart the audio context if it goes into the
  // "interrupted" state.  This can happen when putting the sim into full screen mode, though it seems like a violation
  // of the Web Audio spec.  See https://github.com/phetsims/resistance-in-a-wire/issues/190.  It may be possible to
  // remove this code at some point in the future if Apple fixes this issue in Safari.
  if ( !phetAudioContext.isStubbed && platform.safari && !platform.mobileSafari ) {
    audioContextStateChangeMonitor.addStateChangeListener( phetAudioContext, state => {
      if ( state === 'interrupted' ) {
        console.warn( 'the audio context was interrupted, calling resume()' );
        phetAudioContext.resume();
      }
    } );
  }

  // TODO: Temporary - add a state change listener for testing
  console.log( 'phetAudioContext.state = ' + phetAudioContext.state );
  audioContextStateChangeMonitor.addStateChangeListener( phetAudioContext, state => {
    console.log( 'state (from in phetAudioContext) = ' + state );
  } );

  // register for phet-io
  tambo.register( 'phetAudioContext', phetAudioContext );

  return phetAudioContext;
} );