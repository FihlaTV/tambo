// Copyright 2019, University of Colorado Boulder

/**
 * Playable is a "definition" type, based off of PaintDef.js, that defines a type that is used in the tambo sound
 * library but is not actually a base class.  This is similar to the idea of an "interface" in Java.  A Playable type
 * is a sound generator that has a "play" method.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

define( require => {
  'use strict';

  const tambo = require( 'TAMBO/tambo' );

  class Playable {

    static isPlayable( objectInstance ) {
      return typeof objectInstance.play === 'function';
    }
  }

  // static value that is used to specify that no sound should be produced
  Playable.NO_SOUND = { play() {} };

  return tambo.register( 'Playable', Playable );
} );
