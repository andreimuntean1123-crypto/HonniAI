'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/types';

/**
 * Web Speech API wrappers.
 *
 * Both features degrade gracefully: `supported` is false on browsers without
 * them (Firefox has no SpeechRecognition), and the UI hides/disables the
 * corresponding buttons instead of failing.
 */

const BCP47: Record<Locale, string> = { ro: 'ro-RO', ru: 'ru-RU', en: 'en-US' };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

/** Speech-to-text (dictation). */
export function useDictation(locale: Locale, onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const handler = useRef(onText);
  handler.current = onText;

  useEffect(() => {
    const w = window as unknown as Record<string, any>;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec: SpeechRecognitionLike = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    recognition.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  useEffect(() => {
    if (recognition.current) recognition.current.lang = BCP47[locale];
  }, [locale]);

  const start = useCallback(() => {
    const rec = recognition.current;
    if (!rec) return;
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results as ArrayLike<any>)
        .map((r: any) => r[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) handler.current(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognition.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  return { listening, supported, start, stop, toggle: () => (listening ? stop() : start()) };
}

/** Text-to-speech (reading answers aloud). */
export function useSpeaker(locale: Locale) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      // Strip Markdown so the voice does not read "hash hash" and asterisks.
      const clean = text
        .replace(/[#*`>_]/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);
      if (!clean) return;
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = BCP47[locale];
      utterance.rate = 1.02;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [locale],
  );

  return { speaking, supported, speak, stop };
}
