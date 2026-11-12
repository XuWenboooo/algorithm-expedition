import { describe, it, expect } from 'vitest';
import { initialPlayerState, playerReducer } from '../src/kernel/trace';

describe('Playback controls', () => {
  it('timer ticks keep playing through the full trace', () => {
    let state = playerReducer(initialPlayerState, { type: 'play' }, 4);
    for (let index = 0; index < 4; index++) {
      state = playerReducer(state, { type: 'tick' }, 4);
      expect(state.index).toBe(index);
      expect(state.playing).toBe(true);
    }
    state = playerReducer(state, { type: 'pause' }, 4);
    expect(state.playing).toBe(false);
  });
  it('pause ignores a queued timer tick', () => {
    const state = playerReducer({ ...initialPlayerState, index: 2, playing: true }, { type: 'pause' }, 4);
    expect(playerReducer(state, { type: 'tick' }, 4)).toEqual(state);
  });
  it('manual next pauses without losing the next frame', () => {
    expect(playerReducer({ ...initialPlayerState, index: 1, playing: true }, { type: 'next' }, 4))
      .toMatchObject({ index: 2, playing: false });
  });
  it('manual previous restores the prior frame and pauses', () => {
    expect(playerReducer({ ...initialPlayerState, index: 2, playing: true }, { type: 'prev' }, 4))
      .toMatchObject({ index: 1, playing: false });
  });
  it('reset cancels playback and starts from the initial frame', () => {
    expect(playerReducer({ ...initialPlayerState, index: 2, playing: true }, { type: 'reset' }, 4))
      .toEqual(initialPlayerState);
  });
  it('play at the end starts a repeat from the beginning', () => {
    const state = playerReducer({ ...initialPlayerState, index: 3 }, { type: 'play' }, 4);
    expect(state).toMatchObject({ index: -1, playing: true });
    expect(playerReducer(state, { type: 'tick' }, 4).index).toBe(0);
  });
  it('empty traces cannot start playback', () => {
    expect(playerReducer(initialPlayerState, { type: 'play' }, 0)).toEqual(initialPlayerState);
    expect(playerReducer(initialPlayerState, { type: 'tick' }, 0)).toEqual(initialPlayerState);
  });
  it('changing speed preserves playback; seeking pauses it', () => {
    const playing = { ...initialPlayerState, index: 1, playing: true };
    const faster = playerReducer(playing, { type: 'setSpeed', speed: 120 }, 4);
    expect(faster).toMatchObject({ index: 1, playing: true, speed: 120 });
    expect(playerReducer(faster, { type: 'goto', index: 99 }, 4)).toMatchObject({ index: 3, playing: false });
  });
});
