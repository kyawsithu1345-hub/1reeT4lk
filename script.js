/* 1. SUPABASE INITIALIZATION */
const _supabase = window.supabase.createClient(
    "https://jyhxqlwhvptzmvtzrytg.supabase.co",
    "sb_publishable_J9NfYlWjgioW_xTDEhCWrg_kQe6kCil"
);

/* 2. MUSIC PLAYER SETTINGS (Media Session Focused with Duration) */
let currentTrackIndex = 0;
let audio = new Audio(); 

// Browser Player မှာ Duration နဲ့ Progress Bar ပြပေးဖို့ Function
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
    if ('mediaSession' in navigator && playlist.length > 0) {
        const track = playlist[currentTrackIndex];
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: "1reeT4lk Player",
            artwork: [
                { 
                    src: 'logo.png',
                    sizes: '512x512', 
                    type: 'image/png' 
                },
                { 
                    src: 'logo.png', 
                    sizes: '617x617', 
                    type: 'image/png' 
                }
            ]
        });

        // Duration ကို စတင်သတ်မှတ်ခြင်း
        updatePositionState();

        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playAdjacent(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => playAdjacent(1));
        
        // Progress bar ကို ဆွဲပြီး အချိန်ရွှေ့နိုင်ရန်
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime) {
                audio.currentTime = details.seekTime;
                updatePositionState();
            }
        });
    }
}

function startTrack(index) {
    if (index >= 0 && index < playlist.length) {
        currentTrackIndex = index;
        audio.pause();
        audio.src = playlist[currentTrackIndex].url;
        audio.load();
        audio.play()
            .then(() => {
                updateMediaSession();
            })
            .catch(err => console.log("Interaction required."));
    }
}

// သီချင်း Load ဖြစ်ပြီး Duration သိရတာနဲ့ Browser ကို အကြောင်းကြားရန်
audio.onloadedmetadata = () => {
    updatePositionState();
};

// သီချင်းဖွင့်နေစဉ် Browser Player ထဲက အချိန်တန်းလေး ပြေးနေစေရန်
audio.ontimeupdate = () => {
    // တစ်စက္ကန့်ချင်းစီ update လုပ်ပေးခြင်း
    updatePositionState();
};

function playAdjacent(step) {
    let newIndex = currentTrackIndex + step;
    if (newIndex >= 0 && newIndex < playlist.length) {
        startTrack(newIndex);
    } else if (newIndex >= playlist.length) {
        startTrack(0);
    } else if (newIndex < 0) {
        startTrack(playlist.length - 1);
    }
}

audio.onended = () => playAdjacent(1);

document.getElementById("post-text")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const inputVal = e.target.value.trim().toLowerCase();
        const playMatch = inputVal.match(/^@play\s*(\d+)$/);

        if (playMatch) {
            e.preventDefault();
            const songNumber = parseInt(playMatch[1]);
            const targetIndex = songNumber - 1;
            if (targetIndex >= 0 && targetIndex < playlist.length) {
                startTrack(targetIndex);
                e.target.value = ""; 
            } else {
                alert("Song number not found!");
                e.target.value = ""; 
            }
        }
    }
});

/* 3. USER SESSION MANAGEMENT */
let myUser = sessionStorage.getItem('username');
if (!myUser) {
    myUser = "User_" + Math.floor(100 + Math.random() * 900);
    sessionStorage.setItem("username", myUser);
}

function getUsernameColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
    const h = Math.abs(hash % 360); 
    return `hsl(${h}, 70%, 80%)`;
}

/* 4. FORMAT POST & FONT SETTINGS */
function formatPost(text) {
    if (!text) return "";
    const maxLength = 10000;
    if (text.length > maxLength) { alert("Maximum length exceeded!"); text = text.substring(0, maxLength); }

    function escapeHTML(str) {
        const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, m => chars[m]);
    }

    let output = escapeHTML(text);
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // [FIXED] URL Mapping Logic with correct brackets
    output = output.replace(urlRegex, (url) => {
        try {
            const u = new URL(url);
            const host = u.hostname.toLowerCase();
            let label = "";

            if (host.includes("dropbox.com")) {
                label = "• dropbox";
            } else if (host.includes("twitter.com") || host.includes("x.com")) {
                label = "• twitter";
            } else if (host.includes("facebook.com")) label = "• facebook";
            else if (host.includes("instagram.com")) label = "• instagram";
            else if (host.includes("tiktok.com")) label = "• tiktok";
            else if (host.includes("youtube.com")) label = "• youtube";
            else if (host.includes("t.me")) label = "• telegram";
            else if (host.includes("pinterest.com") || host.includes("pin.it")) label = "• pinterest";
            else if (host.includes("supabase.co")) label = "• supabase";
            else if (host.includes("files.catbox.moe")) label = "• catbox";
            else if (host.includes("drive.google.com")) label = "• google drive";
            else if (host.includes("docs.google.com")) label = "• google docs";
            else label = "•&nbsp;" + url;

            return `<a href="${url}" target="_blank" class="custom-link">${label}</a>`;
        } catch (e) {
            return `<a href="${url}" target="_blank" class="custom-link">•&nbsp;${url}</a>`;
        }
    });

    // BBCode Logic
    for (let i = 0; i < 3; i++) {
        output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
        output = output.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
        output = output.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
        output = output.replace(/\[s=([0-9.]+)\]([\s\S]*?)\[\/s\]/gi, '<span style="font-size:$1em">$2</span>');
        output = output.replace(/\[c=([\w#]+)\]([\s\S]*?)\[\/c\]/gi, (match, color, content) => {
            const effect = color.toLowerCase();
            if (effect === 'rainbow') return `<span class="rainbow">${content}</span>`;
            if (effect === 'glow') return `<span class="glow">${content}</span>`;
            let finalColor = /^[A-Fa-f0-9]{3,6}$/.test(color) ? '#' + color : color;
            return `<span style="color:${finalColor}">${content}</span>`;
        });
        output = output.replace(/\[f=([a-zA-Z0-9 ]+)\]([\s\S]*?)\[\/f\]/gi, '<span style="font-family:\'$1\'">$2</span>');
    }
    return output.replace(/\n/g, "<br>");
}

/* 5. TIME AGO LOGIC */
function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMs < 60000) return `<span class="time-status">Just now</span>`;
    if (diffDays === 0) return `<span class="time-status">${past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    return `<span class="time-status">${diffDays === 1 ? "Yesterday" : diffDays + " days ago"}</span>`;
}

/* 6. UI ACTIONS */
function toggleReadMore(id) {
    const body = document.getElementById("body-" + id);
    const btn = document.getElementById("rm-" + id);
    if (body.classList.contains("expanded")) {
        body.classList.remove("expanded"); body.classList.add("collapsed");
        btn.innerText = "Read more...";
    } else {
        body.classList.remove("collapsed"); body.classList.add("expanded");
        btn.innerText = "Show less";
    }
}

function checkReadMore(body, btn) {
    if (body && body.scrollHeight > body.clientHeight) btn.style.display = "inline";
    else if (btn) btn.style.display = "none";
}

function toggleComments(postId) {
    const el = document.getElementById("comments-container-" + postId);
    if (el) el.style.display = (el.style.display === "none") ? "block" : "none";
}

/* 7. SUBMIT POST */
async function submitPost() {
    const textarea = document.getElementById("post-text");
    if (!textarea) return;
    const rawText = textarea.value.trim();
    
    if (!rawText || rawText.toLowerCase().startsWith("@play")) {
        textarea.value = "";
        return;
    }

    const now = new Date().toISOString();
    const { error } = await _supabase.from("posts").insert([{
        username: myUser, body: rawText, created_at: now, last_activity: now
    }]);

    if (error) console.error("Insert Error:", error);
    else { textarea.value = ""; loadPosts(); }
}

/* 8. LOAD POSTS & COMMENTS */
async function loadPosts() {
    const feed = document.getElementById("feed");
    if (!feed) return;
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    await _supabase.from("posts").delete().lt("last_activity", fourteenDaysAgo.toISOString());
    const { data: posts } = await _supabase.from("posts").select("*").order("last_activity", { ascending: false });
    const { data: comments } = await _supabase.from("comments").select("*");
    
    feed.innerHTML = "";
    if (!posts) return;

    posts.forEach(p => {
        const postComments = comments ? comments.filter(c => String(c.post_id) === String(p.id)) : [];
        const userColor = getUsernameColor(p.username);
        feed.innerHTML += `
            <div class="post-card">
                <div><span class="username-text" style="color: ${userColor}">${p.username}</span> <span class="post-time">| ${timeAgo(p.created_at)}</span></div>
                <div id="body-${p.id}" class="post-body collapsed">${formatPost(p.body)}</div>
                <div><span id="rm-${p.id}" class="read-more-btn" onclick="toggleReadMore('${p.id}')" style="display:none">Read more...</span></div>
                <div class="post-actions"><div class="action-row"><div class="action-left"><span class="comment-toggle" onclick="toggleComments('${p.id}')">${postComments.length} comments</span></div></div></div>
                <div id="comments-container-${p.id}" class="comment-section" style="display:none">
                    ${postComments.map(c => `<div class="comment-box"><small><span class="username-text" style="color: ${getUsernameColor(c.username)}">${c.username}</span>: ${formatPost(c.body)}</small></div>`).join("")}
                    <div class="comment-input-row"><input type="text" id="in-${p.id}" class="comment-input" placeholder="Comments..."><button class="send-btn" onclick="addComment('${p.id}')">Send</button></div>
                </div>
            </div>`;
        setTimeout(() => {
            const body = document.getElementById("body-" + p.id);
            const btn = document.getElementById("rm-" + p.id);
            checkReadMore(body, btn);
        }, 100);
    });
}

/* 9. ADD COMMENT FUNCTION */
async function addComment(postId) {
    const input = document.getElementById("in-" + postId);
    if (!input) return;
    const commentText = input.value.trim();
    if (!commentText) return;
    const now = new Date().toISOString();
    const { error: commentError } = await _supabase.from("comments").insert([{ post_id: postId, username: myUser, body: commentText, created_at: now }]);
    if (commentError) { alert("Comment Send Error"); return; }
    await _supabase.from("posts").update({ last_activity: now }).eq("id", postId);
    input.value = ""; loadPosts();
}

/* 10. INITIALIZE */
loadPosts();