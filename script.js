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

// 3. SECURE FORMATTER
function formatPost(text){

let output = text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");

output = output

.replace(/&lt;(b|B)&gt;(.*?)&lt;\/(b|B)&gt;/g,"<b>$2</b>")
.replace(/&lt;(i|I)&gt;(.*?)&lt;\/(i|I)&gt;/g,"<i>$2</i>")
.replace(/&lt;(u|U)&gt;(.*?)&lt;\/(u|U)&gt;/g,"<u>$2</u>")

.replace(/&lt;s=([0-9.]+)&gt;(.*?)&lt;\/(s|S)&gt;/gi,
'<span style="font-size:$1em">$2</span>')

.replace(/&lt;c=(#[A-Fa-f0-9]{3,6}|[a-zA-Z]+)&gt;(.*?)&lt;\/(c|C)&gt;/gi,
'<span style="color:$1">$2</span>')

.replace(/&lt;f=([a-zA-Z0-9_-]+)&gt;(.*?)&lt;\/(f|F)&gt;/gi,
(m,font,content)=>{
font=font.toLowerCase()
return allowedFonts.includes(font)
? `<span style="font-family:${font}">${content}</span>`
: content
})

.replace(/(https?:\/\/[^\s]+)/g,
'<a href="$1" target="_blank" rel="noopener" style="color:#8be9fd;">$1</a>')

.replace(/\n/g,"<br>");

return DOMPurify.sanitize(output,{
ALLOWED_TAGS:['b','i','u','span','br','a'],
ALLOWED_ATTR:['style','href','target','rel'],
ALLOW_UNKNOWN_PROTOCOLS:true
});
}

// 4. Time
function timeAgo(dateString){

const now=new Date();
const past=new Date(dateString);

const diff=Math.floor((now-past)/1000);

if(diff<60) return "Just now";

if(diff<3600)
return Math.floor(diff/60)+" min";

return past.toLocaleTimeString([],{
hour:'2-digit',
minute:'2-digit'
});

}

// 5. Submit Post
async function submitPost(){

const textarea=document.getElementById('post-text');
const text=textarea.value.trim();

if(!text) return;

await _supabase.from('posts').insert([{
username:myUser,
body:text,
created_at:new Date().toISOString(),
updated_at:new Date().toISOString()
}]);

textarea.value="";
loadPosts();

}

// 6. Comment
async function addComment(postId){

const input=document.getElementById('in-'+postId);
const text=input.value.trim();

if(!text) return;

await _supabase.from('comments').insert([{
post_id:postId,
username:myUser,
body:text,
created_at:new Date().toISOString()
}]);

// update post activity
await _supabase.from('posts')
.update({updated_at:new Date().toISOString()})
.eq('id',postId);

input.value="";

loadPosts();

}

// 7. Save Post
function savePost(id,body){

let saved=JSON.parse(localStorage.getItem("savedPosts")||"[]");

if(!saved.find(p=>p.id===id)){

saved.push({id,body});
localStorage.setItem("savedPosts",JSON.stringify(saved));

alert("Saved");

}

}

// 8. Render
async function loadPosts(){

const feed=document.getElementById('feed');

const {data:posts}=await _supabase
.from('posts')
.select('*')
.order('updated_at',{ascending:false});

const {data:comments}=await _supabase
.from('comments')
.select('*');

if(!posts) return;

feed.innerHTML=posts.map(p=>{

const postComments=comments
? comments.filter(c=>String(c.post_id)===String(p.id))
: [];

const timeColor = p.updated_at!==p.created_at
? "#ff9d00"
: "#00ff00";

return`

<div class="post-card">

<span class="username-text">${p.username}</span>
|
<small style="color:${timeColor}">
${timeAgo(p.updated_at||p.created_at)}
</small>

<div class="post-body collapsed" id="body-${p.id}">
${formatPost(p.body)}
</div>

<div class="readmore" onclick="toggleRead('${p.id}')"
id="rm-${p.id}" style="display:none">
Read more..
</div>

<div class="post-actions">

<span class="comment-toggle"
onclick="toggleComments('${p.id}')">
${postComments.length} comments
</span>

<span class="save-btn"
onclick="savePost('${p.id}',\`${p.body}\`)">
Save
</span>

</div>

<div class="comments-box"
id="comments-container-${p.id}"
style="display:none">

${postComments.map(c=>`
<div class="comment">
<b>${c.username}</b> :
${formatPost(c.body)}
</div>
`).join('')}

<div class="comment-input-row">

<input
class="reply-input"
type="text"
id="in-${p.id}"
placeholder="Reply..."
>

<button
class="send-btn"
onclick="addComment('${p.id}')">
Send
</button>

</div>

</div>

</div>

`

}).join('');

setTimeout(checkClamp,500);

}

// 9. Read More
function checkClamp(){

document.querySelectorAll(".post-body")
.forEach(el=>{

if(el.scrollHeight>el.clientHeight){

const id=el.id.replace("body-","");
document.getElementById("rm-"+id)
.style.display="block";

}

});

}

function toggleRead(id){

const el=document.getElementById("body-"+id);
const btn=document.getElementById("rm-"+id);

if(el.classList.contains("collapsed")){

el.classList.remove("collapsed");
btn.innerText="Less";

}else{

el.classList.add("collapsed");
btn.innerText="Read more..";

}

}

// 10 Toggle Comments
function toggleComments(id){

const el=document.getElementById(
'comments-container-'+id
);

el.style.display=
(el.style.display==="none")
?"block":"none";

}