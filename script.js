/* 1.SUPABASE INIT */
const _supabase = window.supabase.createClient(
  "https://jyhxqlwhvptzmvtzrytg.supabase.co",
  "sb_publishable_J9NfYlWjgioW_xTDEhCWrg_kQe6kCil"
);

/* 2.USER SESS */
let myUser = sessionStorage.getItem('username');
if(!myUser){
  myUser = "User_" + Math.floor(100 + Math.random()*900);
  sessionStorage.setItem("username", myUser);
}

/* 3.ALLOWED FONTS  */
const allowedFonts = ["parabaik","badsignal","jetbrains"];

/* 4.FORMAT POST - MULTI-LAYER NESTED VERSION */
function formatPost(text) {
    if (!text) return "";

    // ၁။ HTML Injection ကာကွယ်မယ်
    let output = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // ၂။ URL Link
    const urlRegex = /(https?:\/\/[^\s\[\]<"']+)/g;
    output = output.replace(urlRegex, '<a href="$1" target="_blank" style="color:#8be9fd; text-decoration:underline;">$1</a>');

    // ၃။ Custom Syntax [ ] Tags - ၅ မျိုးစလုံးကို နှစ်ထပ်သုံးထပ်အတွက် Loop ပတ်မယ်
    // ဒီ loop က အထပ်ထပ်ဖြစ်နေတဲ့ Tag တွေကို တစ်လွှာချင်းစီ ခွာပြီး HTML ပြောင်းပေးမှာပါ
    for (let i = 0; i < 3; i++) {
        // Bold: [b]
        output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
        
        // Underline: [u]
        output = output.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
        
        // Italic: [i]
        output = output.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
        
        // Size:
        output = output.replace(/\[s=([0-9.]+)\]([\s\S]*?)\[\/s\]/gi, '<span style="font-size:$1em">$2</span>');
        
        // Color:
        output = output.replace(/\[c=#([A-Fa-f0-9]{6})\]([\s\S]*?)\[\/c\]/gi, '<span style="color:#$1">$2</span>');
    }

    // ၄။ Line breaks
    output = output.replace(/\n/g, "<br>");

    return output;
}

/* 5.READ MORE */
function toggleReadMore(id){
  const body = document.getElementById("body-"+id);
  const btn = document.getElementById("rm-"+id);
  if(body.classList.contains("expanded")){
    body.classList.remove("expanded");
    body.classList.add("collapsed");
    btn.innerText="Read more...";
  }else{
    body.classList.remove("collapsed");
    body.classList.add("expanded");
    btn.innerText="Show less";
  }
}

function checkReadMore(body,btn){
  if(body.scrollHeight > body.clientHeight) btn.style.display="inline";
  else btn.style.display="none";
}

/* 6.TIME AGO */
function timeAgo(dateString){
  const now = new Date();
  const past = new Date(dateString);
  const diffDays = Math.floor((now - past) / (1000*60*60*24));
  if(diffDays === 0) return past.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  else if(diffDays === 1) return "Yesterday";
  else return diffDays + " days ago";
}

/* 7.SAVE POST */
function savePost(user,time,text){
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, "");
  const content = `User: ${user}\nTime: ${time}\n\n${plainText}`;
  const blob = new Blob([content],{type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "post.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* 8.SUBMIT POST */
async function submitPost(){
  const textarea = document.getElementById("post-text");
  if(!textarea) return;
  const text = textarea.value.trim();
  if(!text) return;
  const now = new Date().toISOString();
  await _supabase.from("posts").insert([{
    username: myUser,
    body: text,
    created_at: now,
    updated_at: null,
    last_activity: now
  }]);
  textarea.value="";
  loadPosts();
}

/* 9.ADD COMMENT */
async function addComment(postId){
  const input = document.getElementById("in-"+postId);
  const text = input.value.trim();
  if(!text) return;
  const now = new Date().toISOString();
  await _supabase.from("comments").insert([{
    post_id: postId,
    username: myUser,
    body: text,
    created_at: now
  }]);
  await _supabase.from("posts").update({updated_at: now,last_activity: now}).eq("id",postId);
  loadPosts();
}

/* 10.TOGGLE COMMENTS */
function toggleComments(postId){
  const el = document.getElementById("comments-container-"+postId);
  el.style.display = (el.style.display === "none") ? "block" : "none";
}

/* 11.LOAD POSTS */
async function loadPosts(){
  const feed = document.getElementById("feed");
  if(!feed) return;

/* 12.Auto-delete 14 days old */
  const fourteenDaysAgo = new Date(Date.now()-14*24*60*60*1000);
  await _supabase.from("posts").delete().lt("last_activity", fourteenDaysAgo.toISOString());

  const {data:posts} = await _supabase.from("posts").select("*").order("last_activity",{ascending:false});
  const {data:comments} = await _supabase.from("comments").select("*");

  feed.innerHTML="";
  if(!posts) return;

  posts.forEach(p=>{
    const postComments = comments ? comments.filter(c=>String(c.post_id)===String(p.id)) : [];
    const commentCount = postComments.length;
    const displayTime = timeAgo(p.updated_at || p.created_at);
    const timeClass = p.updated_at ? "time-orange" : "time-green";

/* 13.Inner HTML */
    feed.innerHTML += `
      <div class="post-card">
        <div>
          <span class="username-text">${p.username}</span>
          <span class="post-time ${timeClass}">| ${displayTime}</span>
        </div>
        <div id="body-${p.id}" class="post-body collapsed">${formatPost(p.body)}</div>
        <div><span id="rm-${p.id}" class="read-more-btn" onclick="toggleReadMore('${p.id}')" style="display:none">Read more...</span></div>

        <div class="post-actions">
          <div class="action-row">
            <div class="action-left">
              <span class="comment-toggle" onclick="toggleComments('${p.id}')">${commentCount} comments</span>
            </div>
            <div class="action-right">
              <span class="save-btn" onclick="savePost('${p.username}','${displayTime}',\`${p.body}\`)">save</span>
            </div>
          </div>
        </div>

        <div id="comments-container-${p.id}" class="comment-section" style="display:none">
          ${postComments.map(c=>`
            <div class="comment-box">
              <div class="comment-text"><small><span class="username-text">${c.username}</span>: ${formatPost(c.body)}</small></div>
            </div>`).join("")}

          <div class="comment-input-row">
            <input type="text" id="in-${p.id}" class="comment-input" placeholder="Reply...">
            <button class="send-btn" onclick="addComment('${p.id}')">Send</button>
          </div>
        </div>
      </div>
    `;

/* 14.TimeOut */
    setTimeout(()=>{
      const body = document.getElementById("body-"+p.id);
      const btn = document.getElementById("rm-"+p.id);
      checkReadMore(body,btn);
    },50);
  });
}

loadPosts();
/*gpt*/