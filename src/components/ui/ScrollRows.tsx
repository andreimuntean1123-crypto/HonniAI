'use client';

import { useEffect } from 'react';

/**
 * Face rândurile orizontale (`.scroll-row`) folosibile cu mouse-ul și cu
 * tastatura, nu doar cu degetul pe telefon.
 *
 * Problema pe care o rezolvă: un rând de „chips" care nu încape pe lățime se
 * taie la margine. Pe desktop nu există niciun mod evident de a-l muta —
 * rotița mouse-ului derulează pagina în jos, nu rândul în lateral.
 *
 * Ce adaugă:
 *   • rotița mouse-ului (sau două degete pe trackpad, vertical) mută rândul
 *     în lateral, dar numai cât timp mai există unde să meargă — la capăt,
 *     derularea trece înapoi la pagină, ca să nu se blocheze scroll-ul;
 *   • săgețile ← →, plus Home / End, când rândul este focalizat;
 *   • rândul intră în ordinea de tabulare doar dacă are conținut ascuns,
 *     ca să nu adauge opriri inutile pentru cei care navighează cu tastatura;
 *   • un atribut `data-overflowing` pe care CSS-ul îl poate folosi ca să arate
 *     că mai există conținut dincolo de margine.
 *
 * Se montează o singură dată, în providers, și prinde inclusiv rândurile
 * apărute mai târziu (rezultate de căutare, panoul de chat) printr-un
 * MutationObserver.
 */

const SELECTOR = '.scroll-row';
const STEP = 180; // cât mută o apăsare de săgeată, în pixeli

function canScroll(el: HTMLElement) {
  return el.scrollWidth - el.clientWidth > 2;
}

function setupRow(el: HTMLElement) {
  if (el.dataset.scrollRowReady === '1') return;
  el.dataset.scrollRowReady = '1';

  const refresh = () => {
    const overflowing = canScroll(el);
    el.dataset.overflowing = overflowing ? 'true' : 'false';
    // Focalizabil doar când chiar are ce derula.
    if (overflowing) {
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'group');
      if (!el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', 'Listă derulabilă pe orizontală');
      }
    } else {
      el.removeAttribute('tabindex');
    }
  };

  refresh();

  // Rotița verticală → mișcare orizontală.
  el.addEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (!canScroll(el)) return;
      // Un gest deja orizontal (trackpad) e lăsat în seama browserului.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const delta = event.deltaY;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;

      // La capete, redăm derularea paginii — altfel utilizatorul rămâne blocat.
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

      event.preventDefault();
      el.scrollLeft += delta;
    },
    { passive: false },
  );

  // Săgeți, Home, End.
  el.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!canScroll(el)) return;

    // Nu furăm săgețile dintr-un câmp de text aflat în rând.
    const target = event.target as HTMLElement | null;
    if (target && target !== el && target.closest('input, textarea, select')) return;

    let next: number | null = null;
    if (event.key === 'ArrowRight') next = el.scrollLeft + STEP;
    else if (event.key === 'ArrowLeft') next = el.scrollLeft - STEP;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = el.scrollWidth;
    if (next === null) return;

    event.preventDefault();
    el.scrollTo({ left: next, behavior: 'smooth' });
  });

  // Recalculăm când se schimbă lățimea sau conținutul rândului.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(refresh);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
  }
  el.addEventListener('scroll', refresh, { passive: true });
}

export function ScrollRows() {
  useEffect(() => {
    const scan = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach(setupRow);
    };

    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

  return null;
}
