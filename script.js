/* 1. APPWRITE INITIALIZATION */
const { Client, Databases, ID, Query } = Appwrite;
const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a6a12c001e23614e9c'); //

const databases = new Databases(client);
const DATABASE_ID = '69a6e33a000364134b57'; //
const POST_COLLECTION = 'post';
const COMMENT_COLLECTION = 'comments';

/* 2. MUSIC PLAYER SETTINGS */
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
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime) {
                audio.currentTime = details.seekTime;
                updatePositionState();
            }
        });
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
    if (newIndex >= 0 && newIndex < playlist.length) {
        startTrack(newIndex);
    } else if (newIndex >= playlist.length) {
        startTrack(0);
    } else if (newIndex < 0) {
        startTrack(playlist.length - 1);
    }
}

/* 3. USER SESSION & COMMANDS */
let myUser = sessionStorage.getItem('username') || "User_" + Math.floor(100 + Math.random() * 900);
sessionStorage.setItem("username", myUser);

function getUsernameColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
    return `hsl(${Math.abs(hash % 360)}, 70%, 80%)`;
}

document.getElementById("post-text")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const inputVal = e.target.value.trim().toLowerCase();
        const playMatch = inputVal.match(/^@play\s*(\d+)$/);
        if (playMatch) {
            e.preventDefault();
            startTrack(parseInt(playMatch[1]) - 1);
            e.target.value = ""; 
        }
    }
});

/* 4. FORMAT POST (BBCode & Links) */
function formatPost(text) {
    if (!text) return "";
    let output = text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    output = output.replace(urlRegex, (url) => {
        try {
            const host = new URL(url).hostname.toLowerCase();
            let label = host.split('.')[0];
            if (host.includes("t.me")) label = "telegram";
            else if (host.includes("pin.it")) label = "pinterest";
            return `<a href="${url}" target="_blank" class="custom-link">•&nbsp;${label}</a>`;
        } catch (e) { return `<a href="${url}" target="_blank" class="custom-link">•&nbsp;link</a>`; }
    });

    for (let i = 0; i < 3; i++) {
        output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>')
                       .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
                       .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>')
                       .replace(/\[s=([0-9.]+)\]([\s\S]*?)\[\/s\]/gi, '<span style="font-size:$1em">$2</span>')
                       .replace(/\[c=([\w#]+)\]([\s\S]*?)\[\/c\]/gi, (match, color, content) => {
                           if (color.toLowerCase() === 'rainbow') return `<span class="rainbow">${content}</span>`;
                           if (color.toLowerCase() === 'glow') return `<span class="glow">${content}</span>`;
                           let finalColor = /^[A-Fa-f0-9]{3,6}$/.test(color) ? '#' + color : color;
                           return `<span style="color:${finalColor}">${content}</span>`;
                       })
                       .replace(/\[f=([a-zA-Z0-9 ]+)\]([\s\S]*?)\[\/f\]/gi, '<span style="font-family:\'$1\'">$2</span>');
    }
    return output.replace(/\n/g, "<br>");
}

function timeAgo(dateString) {
    const diffMs = new Date() - new Date(dateString);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMs < 60000) return "Just now";
    return diffDays === 0 ? new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
           (diffDays === 1 ? "Yesterday" : diffDays + " days ago");
}

/* 5. UI ACTIONS */
window.toggleReadMore = (id) => {
    const body = document.getElementById("body-" + id);
    const btn = document.getElementById("rm-" + id);
    body.classList.toggle("collapsed");
    body.classList.toggle("expanded");
    btn.innerText = body.classList.contains("collapsed") ? "Read more..." : "Show less";
};

window.toggleComments = (postId) => {
    const el = document.getElementById("comments-container-" + postId);
    if (el) el.style.display = (el.style.display === "none") ? "block" : "none";
};

/* 6. DATA ACTIONS (SUBMIT & LOAD) */
async function submitPost() {
    const textarea = document.getElementById("post-text");
    const rawText = textarea?.value.trim();
    if (!rawText || rawText.startsWith("@play")) return;

    try {
        await databases.createDocument(DATABASE_ID, POST_COLLECTION, ID.unique(), {
            username: myUser,
            body: rawText //
        });
        textarea.value = "";
        loadPosts();
    } catch (err) { alert("Post Error: " + err.message); }
}

window.addComment = async (postId) => {
    const input = document.getElementById("in-" + postId);
    const text = input?.value.trim();
    if (!text) return;

    try {
        await databases.createDocument(DATABASE_ID, COMMENT_COLLECTION, ID.unique(), {
            post_id: postId,
            username: myUser,
            body: text //
        });
        // Update updatedAt to bump post to top
        await databases.updateDocument(DATABASE_ID, POST_COLLECTION, postId, { username: myUser });
        input.value = "";
        loadPosts();
    } catch (err) { alert("Comment Error: " + err.message); }
};

async function loadPosts() {
    const feed = document.getElementById("feed");
    if (!feed) return;

    try {
        const postRes = await databases.listDocuments(DATABASE_ID, POST_COLLECTION, [Query.orderDesc('$updatedAt')]);
        const commentRes = await databases.listDocuments(DATABASE_ID, COMMENT_COLLECTION);
        
        feed.innerHTML = "";
        postRes.documents.forEach(p => {
            const pComments = commentRes.documents.filter(c => c.post_id === p.$id);
            const userColor = getUsernameColor(p.username);
            feed.innerHTML += `
                <div class="post-card">
                    <div><span class="username-text" style="color: ${userColor}">${p.username}</span> <span class="post-time">| ${timeAgo(p.$createdAt)}</span></div>
                    <div id="body-${p.$id}" class="post-body collapsed">${formatPost(p.body)}</div>
                    <div><span id="rm-${p.$id}" class="read-more-btn" onclick="toggleReadMore('${p.$id}')">Read more...</span></div>
                    <div class="post-actions"><span class="comment-toggle" onclick="toggleComments('${p.$id}')">${pComments.length} comments</span></div>
                    <div id="comments-container-${p.$id}" class="comment-section" style="display:none">
                        ${pComments.map(c => `<div class="comment-box"><small><span style="color:${getUsernameColor(c.username)}">${c.username}</span>: ${formatPost(c.body)}</small></div>`).join("")}
                        <div class="comment-input-row">
                            <input type="text" id="in-${p.$id}" class="comment-input" placeholder="Comments...">
                            <button class="send-btn" onclick="addComment('${p.$id}')">Send</button>
                        </div>
                    </div>
                </div>`;
            
            // Check if read more button is needed
            setTimeout(() => {
                const b = document.getElementById("body-" + p.$id);
                const r = document.getElementById("rm-" + p.$id);
                if (b && b.scrollHeight > b.clientHeight) r.style.display = "inline";
            }, 100);
        });
    } catch (err) { console.error("Load error:", err); }
}

// Initial Load
loadPosts();