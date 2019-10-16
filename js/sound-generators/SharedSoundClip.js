// Copyright 2019, University of Colorado Boulder

/**
 * SharedSoundClip is used to create sound clips that can be shared by multiple objects so that multiple instances don't
 * have to be created, which saves memory and load time.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const AutoRegisteringSoundClipProxy = require( 'TAMBO/AutoRegisteringSoundClipProxy' );
  const tambo = require( 'TAMBO/tambo' );

  class SharedSoundClip {

    /**
     * @param {Object} soundInfo - object of the type returned by the sound plugin, see sound.js for details
     * @param {Object} [options]
     * @constructor
     */
    constructor( soundInfo, options ) {

      // @private
      this.soundInfo = soundInfo;
      this.soundOptions = options;
      this._soundClip = null;
    }

    get soundClip() {
      if ( !this._soundClip ) {
        this._soundClip = new AutoRegisteringSoundClipProxy( this.soundInfo, this.soundOptions );
      }
      return this._soundClip;
    }
  }

  tambo.register( 'SharedSoundClip', SharedSoundClip );

  return SharedSoundClip;
} );