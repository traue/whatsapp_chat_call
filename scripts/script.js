var brCode = '55';
var walink = 'https://api.whatsapp.com/send?phone=';
var version = '1.1.0';

function load() {
    document.getElementById("year").innerHTML = new Date().getFullYear();
    document.getElementById("version").innerHTML = version;
}

function openWa() {
    var number = document.getElementById('number').value;
    number = number.replace(/[/\s&\/\\#,+()$~%.'":*?<>{}-]/g, '');
    if (validNumber(number))
        window.location.replace(walink + number);
    else
        alert('Número inválido');
}

function validNumber(number) {
    return number.length >= 11; //todo: number validadion correctly
}

function addBrCode() {
    var numInput = document.getElementById('number')
    var chebrcode = document.getElementById('addbrcode').checked;
    if (chebrcode) {
        numInput.value = brCode + numInput.value;
    } else {
        if (numInput.value[0] = brCode[0] && numInput.value[1] == brCode[1]) {
            numInput.value = numInput.value.slice(2);
        } else {
            alert('Não há código de país para remover!');
            chebrcode.checked = true;
        }
    }
}

function numberchange() {
    var chebrcode = document.getElementById('addbrcode');
    var numInput = document.getElementById('number');
    if (numInput.value[0] = brCode[0] && numInput.value[1] == brCode[1]) {
        chebrcode.checked = true;
    } else {
        chebrcode.checked = false;
    }
}