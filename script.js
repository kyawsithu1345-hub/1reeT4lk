/* 1. SUPABASE INITIALIZATION */
const _supabase = window.supabase.createClient(
    "https://jyhxqlwhvptzmvtzrytg.supabase.co",
    "sb_publishable_J9NfYlWjgioW_xTDEhCWrg_kQe6kCil"
);

/* 2. MUSIC PLAYER SETTINGS (Enhanced Easter Egg Logic) */
let currentTrackIndex = 0;
let isPlaying = false;
let audio = new Audio(); 

if (typeof playlist !== 'undefined' && playlist.length > 0) {
    audio.src = playlist[currentTrackIndex].url;
}

function updateMediaSession() {
    if ('mediaSession' in navigator && playlist.length > 0) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: playlist[currentTrackIndex].name,
            artist: "1reeT4lk Player",
            artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => toggleMusic());
        navigator.mediaSession.setActionHandler('pause', () => toggleMusic());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
}

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => { isPlaying = true; updateMediaSession(); }).catch(e => console.error(e));
    } else {
        audio.pause(); isPlaying = false;
    }
}

function playNext() {
    if (playlist.length > 1) {
        let nextIndex;
        do { nextIndex = Math.floor(Math.random() * playlist.length); } while (nextIndex === currentTrackIndex);
        currentTrackIndex = nextIndex;
    }
    audio.src = playlist[currentTrackIndex].url;
    audio.load();
    updateMediaSession();
    audio.play().then(() => { isPlaying = true; }).catch(e => console.error(e));
}

audio.onended = () => playNext();

// [FIXED] Music Command Logic - Enter ခေါက်မှ အလုပ်လုပ်စေရန် ပြင်ဆင်ထားသည်
document.getElementById("post-text")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const inputVal = e.target.value.trim().toLowerCase();
        const playMatch = inputVal.match(/^@play\s*(\d+)$/);

        if (playMatch) {
            e.preventDefault(); // Enter ကြောင့် Post တင်တာကို တားဆီးရန်
            const songNumber = parseInt(playMatch[1]);
            const targetIndex = songNumber - 1;

            if (targetIndex >= 0 && targetIndex < playlist.length) {
                currentTrackIndex = targetIndex;
                audio.src = playlist[currentTrackIndex].url;
                audio.load();
                updateMediaSession();
                audio.play().then(() => { isPlaying = true; }).catch(e => console.error(e));
                e.target.value = ""; 
            } else {
                const alerts = [
                    "Song number isn't available in playlist!",
                    "Try Again, find real number for play music.",
                    "Sorry, the number isn't available. Are you testing me? 😉"
                ];
                alert(alerts[Math.floor(Math.random() * alerts.length)]);
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
const allowedFonts = ["greatvibes"];

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
    output = output.replace(urlRegex, (url) => {
        try {
            const u = new URL(url);
            const host = u.hostname.toLowerCase();
            let label = host.includes("facebook.com") ? "• facebook" : 
                        host.includes("instagram.com") ? "• instagram" :
                        host.includes("tiktok.com") ? "• tiktok" :
                        host.includes("youtube.com") ? "• youtube" : 
                        host.includes("t.me") ? "• telegram" : u.hostname.replace('www.', '');
            return `<a href="${url}" target="_blank" class="custom-link">${label}</a>`;
        } catch (e) { return `<a href="${url}" target="_blank" class="custom-link">${url}</a>`; }
    });

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
    if (body.scrollHeight > body.clientHeight) btn.style.display = "inline";
    else btn.style.display = "none";
}

function toggleComments(postId) {
    const el = document.getElementById("comments-container-" + postId);
    el.style.display = (el.style.display === "none") ? "block" : "none";
}

/* 7. SUBMIT POST */
async function submitPost() {
    const textarea = document.getElementById("post-text");
    if (!textarea) return;
    const rawText = textarea.value.trim();
    
    // [FIXED] @play ပါတဲ့စာသားဆိုရင် Database ထဲ Post အဖြစ်မပို့ရန် စစ်ဆေးခြင်း
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
            if (body && btn) checkReadMore(body, btn);
        }, 50);
    });
}

/* 9. INITIALIZE */
loadPosts();

/* 10. ADD COMMENT FUNCTION */
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