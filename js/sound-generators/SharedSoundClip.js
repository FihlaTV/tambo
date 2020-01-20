// Copyright 2019, University of Colorado Boulder

/**
 * SharedSoundClip is used to create sound clips that can be shared by multiple objects so that multiple instances don't
 * have to be created, which saves memory and load time.  This is essentially a singleton pattern, and also auto-
 * registers the sound with the sound manager.
 *
 * This type wraps the sound clip an only passes through the "play()" method, since attributes of the shared clip, such
 * as output level and playback rate, should not be altered.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const tambo = require( 'TAMBO/tambo' );
  const SoundClip = require( 'TAMBO/sound-generators/SoundClip' );
  const soundManager = require( 'TAMBO/soundManager' );

  class SharedSoundClip {

    /**
     * @param {Object} soundInfo - object of the type returned by the sound plugin, see sound.js for details
     * @param {Object} [options]
     * @constructor
     */
    constructor( soundInfo, options ) {

      // {SoundClip} @private
      this.soundClip = new SoundClip( soundInfo, options );

      if ( soundInfo.url.indexOf( '-v4' ) >= 0 ) {
        console.log( 'skipping add of ' + soundInfo.url );
        return;
      }

      // automatically register this sound clip with the sound manager
      soundManager.addSoundGenerator( this.soundClip, options.soundManagerOptions );
    }

    /**
     * the only supported method is "play", since no clients should be changing things like the playback rate or output
     * level
     * @public
     */
    play() {
      this.soundClip.play();
    }
  }

  tambo.register( 'SharedSoundClip', SharedSoundClip );

  return SharedSoundClip;
} );