import { PassThrough, Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { getClip } from '../../../../lib/supabaseServer';
import type { Scene, Actor, EmojiActor, CompositeActor } from '../../../../components/AnimationTypes';

export const runtime = 'nodejs';

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function interpolateKeyframes(kfs: any[], t: number) {
    if (kfs.length === 0) return { x: 0.5, y: 0.5, scale: 1 };
    let prev = kfs[0];
    let next = kfs[kfs.length - 1];
    for (let i = 1; i < kfs.length; i++) {
        if (t <= kfs[i].t) {
            next = kfs[i];
            prev = kfs[i - 1];
            break;
        }
    }
    const span = next.t - prev.t || 1;
    const p = (t - prev.t) / span;
    return {
        x: lerp(prev.x, next.x, p),
        y: lerp(prev.y, next.y, p),
        scale: lerp(prev.scale ?? 1, next.scale ?? 1, p),
    };
}

function getEmojiFont(emojiFont?: string): string {
    // Map frontend font names to system-available fonts
    const fontMappings: Record<string, string> = {
        'Twemoji': 'Twemoji, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"',
        'Noto Color Emoji': '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"',
        'Noto Emoji': '"Noto Emoji", "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"',
        'OpenMoji': 'OpenMoji, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"',
        'Blobmoji': 'Blobmoji, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"'
    };

    if (emojiFont && fontMappings[emojiFont]) {
        return fontMappings[emojiFont];
    }

    // Default comprehensive font stack
    return '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", "Symbola"';
}

function drawEmoji(ctx: any, actor: EmojiActor, t: number, width: number, height: number, baseUnit: number, emojiFont?: string) {
    const state = interpolateKeyframes(actor.tracks, t);
    const size = baseUnit * (state.scale ?? 1);
    const x = state.x * width;
    const y = state.y * height;

    ctx.save();

    // Use the mapped font with comprehensive fallbacks
    const fontStack = getEmojiFont(emojiFont);
    ctx.font = `${size}px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';

    if (actor.flipX) {
        ctx.translate(x, y);
        ctx.scale(-1, 1);
        ctx.fillText(actor.emoji, 0, 0);
    } else {
        ctx.fillText(actor.emoji, x, y);
    }
    ctx.restore();
}

function drawComposite(ctx: any, actor: CompositeActor, t: number, width: number, height: number, baseUnit: number, emojiFont?: string) {
    const state = interpolateKeyframes(actor.tracks, t);
    const unit = baseUnit * (state.scale ?? 1);
    const x = state.x * width;
    const y = state.y * height;

    ctx.save();
    ctx.translate(x, y);
    if (actor.flipX) ctx.scale(-1, 1);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const part of actor.parts) {
        const ps = part.start?.scale ?? 1;
        const px = (part.start?.x ?? 0) * unit;
        const py = (part.start?.y ?? 0) * unit;
        const partSize = unit * ps;

        const fontStack = getEmojiFont(emojiFont);
        ctx.font = `${partSize}px ${fontStack}`;
        ctx.fillText(part.emoji, px, py);
    }
    ctx.restore();
}

function drawActor(ctx: any, actor: Actor, t: number, width: number, height: number, baseUnit: number, emojiFont?: string) {
    if (actor.type === 'emoji') return drawEmoji(ctx, actor as EmojiActor, t, width, height, baseUnit, emojiFont);
    if (actor.type === 'composite') return drawComposite(ctx, actor as CompositeActor, t, width, height, baseUnit, emojiFont);
}

async function registerFonts() {
    const fontDir = path.join(process.cwd(), 'public', 'fonts');
    if (!fs.existsSync(fontDir)) {
        console.log('Font directory does not exist:', fontDir);
        return;
    }

    const fontFiles = fs.readdirSync(fontDir).filter(file => !file.startsWith('.'));
    console.log('Available font files:', fontFiles);

    const fontMappings: Record<string, string> = {
        'twemoji.ttf': 'Twemoji',
        'NotoEmoji-Regular.ttf': 'Noto Emoji',
        'Blobmoji.ttf': 'Blobmoji'
    };

    let registeredFonts = 0;
    for (const file of fontFiles) {
        const fullPath = path.join(fontDir, file);
        const fontFamily = fontMappings[file];

        if (!fontFamily) {
            console.log(`No mapping for font file: ${file}, skipping`);
            continue;
        }

        try {
            // Only try to register TTF files with known mappings
            if (file.endsWith('.ttf')) {
                const buffer = fs.readFileSync(fullPath);
                if (buffer.length > 0) {
                    GlobalFonts.register(buffer, fontFamily);
                    registeredFonts++;
                    console.log(`Successfully registered font: ${fullPath} as ${fontFamily}`);
                } else {
                    console.warn(`Font file is empty: ${fullPath}`);
                }
            } else {
                console.log(`Unsupported font format: ${file}`);
            }
        } catch (error) {
            console.warn(`Failed to register font: ${fullPath}`, (error as Error).message);
        }
    }

    console.log(`Successfully registered ${registeredFonts} fonts`);
}

export async function GET(_req: Request, { params }: { params: { clipId: string } }) {
    const { clipId } = params;
    console.log('=== Video request received for', clipId, '===');

    try {
        const clip = await getClip(clipId);
        if (!clip) {
            console.warn('No clip found for', clipId);
            return new Response('Clip not found', { status: 404 });
        }

        console.log('Clip found:', {
            id: clip.id,
            title: clip.title,
            hasAnimation: !!clip.animation,
            animationType: typeof clip.animation
        });

        const animation = clip?.animation as {
            scenes: Scene[];
            fps?: number;
            emojiFont?: string;
            aspectRatio?: '16:9' | '9:16';
        } | undefined;
        if (!animation) {
            console.error('No animation data found for clip', clipId);
            return new Response('No animation data found', { status: 400 });
        }

        if (!animation.scenes || animation.scenes.length === 0) {
            console.error('No scenes found in animation for clip', clipId);
            return new Response('No scenes found', { status: 400 });
        }

        const fps = animation?.fps ?? 30;
        const emojiFont = animation?.emojiFont || clip?.emoji_font;
        const defaultBg = emojiFont === 'Noto Emoji' ? '#ffffff' : '#000000';
        console.log('Animation config:', {
            fps,
            emojiFont,
            sceneCount: animation.scenes.length,
            scenes: animation.scenes.map(s => ({
                id: s.id,
                duration_ms: s.duration_ms,
                actorCount: s.actors?.length || 0,
                bgActorCount: s.backgroundActors?.length || 0
            }))
        });

        // Register fonts with improved error handling
        await registerFonts();

        let width = 640;
        let height = Math.round((width * 9) / 16);
        const aspect = animation.aspectRatio ?? '16:9';
        if (aspect === '9:16') {
            height = 640;
            width = Math.round((height * 9) / 16);
        }
        const baseUnit = width / 10;
        console.log('Canvas dimensions:', { width, height, baseUnit, aspect });

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Test canvas functionality
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        const testBuffer = canvas.toBuffer('image/png');
        console.log('Canvas test - buffer size:', testBuffer.length, 'bytes');

        // Load watermark image
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        let watermark: any = null;
        try {
            watermark = await loadImage(logoPath);
        } catch (e) {
            console.warn('Failed to load watermark:', e);
        }

        // Calculate total frames needed
        let totalExpectedFrames = 0;
        for (const scene of animation.scenes) {
            const frames = Math.round((scene.duration_ms / 1000) * fps);
            totalExpectedFrames += frames;
        }

        console.log(`Will generate ${totalExpectedFrames} total frames`);

        if (totalExpectedFrames === 0) {
            console.error('No frames to generate - all scenes have 0 duration');
            return new Response('No frames to generate', { status: 400 });
        }

        // Create temp directory for frames
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const outputPath = path.join(tmpDir, `${clipId}.mp4`);

        // Clean up any existing file
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        console.log('Starting frame generation...');

        // Generate all frames first and save to temp files
        const frameFiles: string[] = [];
        let frameCount = 0;

        try {
            for (const [sceneIndex, scene] of animation.scenes.entries()) {
                const frames = Math.round((scene.duration_ms / 1000) * fps);
                console.log(`Generating scene ${sceneIndex} (${frames} frames)`);

                for (let i = 0; i < frames; i++) {
                    const t = (i / fps) * 1000;

                    // Clear canvas
                    ctx.fillStyle = scene.backgroundColor ?? defaultBg;
                    ctx.fillRect(0, 0, width, height);

                    // Draw background actors
                    for (const actor of scene.backgroundActors || []) {
                        try {
                            drawActor(ctx, actor, t, width, height, baseUnit, emojiFont);
                        } catch (e) {
                            console.warn(`Error drawing background actor:`, e);
                        }
                    }

                    // Draw main actors
                    for (const actor of scene.actors || []) {
                        try {
                            drawActor(ctx, actor, t, width, height, baseUnit, emojiFont);
                        } catch (e) {
                            console.warn(`Error drawing actor:`, e);
                        }
                    }

                    // Draw caption if present
                    if (scene.caption) {
                        const captionFontSize = scene.captionFontSize ?? 18;
                        const bottomMargin = captionFontSize; // approx 1em
                        const paddingX = captionFontSize * 0.75; // 0.75em horizontal padding
                        const paddingY = captionFontSize * 0.25; // 0.25em vertical padding

                        const emojiStack = getEmojiFont(emojiFont);
                        const captionFontStack = `system-ui, ${emojiStack}`;
                        ctx.font = `500 ${captionFontSize}px ${captionFontStack}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const metrics = ctx.measureText(scene.caption);
                        const textWidth = metrics.width;
                        const rectWidth = textWidth + paddingX * 2;
                        const rectHeight = captionFontSize + paddingY * 2;
                        const rectX = (width - rectWidth) / 2;
                        const rectY = height - bottomMargin - rectHeight;

                        // Background box
                        ctx.fillStyle = 'rgba(0,0,0,0.4)';
                        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

                        // Caption text
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(scene.caption, width / 2, rectY + rectHeight / 2);
                    }

                    // Draw watermark
                    if (watermark) {
                        ctx.save();
                        ctx.globalAlpha = 0.5;
                        const wmWidth = watermark.width * 0.5;
                        const wmHeight = watermark.height * 0.5;
                        ctx.drawImage(watermark, 0, 0, wmWidth, wmHeight);
                        ctx.restore();
                    }

                    // Save frame to temp file
                    const frameBuffer = canvas.toBuffer('image/png');
                    const framePath = path.join(tmpDir, `frame_${String(frameCount).padStart(6, '0')}.png`);
                    fs.writeFileSync(framePath, frameBuffer);
                    frameFiles.push(framePath);
                    frameCount++;

                    if (frameCount % 30 === 0) {
                        console.log(`Generated ${frameCount}/${totalExpectedFrames} frames`);
                    }
                }
            }

            console.log(`Generated all ${frameCount} frames, starting FFmpeg...`);

            // Set FFmpeg path
            ffmpeg.setFfmpegPath(ffmpegPath as string);

            // Use the most basic, compatible FFmpeg settings
            return new Promise<Response>((resolve, reject) => {
                const command = ffmpeg()
                    .input(path.join(tmpDir, 'frame_%06d.png'))
                    .inputFormat('image2')
                    .inputFPS(fps)
                    .videoCodec('libx264')
                    .outputOptions([
                        '-pix_fmt yuv420p',
                        `-vf scale=${width}:${height}:flags=lanczos`,
                        '-movflags +faststart'
                    ])
                    .fps(fps)
                    .format('mp4')
                    .output(outputPath)
                    .on('start', (cmd) => {
                        console.log('FFmpeg command:', cmd);
                    })
                    .on('progress', (progress) => {
                        console.log('FFmpeg progress:', Math.round(progress.percent || 0) + '%');
                    })
                    .on('stderr', (stderrLine) => {
                        console.log('FFmpeg stderr:', stderrLine);
                    })
                    .on('end', () => {
                        console.log('FFmpeg finished successfully');

                        if (fs.existsSync(outputPath)) {
                            const stats = fs.statSync(outputPath);
                            console.log('Output file size:', stats.size, 'bytes');

                            const videoBuffer = fs.readFileSync(outputPath);

                            // Clean up files
                            for (const frameFile of frameFiles) {
                                try { fs.unlinkSync(frameFile); } catch (e) {}
                            }
                            try { fs.unlinkSync(outputPath); } catch (e) {}

                            resolve(new Response(videoBuffer, {
                                headers: {
                                    'Content-Type': 'video/mp4',
                                    'Content-Disposition': `attachment; filename="${clipId}.mp4"`,
                                    'Content-Length': videoBuffer.length.toString(),
                                },
                            }));
                        } else {
                            reject(new Error('Output video file was not created'));
                        }
                    })
                    .on('error', (err, stdout, stderr) => {
                        console.error('FFmpeg error:', err.message);
                        if (stdout) console.error('FFmpeg stdout:', stdout);
                        if (stderr) console.error('FFmpeg stderr:', stderr);

                        // Clean up
                        for (const frameFile of frameFiles) {
                            try { fs.unlinkSync(frameFile); } catch (e) {}
                        }
                        if (fs.existsSync(outputPath)) {
                            try { fs.unlinkSync(outputPath); } catch (e) {}
                        }

                        reject(err);
                    })
                    .run();
            });
        } catch (error) {
            console.error('Error during frame generation:', error);

            // Clean up any temp files
            for (const frameFile of frameFiles) {
                try {
                    fs.unlinkSync(frameFile);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }

            return new Response('Error generating frames: ' + (error as Error).message, { status: 500 });
        }

    } catch (error) {
        console.error('Error in video generation:', error);
        return new Response('Error generating video: ' + (error as Error).message, { status: 500 });
    }
}
