/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import LZString from 'lz-string';
import { BoardState } from './types';

export const serializeState = (state: BoardState): string => {
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
};

export const deserializeState = (encoded: string): BoardState | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to deserialize state', e);
    return null;
  }
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
};
