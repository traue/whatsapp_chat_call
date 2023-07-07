/* =====Carregar Rodapé=====*/
function load() {
	document.getElementById("year").innerHTML = new Date().getFullYear();
	document.getElementById("version").innerHTML = '1.2.0';
}
/* =====Carregar Rodapé=====*/

/* =====Marcar Checkbox Código Telefônico=====*/
function addEuCode() {
	var euCode = '1';
	var numInput = document.getElementById('number');
	var cheeucode = document.getElementById('addeucode').checked;
	if (cheeucode) {
		numInput.value = '';
		numInput.value = euCode + numInput.value;
	}
	else {
		alert('País Inválido!');
	}
}

function addChCode() {
	var chCode = '86';
	var numInput = document.getElementById('number');
	var chechcode = document.getElementById('addchcode').checked;
	if (chechcode) {
		numInput.value = '';
		numInput.value = chCode + numInput.value;
	}
	else {
		alert('País Inválido!');
	}
}

function addBrCode() {
	var brCode = '55';
	var numInput = document.getElementById('number');
	var chebrcode = document.getElementById('addbrcode').checked;
	if (chebrcode) {
		numInput.value = '';
		numInput.value = brCode + numInput.value;
	}
	else {
		alert('País Inválido!');
	}
}
/* =====Marcar Checkbox Código Telefônico=====*/

/* =====Abrir WhatsappWeb=====*/
var walink = 'https://api.whatsapp.com/send?phone=';
function openWhats() {
	var numInput = document.getElementById('number').value;
	if (numInput.length >= 11) {
		var whats = (walink + numInput);
		whats.target = "_blank";
		window.open(whats);
	}
	else {
		alert('Número Inválido!');
	}
}
/* =====Abrir WhatsappWeb=====*/