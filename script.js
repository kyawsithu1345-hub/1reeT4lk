/* 1. SUPABASE INITIALIZATION */
const _supabase = window.supabase.createClient(
    "https://jyhxqlwhvptzmvtzrytg.supabase.co",
    "sb_publishable_J9NfYlWjgioW_xTDEhCWrg_kQe6kCil"
);

/* 2. MUSIC PLAYER SETTINGS (Playlist & Logic) */
let currentTrackIndex = 0;
let isPlaying = false;
let audio = new Audio(); 

if (typeof playlist !== 'undefined' && playlist.length > 0) {
    audio.src = playlist[currentTrackIndex].url;
}

function updateMusicUI() { }

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => { 
            isPlaying = true; 
            
            // [ADD-START] Notification မှာ သီချင်းနာမည်နှင့် ခလုတ်များပေါ်ရန်
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playlist[currentTrackIndex].name,
                    artist: "1reeT4lk Player",
                    artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }]
                });

                // Next Button နှင့် အခြား Control များပေါ်အောင် ဒီမှာပါ ထည့်ပေးရပါမယ်
                navigator.mediaSession.setActionHandler('play', () => toggleMusic());
                navigator.mediaSession.setActionHandler('pause', () => toggleMusic());
                navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            }
            // [ADD-END]     
        }).catch(e => console.error(e));
    } else {
        audio.pause(); 
        isPlaying = false;
    }
}

function playNext() {
    if (playlist.length > 1) {
        let nextIndex;
        do { 
            nextIndex = Math.floor(Math.random() * playlist.length); 
        } while (nextIndex === currentTrackIndex);
        currentTrackIndex = nextIndex;
    }
    
    audio.src = playlist[currentTrackIndex].url;
    audio.load();

    // [ADD-START] Next လုပ်တဲ့အခါ Notification ပါ လိုက်ပြောင်းရန်
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: playlist[currentTrackIndex].name,
            artist: "1reeT4lk Player",
            artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }]
        });
        
        navigator.mediaSession.setActionHandler('play', () => toggleMusic());
        navigator.mediaSession.setActionHandler('pause', () => toggleMusic());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
    // [ADD-END]

    audio.play().then(() => { isPlaying = true; }).catch(e => console.error(e));
}

audio.onended = () => playNext();

document.getElementById("post-text")?.addEventListener("input", function(e) {
    const cmd = e.target.value.trim().toLowerCase();
    if (cmd === "@next") {
        playNext();
        e.target.value = "";
    } else if (cmd === "@play" || cmd === "@pause") {
        toggleMusic();
        e.target.value = "";
    }
});

/* --- 3. USER SESSION MANAGEMENT --- */
let myUser = sessionStorage.getItem('username');
if (!myUser) {
    myUser = "User_" + Math.floor(100 + Math.random() * 900);
    sessionStorage.setItem("username", myUser);
}

// Function of Output Color Base On Name
function getUsernameColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360); 
    return `hsl(${h}, 70%, 80%)`;
}

/* 4.1.ALLOWED FONTS  */
const allowedFonts = ["greatvibes"];

/* 4.2 FORMAT POST FUNCTION (Text)*/
function formatPost(text) {
    if (!text) return "";
    
    // Character Check in (Raw text ) for Text Control 
    const maxLength = 1000;
    if (text.length > maxLength) {
        alert("Maximum " + maxLength + " characters allowed.");
        text = text.substring(0, maxLength);
    }
    
    let output = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    /* URL AND LABEL */
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
            else if (host.includes("supabase.co")) label = "• supabase";
            else if (host.includes("drive.google.com")) label = "• google drive";
            else if (host.includes("docs.google.com")) label = "• google docs";
            else label = u.hostname.replace('www.', '');
            return `<a href="${url}" target="_blank" class="custom-link">${label}</a>`;
        } catch (e) { return `<a href="${url}" target="_blank" class="custom-link">${url}</a>`; }
    });

    // HTML EFFECT (Add in loop for sure)
    for (let i = 0; i < 3; i++) {
        output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
        output = output.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
        output = output.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
        output = output.replace(/\[s=([0-9.]+)\]([\s\S]*?)\[\/s\]/gi, '<span style="font-size:$1em">$2</span>');
        
        // Color & Easter Eggs Section
        output = output.replace(/\[c=([\w#]+)\]([\s\S]*?)\[\/c\]/gi, (match, color, content) => {
            const effect = color.toLowerCase();
            if (effect === 'rainbow') return `<span class="rainbow">${content}</span>`;
            if (effect === 'glow') return `<span class="glow">${content}</span>`;
            
            // Check (#) and Auto-fill for Hex code
            let finalColor = color;
            if (/^[A-Fa-f0-9]{3,6}$/.test(finalColor)) finalColor = '#' + finalColor;
            
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

    let timeText = "";
    if (diffMs < 60000) timeText = "Just now";
    else if (diffDays === 0) timeText = past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    else if (diffDays === 1) timeText = "Yesterday";
    else timeText = diffDays + " days ago";
    return `<span class="time-status">${timeText}</span>`;
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

function savePost(user, time, text) {
    const content = `User: ${user}\nTime: ${time}\n\n${text.replace(/<\/?[^>]+(>|$)/g, "")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "post.txt";
    a.click();
}

/* 7. SUBMIT POST */
async function submitPost() {
    const textarea = document.getElementById("post-text");
    if (!textarea) return;
    const rawText = textarea.value.trim();
    const cmd = rawText.toUpperCase();
    if (!rawText) return;

    const now = new Date().toISOString();
    const { error } = await _supabase.from("posts").insert([{
        username: myUser,
        body: rawText,
        created_at: now,
        last_activity: now
    }]);

    if (error) console.error("Insert Error:", error);
    else { textarea.value = ""; loadPosts(); }
}

/* --- 8. LOAD POSTS & COMMENTS --- */
async function loadPosts() {
    const feed = document.getElementById("feed");
    if (!feed) return;

    // 14days After Delete   Post
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    await _supabase.from("posts").delete().lt("last_activity", fourteenDaysAgo.toISOString());

    // Get Data(SQL)
    const { data: posts } = await _supabase.from("posts").select("*").order("last_activity", { ascending: false });
    const { data: comments } = await _supabase.from("comments").select("*");

    feed.innerHTML = "";
    if (!posts) return;

    posts.forEach(p => {
        // Comment Calculate and Time Change
        const postComments = comments ? comments.filter(c => String(c.post_id) === String(p.id)) : [];
        const timeHTML = timeAgo(p.created_at);
        
        // ***Precautions in loop for Username Color
        const userColor = getUsernameColor(p.username);

        // Inner HTML
        feed.innerHTML += `
            <div class="post-card">
                <div>
                    <span class="username-text" style="color: ${userColor}">${p.username}</span>
                    <span class="post-time">| ${timeHTML}</span>
                </div>
                
                <div id="body-${p.id}" class="post-body collapsed">${formatPost(p.body)}</div>
                
                <div><span id="rm-${p.id}" class="read-more-btn" onclick="toggleReadMore('${p.id}')" style="display:none">Read more...</span></div>
                
                <div class="post-actions">
                    <div class="action-row">
                        <div class="action-left">
                            <span class="comment-toggle" onclick="toggleComments('${p.id}')">${postComments.length} comments</span>
                        </div>
                        <div class="action-right">
                            <span class="save-btn" onclick="savePost('${p.username}','Time', \`${p.body.replace(/`/g, "\\`")}\`)">save</span>
                        </div>
                    </div>
                </div>

                <div id="comments-container-${p.id}" class="comment-section" style="display:none">
                    ${postComments.map(c => `
                        <div class="comment-box">
                            <small>
                                <span class="username-text" style="color: ${getUsernameColor(c.username)}">${c.username}</span>: ${formatPost(c.body)}
                            </small>
                        </div>
                    `).join("")}
                    
                    <div class="comment-input-row">
                        <input type="text" id="in-${p.id}" class="comment-input" placeholder="Reply...">
                        <button class="send-btn" onclick="addComment('${p.id}')">Send</button>
                    </div>
                </div>
            </div>`;

        // Check Read More
        setTimeout(() => {
            const body = document.getElementById("body-" + p.id);
            const btn = document.getElementById("rm-" + p.id);
            if (body && btn) checkReadMore(body, btn);
        }, 50);
    });
}
    
/* --- 9. INITIALIZE --- */
loadPosts();
updateMusicUI();

/* --- 10. ADD COMMENT FUNCTION --- */
async function addComment(postId) {
    const input = document.getElementById("in-" + postId);
    if (!input) return;
    
    const commentText = input.value.trim();
    if (!commentText) return;

    const now = new Date().toISOString();

    // 1.New Data Insertion to comments table
    const { error: commentError } = await _supabase.from("comments").insert([{
        post_id: postId,
        username: myUser,
        body: commentText,
        created_at: now
    }]);

    if (commentError) {
        console.error("Comment Insert Error:", commentError);
        alert("Something Wrong! Comment Send Error");
        return;
    }

    // 2. Update last_activity in posts table (for Push Up Post)
    await _supabase.from("posts")
        .update({ last_activity: now })
        .eq("id", postId);

    // Clear Input & Post Load
    input.value = "";
    loadPosts();
}

// Update Process(13-3-2026)
// Code Comments Clear
// Add Section (10)
// Add Text Checker in S(4)
// Remove Datetime Section