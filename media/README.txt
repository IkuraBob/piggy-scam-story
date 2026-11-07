Drop videos here as <nodeId>.mp4 and images as <nodeId>.jpg.
With media: null in story.js these paths are discovered automatically.
For other filenames or PNG/WebM, set the node's media field in story.js.
Missing media uses the animated placeholder. No build step is required.
Audio naming and playback details: audio/README.txt.

Subtitles in story.js support an optional t value in seconds:
{ who: { en: "Mia", zh: "Mia" }, text: { en: "Hello", zh: "你好" }, t: 1.5 }
Without t, lines are evenly distributed over the narration/video duration.
With no narration or video, the placeholder supplies the playback clock.
For precise voice alignment, specify t on every line in ascending order.
