
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toGMTString();
  document.cookie = cname + "=" + cvalue + "; " + expires + ";domain=." + window.location.host + ";path=/";
  console.log(document.cookie);
}

setCookie('splash', '1', 100);
setCookie('test', '1', 100);