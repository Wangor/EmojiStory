import { NextRequest } from 'next/server';
import { z } from 'zod';
import { openai } from '../../../lib/openai';
import { buildStoryboardPrompt } from '../../../lib/prompt/buildStoryboardPrompt';
import { defaultPromptConfig } from '../../../lib/prompt/config';
import { animationSchema } from '../../../lib/schema';
import { animationJsonSchema } from '../../../lib/schema/json';
import { BACKGROUNDS } from '../../../lib/assets/backgrounds';

const Body = z.object({ story: z.string().min(1) });

const { systemPrompt, storyboardPrompt } = buildStoryboardPrompt(defaultPromptConfig);

const VALID_EFFECTS = defaultPromptConfig.effects.map((e) => e.name) as readonly string[];

// 2) Add small helper utilities for captions
function toSentenceCase(s: string): string {
  const trimmed = s.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const c = trimmed[0].toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(c) ? c : c + '.';
}

function isCaptionClear(caption: any): boolean {
  if (typeof caption !== 'string') return false;
  const c = caption.trim();

  // Length and word count check
  const words = c.split(/\s+/).filter(Boolean);
  // Accept slightly shorter captions to avoid over-rejecting model output
  if (words.length < 3 || words.length > 24) return false;

  // Must contain letters (basic Latin + extended Latin ranges as an approximation)
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ\u00C0-\u024F\u1E00-\u1EFF]/.test(c)) return false;

  // Estimate emoji/symbol ratio without Unicode property escapes
  // - Emoji/misc symbols blocks (BMP + SMP)
  const emojiLike = c.match(/[\u2600-\u27BF\u{1F000}-\u{1FAFF}]/gu)?.length ?? 0;
  // - ASCII punctuation and symbols
  const asciiPunctOrSymbols = c.match(/[!-/:-@[-`{-~]/g)?.length ?? 0;

  const symbolRatio = (emojiLike + asciiPunctOrSymbols) / Math.max(1, c.length);
  if (symbolRatio > 0.5) return false;

  // Reject placeholders and obvious junk
  const lower = c.toLowerCase();
  const banned = ['lorem', 'ipsum', 'asdf', 'qwer', 'placeholder', 'random', 'blah', 'foo', 'bar'];
  if (banned.some(b => lower.includes(b))) return false;

  // Avoid repeated characters like "aaaaa"
  if (/(.)\1{3,}/.test(lower)) return false;

  return true;
}

function guessSceneVerb(loop?: 'float' | 'none'): string {
  return loop === 'float' ? 'drifts' : 'moves';
}

function describeActor(actor: any): string {
  if (typeof actor?.ariaLabel === 'string' && actor.ariaLabel.trim()) {
    return actor.ariaLabel.trim();
  }
  if (actor?.type === 'composite') {
    const part = Array.isArray(actor.parts) ? actor.parts[0] : undefined;
    if (typeof part?.ariaLabel === 'string' && part.ariaLabel.trim()) {
      return part.ariaLabel.trim();
    }
    if (typeof part?.emoji === 'string' && part.emoji.trim()) {
      return 'emoji';
    }
    return 'character';
  }
  return typeof actor?.emoji === 'string' && actor.emoji.trim() ? 'emoji' : 'character';
}

function backgroundPhrase(bgActors?: any[]): string {
  if (!Array.isArray(bgActors) || bgActors.length === 0) return '';
  const a = bgActors[0];
  const desc = describeActor(a);
  return ` with ${desc} in the background`;
}

function synthesizeCaption(scene: any): string {
  const actors = Array.isArray(scene?.actors) ? scene.actors : [];
  const subjects = actors.slice(0, 2).map(describeActor);
  let subject: string;
  if (subjects.length === 0) subject = 'An emoji';
  else if (subjects.length === 1) subject = `The ${subjects[0]}`;
  else subject = `The ${subjects[0]} and ${subjects[1]}`;

  const verb = guessSceneVerb(actors[0]?.loop);
  const bg = backgroundPhrase(scene?.backgroundActors);

  const text = `${subject} ${verb}${bg}`;
  return toSentenceCase(text);
}

// A minimal few-shot that exactly matches the schema, to reduce omissions
const FEW_SHOT_EXAMPLE = {
    title: 'Sample Animation',
    fps: 30,
    scenes: [
        {
            id: 'scene-1',
            duration_ms: 3000,
            backgroundActors: [
                {
                    id: 'bg-1',
                    type: 'emoji',
                    emoji: '🌇',
                    start: { x: 0.5, y: 0.5, scale: 1 },
                    tracks: [
                        { t: 0, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' },
                        { t: 3000, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' }
                    ]
                }
            ],
            caption: 'Sunset intro',
            actors: [
                {
                    id: 'actor-1',
                    type: 'emoji',
                    emoji: '😀',
                    start: { x: 0.1, y: 0.8, scale: 1 },
                    tracks: [
                        { t: 0, x: 0.1, y: 0.8, scale: 1, rotate: 0, ease: 'linear' },
                        { t: 1500, x: 0.5, y: 0.5, scale: 1.2, rotate: 10, ease: 'easeInOut' },
                        { t: 3000, x: 0.9, y: 0.2, scale: 1, rotate: 0, ease: 'easeOut' }
                    ],
                    loop: 'none',
                    z: 0,
                    ariaLabel: 'happy face'
                }
            ],
            sfx: [{ at_ms: 500, type: 'ding' }]
        }
    ]
};

// 3) Make caption guidance explicit in the instruction the model sees
const STRICT_JSON_INSTRUCTION = [
    'Return ONLY a single valid JSON object (no markdown, no code fences, no comments).',
    'The JSON MUST include all required fields and conform to this JSON Schema:',
    JSON.stringify(animationJsonSchema),
    'Use this example as a structural reference (values may differ, but required keys must be present):',
    JSON.stringify(FEW_SHOT_EXAMPLE),
    'You MUST include at least one scene in "scenes" and at least one track per actor.',
    'If any value is unknown, provide a reasonable default that satisfies the schema.',
    // Caption rules:
    'Caption rules:',
    '- scenes[i].caption MUST be a clear, grammatical sentence (3–24 words) that describes what happens in that scene.',
    '- It MUST NOT be random strings, placeholders, or mostly emojis/symbols.',
    '- Prefer the same language as the user story.',
    '- Avoid repeated characters and filler like "lorem", "asdf", or "placeholder".'
].join('\n');

// Safe stringify utility for logging, with size limit
function safeStringify(obj: unknown, limit = 20000) {
    try {
        const str = JSON.stringify(obj, null, 2);
        return str.length > limit ? str.slice(0, limit) + '... [truncated]' : str;
    } catch {
        return '[unserializable]';
    }
}

// Scan a string for the first balanced JSON object and return it as string
function findFirstJsonObjectString(input: string): string | undefined {
    let inString = false, escape = false, depth = 0, start = -1;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (inString) {
            if (escape) escape = false;
            else if (ch === '\\') escape = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '{') { if (depth === 0) start = i; depth++; }
        else if (ch === '}') { depth--; if (depth === 0 && start !== -1) return input.slice(start, i + 1); }
    }
    return undefined;
}

// Extract text or JSON robustly from Responses API for different shapes
function extractOutputText(resp: any): string | undefined {
    if (typeof resp?.output_text === 'string' && resp.output_text.trim()) {
        return resp.output_text.trim();
    }
    const out = resp?.output;
    if (Array.isArray(out)) {
        const chunks: string[] = [];
        for (const o of out) {
            const content = o?.content;
            if (!Array.isArray(content)) continue;
            for (const c of content) {
                if (typeof c?.text === 'string') chunks.push(c.text);
                if (c?.type === 'json' && c?.json_object) {
                    try { chunks.push(JSON.stringify(c.json_object)); } catch {}
                }
                if (Array.isArray(c?.content)) {
                    for (const inner of c.content) {
                        if (typeof inner?.text === 'string') chunks.push(inner.text);
                        if (inner?.type === 'json' && inner?.json_object) {
                            try { chunks.push(JSON.stringify(inner.json_object)); } catch {}
                        }
                    }
                }
            }
        }
        const joined = chunks.join('').trim();
        if (joined) return joined;
    }
    const chatLike = resp?.choices?.[0]?.message?.content;
    if (typeof chatLike === 'string' && chatLike.trim()) return chatLike.trim();
    if (Array.isArray(chatLike)) {
        const joined = chatLike.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('').trim();
        if (joined) return joined;
    }
    try {
        const raw = JSON.stringify(resp);
        const jsonStr = findFirstJsonObjectString(raw);
        if (jsonStr) return jsonStr;
    } catch {}
    return undefined;
}

// Add these small helpers near the top of the file (e.g., below STRICT_JSON_INSTRUCTION)
function clamp01(n: any): number {
  const x = typeof n === 'number' && Number.isFinite(n) ? n : 0.5;
  return Math.max(0, Math.min(1, x));
}
function clamp(n: any, min: number, max: number, fallback: number): number {
  const x = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, x));
}

function pickBackgroundActors(text: string, durationMs: number) {
  const t = text.toLowerCase();
  const make = (id: string, x: number, y: number, scale?: number) => {
    const def = BACKGROUNDS.find((b) => b.id === id);
    const sc = scale ?? def?.scale ?? 1;
    const emoji = def?.emoji ?? '❓';
    return {
      type: 'emoji',
      emoji,
      start: { x, y, scale: sc },
      tracks: [
        { t: 0, x, y, rotate: 0, scale: sc, ease: 'linear' },
        { t: durationMs / 2, x, y: y - 0.02, rotate: 0, scale: sc, ease: 'linear' },
        { t: durationMs, x, y, rotate: 0, scale: sc, ease: 'linear' }
      ],
      loop: 'float',
      z: -100,
      ariaLabel: 'background'
    };
  };
  const rules: Array<{ keys: string[]; actors: any[] }> = [
    {
      keys: ['forest', 'woods', 'tree', 'jungle', 'park'],
      actors: [
        make('tree', 0.2, 0.8),
        make('pine', 0.5, 0.75),
        make('tree', 0.8, 0.8)
      ]
    },
    {
      keys: ['city', 'street', 'town', 'building', 'skyscraper'],
      actors: [
        make('city', 0.25, 0.72),
        make('office', 0.5, 0.7),
        make('store', 0.75, 0.72)
      ]
    },
    {
      keys: ['beach', 'ocean', 'sea', 'sand', 'shore', 'wave'],
      actors: [make('beach', 0.5, 0.8), make('palm', 0.2, 0.8)]
    },
    {
      keys: ['mountain', 'hill', 'cliff', 'peak'],
      actors: [make('snowy-mountain', 0.5, 0.7), make('mountain', 0.8, 0.72)]
    },
    {
      keys: ['night', 'moon', 'star', 'dark'],
      actors: [make('night-city', 0.5, 0.55), make('moon', 0.8, 0.3)]
    },
    {
      keys: ['space', 'planet', 'galaxy', 'astronaut', 'rocket'],
      actors: [make('milky-way', 0.5, 0.5), make('planet', 0.8, 0.35)]
    },
    {
      keys: ['desert', 'cactus', 'dune', 'camel'],
      actors: [make('desert', 0.5, 0.75), make('cactus', 0.2, 0.78)]
    },
    {
      keys: ['castle'],
      actors: [make('castle', 0.5, 0.72)]
    }
  ];
  for (const r of rules) {
    if (r.keys.some((k) => t.includes(k))) return r.actors;
  }
  return [];
}
function sanitizeEase(ease: any): 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' {
  return ['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(ease) ? ease : 'linear';
}
function sanitizeKeyframe(
  k: any,
  defaults: { x: number; y: number; scale: number },
  durationMs: number,
  maxScale = 10
) {
  const t = clamp(k?.t, 0, Math.max(0, durationMs), 0);
  const x = clamp01(k?.x ?? defaults.x);
  const y = clamp01(k?.y ?? defaults.y);
  const rotate = typeof k?.rotate === 'number' && Number.isFinite(k.rotate) ? k.rotate : 0;
  const scale = clamp(k?.scale, 0.05, maxScale, defaults.scale);
  const ease = sanitizeEase(k?.ease);
  return { t, x, y, rotate, scale, ease };
}

function sanitizeEmojiActor(actor: any, index: number, durationMs: number, prefix: string) {
  const a: any = typeof actor === 'object' && actor ? actor : {};
  if (typeof a.id !== 'string' || !a.id.trim()) a.id = `${prefix}-${index + 1}`;
  a.type = 'emoji';
  if (typeof a.emoji !== 'string' || !a.emoji.trim()) a.emoji = '😀';
  if (typeof a.start !== 'object' || !a.start) a.start = {};
  a.start.x = clamp01(a.start.x);
  a.start.y = clamp01(a.start.y);
  const maxScale = prefix === 'bg' ? 8 : 10;
  const minScale = prefix === 'bg' ? 2 : 0.05;
  const defaultScale = prefix === 'bg' ? 3 : 1;
  a.start.scale = clamp(a.start.scale, minScale, maxScale, defaultScale);
  if (!Array.isArray(a.tracks) || a.tracks.length === 0) {
    a.tracks = [
      sanitizeKeyframe(
        { t: 0, x: a.start.x, y: a.start.y, rotate: 0, scale: a.start.scale, ease: 'linear' },
        { x: a.start.x, y: a.start.y, scale: a.start.scale },
        durationMs,
        maxScale
      )
    ];
  } else {
    const defaults = { x: a.start.x, y: a.start.y, scale: a.start.scale };
    a.tracks = a.tracks.map((k: any) => sanitizeKeyframe(k, defaults, durationMs, maxScale));
  }
  if (typeof a.loop !== 'string' || !['float', 'none'].includes(a.loop)) a.loop = 'none';
  if (typeof a.z !== 'number') a.z = 0;
  if (typeof a.ariaLabel !== 'string') a.ariaLabel = 'emoji actor';
  a.flipX = a.flipX === true;
  if (!Array.isArray(a.effects)) a.effects = [];
  else a.effects = a.effects.filter((e: any) => VALID_EFFECTS.includes(e));
  return a;
}

// 4) Ensure we always produce/repair a readable caption in normalizeAnimation
function normalizeAnimation(candidate: any) {
  const anim: any = typeof candidate === 'object' && candidate ? candidate : {};
  if (typeof anim.title !== 'string' || !anim.title.trim()) anim.title = 'Untitled Animation';
  if (typeof anim.fps !== 'number' || !Number.isFinite(anim.fps)) anim.fps = 30;

  if (!Array.isArray(anim.scenes)) anim.scenes = [];
  if (anim.scenes.length === 0) {
    anim.scenes = [
      {
        id: 'scene-1',
        duration_ms: 3000,
        backgroundActors: [
          {
            id: 'bg-1',
            type: 'emoji',
            emoji: '🌇',
            start: { x: 0.5, y: 0.5, scale: 1 },
            tracks: [
              { t: 0, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' },
              { t: 3000, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' }
            ]
          }
        ],
        caption: 'Auto-generated scene.',
        actors: [
          {
            id: 'actor-1',
            type: 'emoji',
            emoji: '😀',
            start: { x: 0.5, y: 0.5, scale: 1 },
            tracks: [
              { t: 0, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' },
              { t: 3000, x: 0.8, y: 0.5, rotate: 0, scale: 1, ease: 'easeOut' }
            ],
            loop: 'none',
            z: 0,
            ariaLabel: 'emoji actor'
          }
        ],
        sfx: [{ at_ms: 500, type: 'ding' }]
      }
    ];
  }

  anim.scenes = anim.scenes.map((scene: any, i: number) => {
    const s: any = typeof scene === 'object' && scene ? scene : {};
    if (typeof s.id !== 'string' || !s.id.trim()) s.id = `scene-${i + 1}`;
    if (typeof s.duration_ms !== 'number' || !Number.isFinite(s.duration_ms)) s.duration_ms = 3000;

    if (!Array.isArray(s.actors) || s.actors.length === 0) {
      s.actors = [
        {
          id: 'actor-1',
          type: 'emoji',
          emoji: '😀',
          start: { x: 0.5, y: 0.5, scale: 1 },
          tracks: [
            { t: 0, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' },
            { t: s.duration_ms, x: 0.8, y: 0.5, rotate: 0, scale: 1, ease: 'easeOut' }
          ],
          loop: 'none',
          z: 0,
          ariaLabel: 'emoji actor'
        }
      ];
    }

    if (!Array.isArray(s.backgroundActors)) s.backgroundActors = [];
    // Backward compatibility: allow single `background` emoji
    if (typeof (s as any).background === 'string' && (s as any).background.trim()) {
      s.backgroundActors.unshift({
        id: 'bg-1',
        type: 'emoji',
        emoji: (s as any).background,
        start: { x: 0.5, y: 0.5, scale: 1 },
        tracks: [
          { t: 0, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' },
          { t: s.duration_ms, x: 0.5, y: 0.5, rotate: 0, scale: 1, ease: 'linear' }
        ]
      });
      delete (s as any).background;
    }
    s.backgroundActors = s.backgroundActors.map((actor: any, j: number) =>
      sanitizeEmojiActor(actor, j, s.duration_ms, 'bg')
    );

    if (s.backgroundActors.length === 0) {
      const bgActors = pickBackgroundActors(s.caption || anim.title || '', s.duration_ms);
      s.backgroundActors.push(
        ...bgActors.map((bg: any, idx: number) => sanitizeEmojiActor(bg, idx, s.duration_ms, 'bg'))
      );
    }

    s.actors = s.actors.map((actor: any, j: number) => {
      const a: any = typeof actor === 'object' && actor ? actor : {};
      if (typeof a.id !== 'string' || !a.id.trim()) a.id = `actor-${j + 1}`;

      if (a.type === 'composite') {
        a.type = 'composite';
        if (!Array.isArray(a.parts)) a.parts = [];
        a.parts = a.parts.map((part: any, k: number) => {
          const p: any = typeof part === 'object' && part ? part : {};
          if (typeof p.id !== 'string' || !p.id.trim()) p.id = `${a.id}-part-${k + 1}`;
          p.type = 'emoji';
          if (typeof p.emoji !== 'string' || !p.emoji.trim()) p.emoji = '😀';
          if (typeof p.start !== 'object' || !p.start) p.start = {};
          p.start.x = clamp01(p.start.x);
          p.start.y = clamp01(p.start.y);
          p.start.scale = clamp(p.start.scale, 0.05, 10, 1);
          if (!Array.isArray(p.tracks) || p.tracks.length === 0) {
            p.tracks = [
              sanitizeKeyframe(
                { t: 0, x: p.start.x, y: p.start.y, rotate: 0, scale: p.start.scale, ease: 'linear' },
                { x: p.start.x, y: p.start.y, scale: p.start.scale },
                s.duration_ms
              )
            ];
          } else {
            const pDefaults = { x: p.start.x, y: p.start.y, scale: p.start.scale };
            p.tracks = p.tracks.map((kframe: any) => sanitizeKeyframe(kframe, pDefaults, s.duration_ms));
          }
          if (typeof p.loop !== 'string' || !['float', 'none'].includes(p.loop)) p.loop = 'none';
          if (typeof p.z !== 'number') p.z = 0;
          if (typeof p.ariaLabel !== 'string') p.ariaLabel = 'emoji actor';
          p.flipX = p.flipX === true;
          return p;
        });

        if (typeof a.start !== 'object' || !a.start) a.start = {};
        a.start.x = clamp01(a.start.x);
        a.start.y = clamp01(a.start.y);
        a.start.scale = clamp(a.start.scale, 0.05, 10, 1);
        if (!Array.isArray(a.tracks) || a.tracks.length === 0) {
          a.tracks = [
            sanitizeKeyframe(
              { t: 0, x: a.start.x, y: a.start.y, rotate: 0, scale: a.start.scale, ease: 'linear' },
              { x: a.start.x, y: a.start.y, scale: a.start.scale },
              s.duration_ms
            )
          ];
        } else {
          const defaults = { x: a.start.x, y: a.start.y, scale: a.start.scale };
          a.tracks = a.tracks.map((k: any) => sanitizeKeyframe(k, defaults, s.duration_ms));
        }
        if (typeof a.loop !== 'string' || !['float', 'none'].includes(a.loop)) a.loop = 'none';
        if (typeof a.z !== 'number') a.z = 0;
        if (typeof a.ariaLabel !== 'string') a.ariaLabel = 'composite actor';
        a.flipX = a.flipX === true;
        if (!Array.isArray(a.effects)) a.effects = [];
        else a.effects = a.effects.filter((e: any) => VALID_EFFECTS.includes(e));
        return a;
      } else {
        return sanitizeEmojiActor(a, j, s.duration_ms, 'actor');
      }
    });

    if (!Array.isArray(s.sfx)) s.sfx = [];
    s.sfx = s.sfx.map((fx: any) => {
      const f: any = typeof fx === 'object' && fx ? fx : {};
      if (typeof f.at_ms !== 'number' || !Number.isFinite(f.at_ms)) f.at_ms = 0;
      if (!['pop', 'whoosh', 'ding'].includes(f.type)) f.type = 'ding';
      return f;
    });

    if (!Array.isArray(s.effects)) s.effects = [];
    else s.effects = s.effects.filter((e: any) => VALID_EFFECTS.includes(e));
    // Ensure caption existence and clarity
    if (typeof s.caption !== 'string' || !isCaptionClear(s.caption)) {
      s.caption = synthesizeCaption(s);
    } else {
      s.caption = toSentenceCase(s.caption);
    }

    return s;
  });

  return anim;
}

// Wrap Responses API call with logging and text.format=json_object
async function callModel(
  inputMessages: Array<{ role: 'system' | 'user'; content: string }>,
  _opts?: { previousErrors?: string; lastRaw?: string; attempt?: number }
) {
  // Build request body using any to avoid over-strict typings in some SDK versions
  const requestBody: any = {
    model: 'gpt-5-nano',
    input: inputMessages,
    // Use text.format in Responses API (response_format is not supported here)
    text: {
      format: { type: 'json_object' }, // valid values: 'json_object' | 'text' | 'json_schema'
      verbosity: 'low'
    },
    // Reduce reasoning so tokens go to the JSON output instead of hidden chain-of-thought
    reasoning: { effort: 'low' as const },
    // Keep a modest cap to avoid hitting incomplete due to reasoning tokens
    max_output_tokens: 12000
  };

  console.info('[storyboard] OpenAI request input:', safeStringify(inputMessages));
  console.info('[storyboard] OpenAI request options:', safeStringify(requestBody));

  const response = await openai.responses.create(requestBody);

  console.info('[storyboard] OpenAI raw response:', safeStringify(response));

  return response;
}

async function generateAnimationJson(story: string, previousErrors?: string, lastRaw?: string) {
    const baseMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `${storyboardPrompt}\n\n${STRICT_JSON_INSTRUCTION}` },
        { role: 'user', content: story }
    ] as const;

    const retryNote = previousErrors
        ? [
            {
                role: 'system' as const,
                content:
                    'Your previous output failed validation. Return a corrected JSON object that fully conforms to the schema. Do not omit required keys.'
            },
            lastRaw
                ? ({
                    role: 'user' as const,
                    content:
                        `Here were the validation errors:\n${previousErrors}\n\nThis was your previous JSON (fix it):\n${lastRaw}`
                })
                : ({ role: 'user' as const, content: `Validation errors:\n${previousErrors}` } as const)
        ]
        : [];

    // First call
    let response = await callModel([...baseMessages, ...retryNote], { previousErrors, lastRaw, attempt: 1 });

    // If incomplete or no content, retry with a shorter, stricter system prompt
    let content = extractOutputText(response);
    if (!content || response?.status === 'incomplete') {
        console.warn('[storyboard] Incomplete or empty output detected. Retrying with stricter/shorter prompt.');
        const minimalSystem = [
            'Output ONLY a single valid JSON object.',
            'It MUST conform to this JSON Schema and include all required keys.',
            'No markdown. No extra text.'
        ].join(' ');
        const minimalMessages = [
            { role: 'system' as const, content: minimalSystem + '\n' + JSON.stringify(animationJsonSchema) },
            { role: 'user' as const, content: story }
        ];
        response = await callModel(minimalMessages, { previousErrors, lastRaw, attempt: 2 });
        content = extractOutputText(response);
    }

    // Last-resort: scan response JSON for first object
    if (!content) {
        const raw = JSON.stringify(response);
        const jsonStr = findFirstJsonObjectString(raw);
        if (jsonStr) content = jsonStr;
    }

    console.info('[storyboard] Extracted content:', content ? (content.length > 20000 ? content.slice(0, 20000) + '... [truncated]' : content) : 'undefined');

    if (!content) throw new Error('Model did not return content');

    if (content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
    }
    return content;
}

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { story } = Body.parse(json);

        // Log incoming request
        console.info('[storyboard] HTTP request body:', safeStringify(json));

        // First attempt
        let raw = await generateAnimationJson(story);

        let parsedJson: unknown;
        try {
            parsedJson = JSON.parse(raw);
        } catch {
            // Retry with explicit repair instruction including the raw text
            raw = await generateAnimationJson(
                story,
                'Invalid JSON syntax (failed to parse). Return a single valid JSON object.',
                raw
            );
            parsedJson = JSON.parse(raw);
        }

        // Normalize to ensure required keys exist and at least one scene
        const normalized = normalizeAnimation(parsedJson);

        // Validate with Zod; retry once with feedback if needed
        try {
            const parsed = animationSchema.parse(normalized);
            return new Response(JSON.stringify({ animation: parsed }), {
                headers: { 'content-type': 'application/json' },
                status: 200
            });
        } catch (zerr: any) {
            // Log zod failure
            console.warn('[storyboard] Zod validation failed:', safeStringify(zerr?.errors ?? zerr?.issues ?? zerr));
            const errors = JSON.stringify(zerr?.errors ?? zerr?.issues ?? zerr, null, 2);
            const repairedRaw = await generateAnimationJson(story, errors, raw);
            const repairedJson = JSON.parse(repairedRaw);
            const repairedNormalized = normalizeAnimation(repairedJson);
            const parsed = animationSchema.parse(repairedNormalized);

            return new Response(JSON.stringify({ animation: parsed }), {
                headers: { 'content-type': 'application/json' },
                status: 200
            });
        }
    } catch (err: any) {
        console.error('[storyboard] Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), {
            headers: { 'content-type': 'application/json' },
            status: 400
        });
    }
}
