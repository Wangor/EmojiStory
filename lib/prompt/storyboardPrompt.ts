export const STORYBOARD_PROMPT = `You convert a short story into an animated storyboard JSON.
Constraints:
- Max 10 scenes, max 5 actors per scene, total duration <= 90000 ms.
- Use Unicode emoji for actors (type: 'emoji') or composite actors (type: 'composite' with "parts" listing emoji actors that move together).
- Coordinates x,y are normalized 0..1.
- For composite actors, each part has its own {x,y,scale} offset; always specify scale to reflect realistic proportions (e.g., a horse larger than its rider).
- Every actor's start includes {x,y,scale}; choose scale values to convey real-world size relations between actors (dragons >> humans) and any props or utilities they carry.
- Use flipX:true when an emoji or part should face left; omit flipX or set false for the default right-facing orientation.
- Keyframes are in ms relative to the scene.
Output ONLY valid JSON that matches the types: Keyframe, EmojiActor, Actor, Scene, Animation.
Ensure final keyframes align with each scene's duration. No prose, no markdown; JSON only.`;

