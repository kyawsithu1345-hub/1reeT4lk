// 1. Supabase Initialization
const _supabase = window.supabase.createClient(
    "https://jyhxqlwhvptzmvtzrytg.supabase.co",
    "sb_publishable_J9NfYlWjgioW_xTDEhCWrg_kQe6kCil"
);

// 2. User Session
let myUser = sessionStorage.getItem('username');
if (!myUser) {
    myUser = 'User_' + Math.floor(100 + Math.random() * 900);
    sessionStorage.setItem('username', myUser);
}

const allowedFonts = ["sanpya","parabaik","badsignal","jetbrains","thuriya"];

// 3. SECURE FORMATTER (XSS Proof)
function formatPost(text) {
    // ပထမဆုံး အန္တရာယ်ရှိတဲ့ characters တွေကို HTML entities အနေနဲ့ ပြောင်းပစ်မယ်
    let output = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // ကျွန်တော်တို့ ခွင့်ပြုထားတဲ့ tag တွေကိုမှ ပြန်ဖော်မယ်
    output = output
        .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, "<b>$1</b>")
        .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, "<i>$1</i>")
        .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, "<u>$1</u>")
        .replace(/&lt;s=([0-9.]+)&gt;(.*?)&lt;\/s&gt;/g, '<span style="font-size:$1em;">$2</span>')
        .replace(/&lt;c=#([A-Fa-f0-9]{6})&gt;(.*?)&lt;\/c&gt;/g, '<span style="color:#$1">$2</span>')
        .replace(/&lt;f=([a-zA-Z0-9_-]+)&gt;(.*?)&lt;\/f&gt;/g, (m, font, content) => 
            allowedFonts.includes(font) ? `<span style="font-family:${font}">${content}</span>` : content
        )
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#8be9fd;">$1</a>')
        .replace(/\n/g, '<br>');

    // နောက်ဆုံးအဆင့် DOMPurify နဲ့ အပြီးသတ် စစ်မယ်
    return DOMPurify.sanitize(output, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'span', 'br', 'a'],
        ALLOWED_ATTR: ['style', 'href', 'target']
    });
}

// 4. Utils
function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
           diffDays === 1 ? "Yesterday" : diffDays + " days ago";
}

// 5. Logic Functions
async function submitPost() {
    const textarea = document.getElementById('post-text');
    const text = textarea.value.trim();
    if (!text) return;

    await _supabase.from('posts').insert([{ username: myUser, body: text, created_at: new Date().toISOString() }]);
    textarea.value = "";
    loadPosts();
}

async function addComment(postId) {
    const input = document.getElementById('in-' + postId);
    const text = input.value.trim();
    if (!text) return;

    await _supabase.from('comments').insert([{ post_id: postId, username: myUser, body: text, created_at: new Date().toISOString() }]);
    await _supabase.from('posts').update({ updated_at: new Date().toISOString() }).eq('id', postId);
    loadPosts();
}

// 6. Rendering Logic
async function loadPosts() {
    const feed = document.getElementById('feed');
    const { data: posts } = await _supabase.from('posts').select('*').order('created_at', { ascending: false });
    const { data: comments } = await _supabase.from('comments').select('*');

    if (!posts) return;

    feed.innerHTML = posts.map(p => {
        const postComments = comments ? comments.filter(c => String(c.post_id) === String(p.id)) : [];
        return `
            <div class="post-card">
                <span class="username-text">${p.username}</span> | <small>${timeAgo(p.created_at)}</small>
                <div class="post-body">${formatPost(p.body)}</div>
                <div class="comment-section">
                    <button onclick="toggleComments('${p.id}')">${postComments.length} comments</button>
                    <div id="comments-container-${p.id}" style="display:none">
                        ${postComments.map(c => `<div><strong>${c.username}</strong>: ${formatPost(c.body)}</div>`).join('')}
                        <input type="text" id="in-${p.id}" placeholder="Reply...">
                        <button onclick="addComment('${p.id}')">Send</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function toggleComments(id) {
    const el = document.getElementById('comments-container-' + id);
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}