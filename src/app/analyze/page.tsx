'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Info,
  Leaf,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PhotoAnalysis } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { apiKeyHeader } from '@/lib/apiKey';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { MacroBar, Reveal, Stat } from '@/components/ui';
import { ChatPanel } from '@/components/chat/ChatPanel';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 8;

export default function AnalyzePage() {
  const { t, locale } = useI18n();
  const { data, addAnalysis, deleteAnalysis } = useData();
  const { toast } = useToast();

  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const acceptFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        toast(t('analyze.errorType'), 'error');
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast(t('analyze.errorSize', { size: MAX_MB }), 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImage(String(reader.result));
        setResult(null);
      };
      reader.readAsDataURL(file);
    },
    [t, toast],
  );

  const analyze = async () => {
    if (!image) {
      toast(t('analyze.errorNoImage'), 'error');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...apiKeyHeader() },
        body: JSON.stringify({ image, locale, userContext: data.profile.aiContext }),
        signal: AbortSignal.timeout(65_000),
      });

      if (res.status === 429) {
        toast(t('chat.rateLimited'), 'error');
        return;
      }
      if (res.status === 413) {
        toast(t('analyze.errorSize', { size: MAX_MB }), 'error');
        return;
      }
      if (res.status === 422) {
        toast(t('analyze.errorUnreadable'), 'error');
        return;
      }
      if (!res.ok) throw new Error('http');

      const json = (await res.json()) as { analysis: PhotoAnalysis };
      // Store a small thumbnail so history survives a refresh without bloating storage.
      const thumbnail = await makeThumbnail(image);
      const analysis = { ...json.analysis, thumbnail };
      setResult(analysis);
      addAnalysis(analysis);
    } catch {
      toast(t('analyze.errorFailed'), 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const lowConfidence = result ? result.confidence < 0.45 : false;

  return (
    <div className="container-page pb-16">
      <PageHeader title={t('analyze.title')} subtitle={t('analyze.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {/* ------------------------------------------------------- uploader */}
          <Reveal>
            <div className="card p-5">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />

              {!image ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    acceptFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={clsx(
                    'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all',
                    dragging
                      ? 'border-brand-500 bg-brand-500/[0.08]'
                      : 'border-hairline hover:border-brand-500/50 hover:bg-surface-2/50',
                  )}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-brand-600 dark:text-brand-300">
                    <Upload size={22} />
                  </span>
                  <p className="font-medium text-ink">{t('analyze.dropzone')}</p>
                  <p className="text-xs text-ink-muted">
                    {t('analyze.dropzoneHint', { size: MAX_MB })}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileRef.current?.click();
                      }}
                      className="btn-secondary btn-sm"
                    >
                      <ImagePlus size={14} />
                      {t('analyze.choose')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraRef.current?.click();
                      }}
                      className="btn-secondary btn-sm sm:hidden"
                    >
                      <Camera size={14} />
                      {t('analyze.camera')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative overflow-hidden rounded-3xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="max-h-[22rem] w-full object-cover" />
                    {analyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm">
                        <Loader2 size={30} className="animate-spin text-brand-400" />
                        <p className="text-sm text-white">{t('analyze.analyzing')}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={analyze}
                      disabled={analyzing}
                      className="btn-primary flex-1 justify-center sm:flex-none"
                    >
                      {analyzing ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      {analyzing ? t('analyze.analyzing') : t('analyze.analyze')}
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="btn-secondary btn-sm"
                    >
                      <RefreshCw size={14} />
                      {t('analyze.replace')}
                    </button>
                    <button
                      onClick={() => {
                        setImage(null);
                        setResult(null);
                      }}
                      className="btn-ghost btn-sm"
                    >
                      <Trash2 size={14} />
                      {t('analyze.remove')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* --------------------------------------------------------- result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="label !mb-1">{t('analyze.identified')}</p>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                      {result.dish}
                    </h2>
                    {result.portion && (
                      <p className="muted mt-1 text-xs">
                        {t('analyze.portion')}: {result.portion}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="label !mb-1">{t('analyze.score')}</p>
                    <p
                      className={clsx(
                        'font-display text-3xl font-semibold',
                        result.healthScore >= 70
                          ? 'text-brand-500'
                          : result.healthScore >= 45
                            ? 'text-amber-500'
                            : 'text-red-500',
                      )}
                    >
                      {result.healthScore}
                      <span className="text-sm text-ink-muted">/100</span>
                    </p>
                  </div>
                </div>

                {/* confidence */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">{t('analyze.confidence')}</span>
                    <span className="font-medium text-ink">{confidencePct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08] dark:bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidencePct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={clsx(
                        'h-full rounded-full',
                        lowConfidence ? 'bg-amber-500' : 'bg-brand-500',
                      )}
                    />
                  </div>
                  {lowConfidence && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-300">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {t('analyze.lowConfidence')}
                    </p>
                  )}
                </div>

                {/* nutrition */}
                <div className="mt-6">
                  <p className="label">{t('analyze.estimated')}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat
                      label={t('recipes.calories')}
                      value={result.nutrition.calories}
                      suffix={t('common.kcal')}
                      accent
                    />
                    <Stat label={t('recipes.protein')} value={result.nutrition.protein} suffix="g" />
                    <Stat label={t('recipes.carbs')} value={result.nutrition.carbs} suffix="g" />
                    <Stat label={t('recipes.fat')} value={result.nutrition.fat} suffix="g" />
                  </div>
                  <div className="mt-3">
                    <MacroBar
                      protein={result.nutrition.protein}
                      carbs={result.nutrition.carbs}
                      fat={result.nutrition.fat}
                      labels={[t('recipes.protein'), t('recipes.carbs'), t('recipes.fat')]}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.nutrition.sugar !== undefined && (
                      <span className="badge">
                        {t('recipes.sugar')}: {result.nutrition.sugar} g
                      </span>
                    )}
                    {result.nutrition.salt !== undefined && (
                      <span className="badge">
                        {t('recipes.salt')}: {result.nutrition.salt} g
                      </span>
                    )}
                    {result.nutrition.fiber !== undefined && (
                      <span className="badge">
                        {t('recipes.fiber')}: {result.nutrition.fiber} g
                      </span>
                    )}
                  </div>
                </div>

                {/* ingredients */}
                {result.ingredients.length > 0 && (
                  <div className="mt-6">
                    <p className="label">{t('analyze.probableIngredients')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.ingredients.map((i) => (
                        <span key={i} className="chip">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ListBlock
                    title={t('analyze.benefits')}
                    items={result.benefits}
                    icon={<CheckCircle2 size={13} className="text-brand-500" />}
                  />
                  <ListBlock
                    title={t('analyze.watchOuts')}
                    items={result.watchOuts}
                    icon={<AlertTriangle size={13} className="text-amber-500" />}
                  />
                  <ListBlock
                    title={t('analyze.problematic')}
                    items={result.problematic}
                    icon={<Info size={13} className="text-ink-muted" />}
                  />
                  <ListBlock
                    title={t('analyze.healthier')}
                    items={result.healthierSuggestions}
                    icon={<Leaf size={13} className="text-brand-500" />}
                  />
                </div>

                {result.frequency && (
                  <p className="mt-5 rounded-2xl border border-hairline bg-surface-2/50 px-4 py-3 text-sm text-ink-soft">
                    <span className="font-medium text-ink">{t('analyze.frequency')}: </span>
                    {result.frequency}
                  </p>
                )}

                {result.summary && (
                  <div className="mt-4">
                    <p className="label">{t('analyze.recommendation')}</p>
                    <p className="muted">{result.summary}</p>
                  </div>
                )}

                <p className="mt-6 flex items-start gap-2 rounded-2xl bg-amber-500/[0.08] px-4 py-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {t('analyze.disclaimer')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* -------------------------------------------------------- history */}
          {data.analyses.length > 0 && (
            <Reveal>
              <div className="card p-5">
                <p className="label">{t('analyze.historyTitle')}</p>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {data.analyses.map((a) => (
                    <div key={a.id} className="group relative shrink-0">
                      <button
                        onClick={() => {
                          setResult(a);
                          if (a.thumbnail) setImage(a.thumbnail);
                        }}
                        className="block w-28 overflow-hidden rounded-2xl border border-hairline text-left transition-transform hover:-translate-y-0.5"
                      >
                        {a.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.thumbnail} alt="" className="h-20 w-full object-cover" />
                        ) : (
                          <div className="flex h-20 items-center justify-center bg-surface-2 text-2xl">
                            🍽️
                          </div>
                        )}
                        <p className="truncate px-2 py-1.5 text-[11px] text-ink-soft">{a.dish}</p>
                      </button>
                      <button
                        onClick={() => deleteAnalysis(a.id)}
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* ------------------------------------------------ nutrition agent */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:h-[calc(100dvh-var(--header-h)-3rem)]">
          <div className="card flex h-[32rem] flex-col overflow-hidden p-0 lg:h-full">
            <ChatPanel
              agent="nutrition"
              compact
              showHistory={false}
              systemNote={
                result
                  ? `Photo analysis: ${result.dish}; ${result.nutrition.calories} kcal, P ${result.nutrition.protein} g, C ${result.nutrition.carbs} g, F ${result.nutrition.fat} g; ingredients: ${result.ingredients.join(', ')}`
                  : undefined
              }
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2/40 p-4">
      <p className="label !mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[0.84rem] leading-relaxed text-ink-soft">
            <span className="mt-1 shrink-0">{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Downscales the uploaded picture so history thumbnails stay small in storage. */
async function makeThumbnail(dataUrl: string, size = 220): Promise<string | undefined> {
  try {
    const img = document.createElement('img');
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return undefined;
  }
}
