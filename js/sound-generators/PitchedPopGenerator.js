// Copyright 2018, University of Colorado Boulder

/**
 * sound generator that produces a popping sound with controllable pitch
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const inherit = require( 'PHET_CORE/inherit' );
  const Range = require( 'DOT/Range' );
  const SoundGenerator = require( 'TAMBO/sound-generators/SoundGenerator' );
  const tambo = require( 'TAMBO/tambo' );

  // constants
  const DEFAULT_NUM_POP_GENERATORS = 8;
  const ENVELOPE_TIME_CONSTANT = 0.005; //REVIEW units?
  const DEFAULT_POP_DURATION = 0.02; // in seconds

  /**
   * @constructor
   * {Object} options
   */
  function PitchedPopGenerator( options ) {

    options = _.extend( {

      // the range of pitches that this pop generator will produce, in Hz
      pitchRange: new Range( 220, 660 ),

      // the number of pop generators to create and pool, use more if generating lots of pops close together, less if not
      numPopGenerators: DEFAULT_NUM_POP_GENERATORS
    }, options );

    const self = this;
    SoundGenerator.call( this, options );

    //REVIEW anti-pattern, replace with this.pitchRange = options.pitchRange
    // @private {Object} - make options available to methods
    this.options = options;

    //REVIEW {DynamicsCompressorNode} ?
    // add a dynamics compressor node, otherwise distortion tends to occur when lots of pops are played at once
    const dynamicsCompressorNode = this.audioContext.createDynamicsCompressor();
    //REVIEW document these magic numbers, or refer to where documentation can be found.
    dynamicsCompressorNode.threshold.value = -50;
    dynamicsCompressorNode.knee.value = 25;
    dynamicsCompressorNode.ratio.value = 12;
    dynamicsCompressorNode.attack.value = 0;
    dynamicsCompressorNode.release.value = 0.25;
    dynamicsCompressorNode.connect( this.masterGainNode );

    //REVIEW type expression, {{oscillator:OscillatorNode, gainNode:GainNode}[]} ?
    // create the sources - several are created so that pops can be played in rapid succession if desired
    this.soundSources = [];
    _.times( options.numPopGenerators, function() {

      const soundSource = {};

      // {OscillatorNode}
      const oscillator = self.audioContext.createOscillator();
      const now = self.audioContext.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime( options.pitchRange.min, now );
      oscillator.start( 0 );
      soundSource.oscillator = oscillator;

      // {GainNode}
      const gainNode = self.audioContext.createGain();
      gainNode.gain.setValueAtTime( 0, now );
      oscillator.connect( gainNode );
      gainNode.connect( dynamicsCompressorNode );
      soundSource.gainNode = gainNode;

      //REVIEW get ride of const soundSource and push( { oscillator: oscillator, gainNode: gainNode } )
      self.soundSources.push( soundSource );
    } );

    // @private
    this.nextSoundSourceIndex = 0;
  }

  tambo.register( 'PitchedPopGenerator', PitchedPopGenerator );

  inherit( SoundGenerator, PitchedPopGenerator, {

    /**
     * play the pop sound
     * {number} relativePitch - a value from 0 to 1 indicating the frequency to play within the pitch range
     * {number} [duration] - the duration of the sound, in seconds
     * @public
     */
    playPop: function( relativePitch, duration ) {

      assert && assert( relativePitch >= 0 && relativePitch <= 1, 'relative pitch value out of range' );

      if ( !this.fullyEnabled ) {

        // ignore the request
        return;
      }

      // use either the specified or default duration
      duration = duration || DEFAULT_POP_DURATION;

      // determine the frequency value of the pop
      const minFrequency = this.options.pitchRange.min;
      const maxFrequency = this.options.pitchRange.max;
      const frequency = minFrequency + relativePitch * ( maxFrequency - minFrequency );

      //REVIEW type expression for soundSource
      // get a sound source from the pool, then index to the next one
      const soundSource = this.soundSources[ this.nextSoundSourceIndex ];
      this.nextSoundSourceIndex = ( this.nextSoundSourceIndex + 1 ) % this.soundSources.length;

      // play the pop sound
      const now = this.audioContext.currentTime;
      soundSource.gainNode.gain.cancelScheduledValues( now );
      soundSource.oscillator.frequency.setValueAtTime( frequency / 2, now );
      soundSource.gainNode.gain.setValueAtTime( 0, now );
      soundSource.oscillator.frequency.linearRampToValueAtTime( frequency * 2, now + duration );
      soundSource.gainNode.gain.setTargetAtTime( 1, now, ENVELOPE_TIME_CONSTANT );
      soundSource.gainNode.gain.setTargetAtTime( 0, now + duration, ENVELOPE_TIME_CONSTANT );
    }
  } );

  return PitchedPopGenerator;
} );