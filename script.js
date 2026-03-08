/* 1. SUPABASE INITIALIZATION */
const _supabase = window.supabase.createClient(
    "https://jyhxqlwhvptzmvtzrytg.supabase.co",
    "sb_publishable_J9NfYlWjgioW_xTDEhCWrg_kQe6kCil"
);

// 2. MUSIC PLAYER SETTINGS (Playlist & Logic)

let currentTrackIndex = 0;
let isPlaying = false;
let audio = new Audio(); 

if (typeof playlist !== 'undefined' && playlist.length > 0) {
    audio.src = playlist[currentTrackIndex].url;
}

function updateMusicUI() {
    const statusEl = document.getElementById("headerStatus");
    const postInput = document.getElementById("post-text");
    const currentSong = playlist[currentTrackIndex];

    // Header မှာ 🟢/🔴 Status လေးပဲ ပြတော့မယ် (နာမည်မပါတော့ဘူး)
    if (statusEl) {
        statusEl.style.color = isPlaying ? '#00ff00' : '#ff0000';
        statusEl.innerText = isPlaying ? "🟢" : "🔴";
    }

    // Placeholder ထဲမှာပဲ သီချင်းနာမည်နဲ့ အချိန်ကို ရှင်းရှင်းလေးပြမယ်
    if (postInput && postInput.value.trim() === "") {
        const fmt = (s) => (isNaN(s) || !isFinite(s)) ? "0:00" : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
        postInput.placeholder = `${currentSong.name}\n` + 
                       `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    }
}

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => { isPlaying = true; updateMusicUI(); }).catch(e => console.error(e));
    } else {
        audio.pause(); isPlaying = false; updateMusicUI();
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
    audio.play().then(() => { isPlaying = true; updateMusicUI(); }).catch(e => console.error(e));
}

audio.ontimeupdate = updateMusicUI;
audio.onended = () => playNext();

// Command Listener (#next, #play, #pause ပဲ ကျန်တော့မယ်)
document.getElementById("post-text")?.addEventListener("input", function(e) {
    const cmd = e.target.value.trim().toLowerCase();
    if (cmd === "#next") {
        playNext();
        e.target.value = "";
    } else if (cmd === "#play" || cmd === "#pause") {
        toggleMusic();
        e.target.value = "";
    }
});

/* 3. USER SESSION MANAGEMENT */
let myUser = sessionStorage.getItem('username');
if (!myUser) {
    myUser = "User_" + Math.floor(100 + Math.random() * 900);
    sessionStorage.setItem("username", myUser);
}

/* 4. FORMAT POST FUNCTION (Links & Formatting) */
function formatPost(text) {
    if (!text) return "";
    let output = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    output = output.replace(urlRegex, (url) => {
        let label = url;
        try {
            const u = new URL(url);
            const host = u.hostname.toLowerCase();
            if (host.includes("facebook.com") || host.includes("fb.watch")) label = "• facebook";
            else if (host.includes("instagram.com")) label = "• instagram";
            else if (host.includes("tiktok.com")) label = "• tiktok";
            else if (host.includes("youtube.com") || host.includes("youtu.be")) label = "• youtube";
            else if (host.includes("twitter.com") || host.includes("x.com")) label = "• twitter";
            else if (host.includes("t.me")) label = "• telegram";
            else if (host.includes("pinterest.com") || host.includes("pin.it")) label = "• pinterest";
            else if (host.includes("drive.google.com")) label = "• google drive";
            else if (host.includes("docs.google.com")) label = "• google docs";
            else label = u.hostname.replace('www.', '');
            return `<a href="${url}" target="_blank" class="custom-link">${label}</a>`;
        } catch (e) { return `<a href="${url}" target="_blank" class="custom-link">${url}</a>`; }
    });

    for (let i = 0; i < 3; i++) {
        output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
        output = output.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
        output = output.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
        output = output.replace(/\[s=([0-9.]+)\]([\s\S]*?)\[\/s\]/gi, '<span style="font-size:$1em">$2</span>');
        output = output.replace(/\[c=#([A-Fa-f0-9]{6})\]([\s\S]*?)\[\/c\]/gi, '<span style="color:#$1">$2</span>');
    }
    return output.replace(/\n/g, "<br>");
}

/* 5. TIME AGO LOGIC */
function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 60000) return "Just now";
    if (diffDays === 0) return past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return "Yesterday";
    return diffDays + " days ago";
}

/* 6. UI ACTIONS (Toggles & Save) */
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

function savePost(user, time, text) {
    const content = `User: ${user}\nTime: ${time}\n\n${text.replace(/<\/?[^>]+(>|$)/g, "")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "post.txt";
    a.click();
}

/* 7. SUBMIT POST (Support Hacker Commands) */
async function submitPost() {
    const textarea = document.getElementById("post-text");
    if (!textarea) return;
    const rawText = textarea.value.trim();
    const cmd = rawText.toUpperCase();

    if (!rawText) return;

    // Commands - Case Sensitive မဖြစ်အောင် လုပ်ထားပါတယ်
    if (cmd === "#N3XT") { playNext(); textarea.value = ""; return; }
    if (cmd === "#P4US3" || cmd === "#PL4Y") { toggleMusic(); textarea.value = ""; return; }
    if (cmd === "#CL34R") { textarea.value = ""; return; }

    const now = new Date().toISOString();
    const { error } = await _supabase.from("posts").insert([{
        username: myUser,
        body: rawText,
        created_at: now,
        last_activity: now
    }]);

    if (error) {
        console.error("Insert Error:", error);
    } else {
        textarea.value = "";
        loadPosts();
    }
}

/* 8. LOAD POSTS & COMMENTS */
async function addComment(postId) {
    const input = document.getElementById("in-" + postId);
    const text = input.value.trim();
    if (!text) return;
    const now = new Date().toISOString();
    await _supabase.from("comments").insert([{ post_id: postId, username: myUser, body: text, created_at: now }]);
    await _supabase.from("posts").update({ last_activity: now }).eq("id", postId);
    loadPosts();
}

async function loadPosts() {
    const feed = document.getElementById("feed");
    if (!feed) return;

    // ၁၄ ရက်ကျော်တာတွေကို အလိုအလျောက် ဖြတ်မယ်
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    await _supabase.from("posts").delete().lt("last_activity", fourteenDaysAgo.toISOString());

    const { data: posts } = await _supabase.from("posts").select("*").order("last_activity", { ascending: false });
    const { data: comments } = await _supabase.from("comments").select("*");

    feed.innerHTML = "";
    if (!posts) return;

    posts.forEach(p => {
        const postComments = comments ? comments.filter(c => String(c.post_id) === String(p.id)) : [];
        const displayTime = timeAgo(p.created_at);

        feed.innerHTML += `
            <div class="post-card">
                <div>
                    <span class="username-text">${p.username}</span>
                    <span class="post-time ${p.updated_at ? 'time-orange':'time-green'}">| ${displayTime}</span>
                </div>
                <div id="body-${p.id}" class="post-body collapsed">${formatPost(p.body)}</div>
                <div><span id="rm-${p.id}" class="read-more-btn" onclick="toggleReadMore('${p.id}')" style="display:none">Read more...</span></div>
                <div class="post-actions">
                    <div class="action-row">
                        <div class="action-left"><span class="comment-toggle" onclick="toggleComments('${p.id}')">${postComments.length} comments</span></div>
                        <div class="action-right"><span class="save-btn" onclick="savePost('${p.username}','${displayTime}',\`${p.body.replace(/`/g, "\\`")}\`)">save</span></div>
                    </div>
                </div>
                <div id="comments-container-${p.id}" class="comment-section" style="display:none">
                    ${postComments.map(c => `<div class="comment-box"><small><span class="username-text">${c.username}</span>: ${formatPost(c.body)}</small></div>`).join("")}
                    <div class="comment-input-row">
                        <input type="text" id="in-${p.id}" class="comment-input" placeholder="Reply...">
                        <button class="send-btn" onclick="addComment('${p.id}')">Send</button>
                    </div>
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
updateMusicUI();