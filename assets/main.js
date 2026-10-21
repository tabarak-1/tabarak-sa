(function(){
  var b=document.querySelector('.burger'),m=document.getElementById('menu');
  if(b&&m){b.addEventListener('click',function(){
    var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o);
  });}
  var y=document.getElementById('year');
  if(y){y.textContent=new Date().getFullYear();}
})();
