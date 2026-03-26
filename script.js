/* 1. APPWRITE INITIALIZATION */
const { Client, Databases, ID, Query } = Appwrite;
const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a6a12c001e23614e9c'); // သင့်ရဲ့ Project ID

const databases = new Databases(client);
const DATABASE_ID = '69a6e33a000364134b57'; // 69a6a39d... အစား ဒါကို ပြောင်းထည့်ပါ// FT-db ID
const COLLECTION_ID = 'post';

/* 2. MUSIC PLAYER SETTINGS (Media Session) */
let currentTrackIndex = 0;
let audio = new Audio(); 

function updatePositionState() {
    if ('mediaSession' in navigator && 'setPositionState' in navigator) {
        if (!isNaN(audio.duration) && audio.duration > 0) {
            navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: audio.currentTime
            });
        }
    }
}

function updateMediaSession() {
    if ('mediaSession' in navigator && typeof playlist !== 'undefined' && playlist.length > 0) {
        const track = playlist[currentTrackIndex];
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: "1reeT4lk Player",
            artwork: [{ src: 'logo.png', sizes: '512x512', type: 'image/png' }]
        });
        updatePositionState();
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playAdjacent(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => playAdjacent(1));
    }
}

function startTrack(index) {
    if (typeof playlist !== 'undefined' && index >= 0 && index < playlist.length) {
        currentTrackIndex = index;
        audio.pause();
        audio.src = playlist[currentTrackIndex].url;
        audio.load();
        audio.play().then(() => updateMediaSession()).catch(() => {});
    }
}

audio.onloadedmetadata = () => updatePositionState();
audio.ontimeupdate = () => updatePositionState();
audio.onended = () => playAdjacent(1);

function playAdjacent(step) {
    if (typeof playlist === 'undefined') return;
    let newIndex = currentTrackIndex + step;
    if (newIndex >= 0 && newIndex < playlist.length) startTrack(newIndex);
    else if (newIndex >= playlist.length) startTrack(0);
    else if (newIndex < 0) startTrack(playlist.length - 1);
}

/* 3. USER SESSION & FORMATTING */
let myUser = sessionStorage.getItem('username') || "User_" + Math.floor(100 + Math.random() * 900);
sessionStorage.setItem("username", myUser);

function getUsernameColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
    return `hsl(${Math.abs(hash % 360)}, 70%, 80%)`;
}

function formatPost(text) {
    if (!text) return "";
    let output = text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    output = output.replace(urlRegex, (url) => `<a href="${url}" target="_blank" class="custom-link">•&nbsp;link</a>`);
    
    // BBCode Logic
    output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>')
                   .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
                   .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>')
                   .replace(/\n/g, "<br>");
    return output;
}

function timeAgo(dateString) {
    const diffMs = new Date() - new Date(dateString);
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return diffMin + "m ago";
    const diffDays = Math.floor(diffMs / 86400000);
    return diffDays === 0 ? new Date(dateString).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : diffDays + "d ago";
}

/* 4. UI ACTIONS */
window.toggleReadMore = (id) => {
    const body = document.getElementById("body-" + id);
    body.classList.toggle("collapsed");
    body.classList.toggle("expanded");
};

/* 5. SUBMIT POST (Appwrite) */
async function submitPost() {
    const textarea = document.getElementById("post-text");
    const rawText = textarea?.value.trim();
    if (!rawText || rawText.startsWith("@play")) return;

    try {
        await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
            username: myUser,
            body: rawText
        });
        textarea.value = "";
        loadPosts();
    } catch (err) { alert("Post တင်လို့မရပါ: " + err.message); }
}

/* 6. LOAD POSTS (Appwrite) */
async function loadPosts() {
    const feed = document.getElementById("feed");
    if (!feed) return;

    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.orderDesc('$createdAt'),
            Query.limit(50)
        ]);
        
        feed.innerHTML = "";
        response.documents.forEach(p => {
            const userColor = getUsernameColor(p.username);
            feed.innerHTML += `
                <div class="post-card">
                    <div><span class="username-text" style="color: ${userColor}">${p.username}</span> <span class="post-time">| ${timeAgo(p.$createdAt)}</span></div>
                    <div id="body-${p.$id}" class="post-body collapsed">${formatPost(p.body)}</div>
                    <div class="post-actions">
                        <span class="read-more-btn" onclick="toggleReadMore('${p.$id}')">Read more...</span>
                    </div>
                </div>`;
        });
    } catch (err) { console.error("Load error:", err); }
}

// Initial Load
loadPosts();