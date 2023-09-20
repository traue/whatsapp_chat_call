var walink = "https://api.whatsapp.com/send?phone=";


function load() {
  document.getElementById("year").innerHTML = new Date().getFullYear();
  document.getElementById("version").innerHTML = "3.0.0";

  //get flags
  Array.from(document.getElementById("countryCode").options).forEach(function(country_flags) {
    let flag = country_flags.getAttribute('data-countryCode');
    country_flags.text += ' ' + getFlagEmoji(flag)
});

}

function openWhats() {
  var countryCode = document.getElementById("countryCode").value;
  var phoneNumber = countryCode + document.getElementById("phone").value;
  message = document.getElementById("message").value;
  phoneNumber = phoneNumber.replace(/[/\s&\/\\#,+()$~%.'":*?<>{}-]/g, "");
  
  if (phoneNumber.length >= 11) {
    var whats = walink + phoneNumber;
    if (message.length > 0) {
      whats += "&text=" + message;
    }
    whats.target = "_blank";
    window.open(whats);
  } else {
    var span = document.querySelector(".span-required");
    span.style.display="flex";
  }
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}