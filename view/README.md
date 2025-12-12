# Video Components

This folder contains reusable video card components for the Movies section.

Video components are located in the `video/` subfolder.

## How to Add a New Video

1. Create a new HTML file in the `video/` folder (e.g., `video/video-card-4.html`)
2. Copy the structure from an existing video card file
3. Update the iframe `src` with your Facebook video embed URL
4. Update the video title and metadata
5. Add the new file path to `assets/js/script.js` in the `videoComponents` array

## Video Card Template

### Landscape Video (16:9)
```html
<div class="video-card landscape">
    <div class="video-wrapper landscape">
        <iframe src="YOUR_FACEBOOK_VIDEO_EMBED_URL" width="100%" height="314" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen="true"></iframe>
    </div>
    <div class="video-info">
        <h3 class="video-title">Your Video Title</h3>
        <p class="video-meta">From Facebook</p>
    </div>
</div>
```

### Portrait/Reels Video (9:16)
```html
<div class="video-card portrait">
    <div class="video-wrapper portrait">
        <iframe src="YOUR_FACEBOOK_REEL_EMBED_URL" width="100%" height="476" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen="true"></iframe>
    </div>
    <div class="video-info">
        <h3 class="video-title">Your Reel Title</h3>
        <p class="video-meta">From Facebook</p>
    </div>
</div>
```

**Note:** Add `landscape` class for horizontal videos and `portrait` class for vertical/reels videos. The videos will automatically adapt to their format.

## Getting Facebook Video Embed URL

1. Go to your Facebook video
2. Click the three dots (...) on the video
3. Select "Embed"
4. Copy the iframe code
5. Extract the `src` URL from the iframe

## Example

To add a 4th video:
1. Create `video/video-card-4.html` with your video iframe
2. In `assets/js/script.js`, add `'view/video/video-card-4.html'` to the `videoComponents` array

