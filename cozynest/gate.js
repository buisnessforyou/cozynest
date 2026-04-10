(function(){
  var KEY='snugspot_gate';
  var PASS='lukas';
  if(sessionStorage.getItem(KEY)==='1') return;
  document.documentElement.style.display='none';
  var ok=prompt('This site is under construction.\nEnter password to continue:');
  if(ok===PASS){
    sessionStorage.setItem(KEY,'1');
    document.documentElement.style.display='';
  } else {
    document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#2C1A0E;color:#F5E6C8;"><div style="text-align:center;"><h1>🔒 Coming Soon</h1><p>The Snug Spot is currently under construction.</p></div></div>';
    document.documentElement.style.display='';
  }
})();
