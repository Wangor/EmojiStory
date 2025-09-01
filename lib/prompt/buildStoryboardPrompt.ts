import { PromptConfig } from './config';
import { ACTORS } from '../assets/actors';
import { BACKGROUNDS } from '../assets/backgrounds';

export function buildStoryboardPrompt(config: PromptConfig) {
  const effectsList = config.effects
    .map((e) => `- "${e.name}": ${e.description}`)
    .join('\n');

  const actorsExamples = ACTORS
    .map((a) => `- "${a.id}" (${a.emoji}) scale ${a.scale}: ${a.description}`)
    .join('\n');

  const backgroundsExamples = BACKGROUNDS
    .map((b) => `- "${b.id}" (${b.emoji}) scale ${b.scale}: ${b.description}`)
    .join('\n');

  const systemPrompt = `You support the following visual effects that run at scene start and may be applied to scenes or actors via an "effects" array:\n${effectsList}\nUse only these names. Add effects when they enhance the story; omit otherwise.`;

  const storyboardPrompt = `You convert a short story into an animated storyboard JSON.
You may use any emoji for actors or backgrounds. These examples show common emoji with suggested default scales:
Actors:\n${actorsExamples}\nBackgrounds:\n${backgroundsExamples}\nConstraints:
 - Max ${config.maxScenes} scenes, max ${config.maxActorsPerScene} actors per scene, total duration <= ${config.maxTotalDurationMs} ms.
 - Use Unicode emoji for actors (type: 'emoji') or composite actors (type: 'composite' with "parts" listing emoji actors that move together).
 - Coordinates x,y are normalized 0..1.
 - For composite actors, each part has its own {x,y,scale} offset; always specify scale to reflect realistic proportions (e.g., a horse larger than its rider).
 - Every actor's start includes {x,y,scale}; pick scale values to approximate real-world size relations between items (mouse < cat < person < car < building). When an emoji isn't listed above, infer a reasonable scale.
 - Use flipX:true when an emoji or part should face left; omit flipX or set false for the default right-facing orientation.
 - Keyframes are in ms relative to the scene.
 - The caption is used to tell the story and what the actual scene tells about the story
 - Each scene can include backgroundActors (array of emoji actors) rendered behind foreground actors. The background actors are the things that define the scene, it cannot be an active actor playing in the scene! It always needs a background built out of background actors. Choose backgrounds that match the setting and use generous scales (roughly 2-5) so they anchor the scene without overwhelming it.
 - When relevant, include an "effects" array using the effect names defined in the system prompt.
Output ONLY valid JSON that matches the types: Keyframe, EmojiActor, Actor, Scene, Animation.
Ensure final keyframes align with each scene's duration. No prose, no markdown; JSON only.`;

  return { systemPrompt, storyboardPrompt };
}
