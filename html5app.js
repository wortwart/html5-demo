var abschnitt, neueintrag, button, startnachricht, aufgeraeumt, storage, d, eingabe, autor, autor_db, offlinemodus;
var Wochentage = new Array('Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag');
var Monate = new Array('Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember');
function $(str, nr) {return document.getElementsByTagName(str)[nr];}
function $_(str) {return document.getElementById(str);}
function c(str) {return document.createElement(str);}
function txt(str) {return document.createTextNode(str);}
window.onload = init;

window.addEventListener('online', function() {debug('bin im Netz')}, false);
window.addEventListener('offline', function() {debug('bin offline')}, false);

function init() {
 debug('Online-Status: ' + navigator.onLine);
 cachestatus();
 abschnitt = $('section', 0);
 neueintrag = $('textarea', 0);
 button = $('input', 0);
 startnachricht = neueintrag.value;
 neueintrag.onclick = aufraeumen;
 neueintrag.onfocus = aufraeumen;
 button.onclick = speichern;
 if (typeof(localStorage) == 'undefined' || typeof(localStorage) == 'unknown') {
  debug('kein localStorage');
 } else {
  storage = true;
  lesen();
  sync();
 }
}

function aufraeumen() {
 if (aufgeraeumt) return;
 neueintrag.value = '';
 aufgeraeumt = true;
}

function speichern() {
 if (!storage) return;
 eingabe = neueintrag.value;
 if (eingabe == '' || eingabe == startnachricht) return;
 var datum = new Date();
 d = datum.getTime();
 autor = $('h2', 0).firstChild.nodeValue;
 autor_db = localStorage.getItem('autor');
 if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(adresse_ermitteln, adresse_fehler, {timeout:1500});
 } else {
  daten_schreiben();
 }
}

function daten_schreiben() {
 try {
  if (autor != autor_db) localStorage.setItem('autor', autor);
  localStorage.setItem(d, eingabe);
  debug('Eintrag lokal gespeichert');
  neueintrag.value = startnachricht;
  aufgeraeumt = false;
  ajax_verbinden('speichern', d, eingabe);
 } catch (e) {
  debug('Fehler beim Speichern: ' + e);
 }
 lesen();
}

function lesen() {
 if ($('ol', 0)) abschnitt.removeChild($('ol', 0));
 if (!storage) return;
 if (autor = localStorage.getItem('autor')) $('h2', 0).firstChild.nodeValue = autor;
 var ol = c('ol');
 var keys = Array();
 for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
 keys = keys.sort();
 for (var i = keys.length; i-- > 0;) {
  var schluessel = keys[i];
  var wert;
  if (!(wert = localStorage.getItem(schluessel))) continue;
  var tmp = wert.split(':ORT:', 2);
  wert = tmp[0];
  var ort = tmp[1];
  schluessel = parseInt(schluessel);
  if (isNaN(schluessel)) continue;
  var li = c('li');
  var div = c('div');
  var h3 = c('h3');
  var p = c('p');
  var dat = new Date(schluessel);
  var dat_wochentag = Wochentage[dat.getDay()];
  var dat_kalendertag = dat.getDate();
  var dat_monat = dat.getMonth();
  var dat_jahr = dat.getFullYear();
  var dat_stunde = dat.getHours();
  var dat_minute = dat.getMinutes();
  if (dat_minute < 10) dat_minute = '0' + dat_minute;
  var aenderungsdatum = dat_wochentag + ', ' + dat_kalendertag + '. ' + Monate[dat_monat] + ' ' + dat_jahr + ' um ' + dat_stunde + ':' + dat_minute;
  if (!letzte_aenderung) {
   var letzte_aenderung = aenderungsdatum;
   if (++dat_monat < 10) dat_monat = '0' + dat_monat;
   if (dat_kalendertag < 10) dat_kalendertag = '0' + dat_kalendertag;
   if (dat_stunde < 10) dat_stunde = '0' + dat_stunde;
   var letzte_aenderung_pd = dat_jahr + '-' + dat_monat + '-' + dat_kalendertag + 'T' + dat_stunde + ':' + dat_minute;
   var time = $('time', 0);
   time.firstChild.nodeValue = letzte_aenderung;
   time.setAttribute('datetime', letzte_aenderung_pd);
  }
  h3.appendChild(txt(aenderungsdatum));
  if (ort) {
   h3.appendChild(c('br'));
   h3.appendChild(txt('in ' + ort));
  }
  p.appendChild(txt(wert));
  div.appendChild(h3);
  div.appendChild(p);
  div.setAttribute('id', schluessel);
  li.appendChild(div);
  ol.appendChild(li);
 }
 if (li) abschnitt.appendChild(ol);
 var eintraege = ol.getElementsByTagName('div');
 for (var i = 0; i < eintraege.length; i++) eintraege[i].ondblclick = loeschen;
}

function loeschen() {
 if (!storage) return;
 var frage = confirm("Wollen Sie diesen Eintrag wirklich löschen?");
 if (frage) {
  localStorage.setItem(this.id, '');
  debug('Eintrag lokal gelöscht');
  ajax_verbinden('loeschen', this.id, null);
  lesen();
 }
}

function adresse_ermitteln(pos) {
 var geo = new google.maps.Geocoder();
 var coords = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
 geo.geocode({'latLng': coords}, function(results, status) {
  var adresse = (status == google.maps.GeocoderStatus.OK)? results[0].formatted_address : 'Adresse nicht ermittelt: ' + status;
  eingabe += ':ORT:' + adresse;
  daten_schreiben();
 });
 debug('Adresse aufgelöst');
}

function adresse_fehler(err) {
 eingabe += ':ORT:Probleme bei der Ortung';
 switch(err.code) {
  case 1 : debug('Ortung: keine Erlaubnis'); break;
  case 2 : debug('Ortung: Server konnte nicht orten'); break;
  case 3 : debug('Ortung: Timeout'); break;
  default : debug('Ortung: keine Angabe'); break;
 }
 daten_schreiben();
}

function cachestatus() {
 var ac;
 if (!(ac = window.applicationCache)) return;
 ac.addEventListener('checking', function() {debug('Prüfe den Cache ...');}, false);
 ac.addEventListener('noupdate', function() {debug('Kein Cache-Update nötig');}, false);
 ac.addEventListener('downloading', function() {debug('Aktualisiere den Cache ...');}, false);
 ac.addEventListener('progress', function() {debug('Lade Datei herunter ...');}, false);
 ac.addEventListener('updateready', function() {debug('Cache-Update bereit ...');}, false);
 ac.addEventListener('cached', function() {debug('Cache ist aktuell');}, false);
 ac.addEventListener('obsolete', function() {debug('Cache ist obsolet');}, false);
 ac.addEventListener('error', function() {debug('Problem mit Cache');}, false);
}

function ajax_verbinden(aktion, id, eingabe) {
 try {
  var ajax = new XMLHttpRequest();
 } catch(e) {
  debug('kein Ajax möglich: ' + e);
 }
 var senden = 'aktion=' + aktion + '&id=' + id + '&eintrag=' + eingabe;
 ajax.open('POST', 'html5app_speichern.php', true);
 ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=iso-8859-1");
 ajax.setRequestHeader("Content-length", senden.length);
 ajax.setRequestHeader("Connection", "close");
 debug('Ajax: ' + aktion + ' von ' + id);
 ajax.send(senden);
 var timer = window.setTimeout(function() {
  ajax.abort();
  offlinemodus = true;
  debug('Timeout: Offline-Modus');
 }, 2500);
 ajax.onreadystatechange = function() {
  if (ajax.readyState == 4) {
   window.clearTimeout(timer);
   if (ajax.status == 200) {
    if (offlinemodus) {
     offlinemodus = false;
     sync();
    }
   } else {
    debug('Ajax-Dokument nicht erreichbar: HTTP-Status ' + ajax.status);
   }
  }
 }
}

function sync() {
 if (offlinemodus) return;
 debug('Synchronisiere ...');
 try {
  var ajax = new XMLHttpRequest();
 } catch(e) {
  debug('kein Ajax möglich: ' + e);
 }
 ajax.open('GET', 'html5app_speichern.php', true);
 ajax.send(null);
 ajax.onreadystatechange = function() {
  if (ajax.readyState == 4) {
   if (ajax.status == 200) {
    debug('Lese Online-Datenbank ein ...');
    try {
     var onlinedb = JSON.parse(ajax.responseText);
    } catch(e) {
     debug('JSON-Daten nicht lesbar: ' + e);
     offlinemodus = true;
     return;
    }
    var keys = new Object;
    for (var i = 0; i < localStorage.length; i++) {
     var key = localStorage.key(i);
     keys[key] = true;
    }
    while (onlinedb.length) {
     var onlineItem = onlinedb.shift();
     var offlineWert;
     if (offlineWert = localStorage.getItem(onlineItem.id)) {
      // Fall 1: Eintrag online und offline
      if (onlineItem.eintrag == '') {
       // 1a: online zum Löschen markiert -> offline löschen
       localStorage.removeItem(onlineItem.id);
       debug('Eintrag ' + onlineItem.id + ' lokal gelöscht');
      } else if (offlineWert == '') {
       // 1b: offline zum Löschen markiert -> online markieren
       ajax_verbinden('loeschen', this.id, null);
       localStorage.removeItem(onlineItem.id);
       debug('Eintrag ' + onlineItem.id + ' online gelöscht');
      }
      // entferne aus keys
      delete keys[onlineItem.id];
     } else {
      // Fall 2: Eintrag nur online
      if (onlineItem.eintrag) {
       localStorage.setItem(onlineItem.id, onlineItem.eintrag);
       debug('Online-Eintrag ' + onlineItem.id + ' synchronisiert');
      }
     }
    }
    for (var i in keys) {
     // keys enthält nur noch Einträge, die online nicht vorliegen
     if (localStorage.getItem(i) == '') {
      // lokaler Eintrag ist leer -> löschen
      localStorage.removeItem(i);
     } else {
      // ansonsten hochladen, wenn der Schlüssel numerisch ist
      if (isNaN(parseInt(i))) continue;
      ajax_verbinden('speichern', i, localStorage.getItem(i));
     }
    }
    debug('Synchronisieren abgeschlossen');
    lesen();
   } else {
    offlinemodus = true;
    debug('Ajax-Dokument nicht erreichbar');
   }
  }
 }
}

function debug(text) {
 if (!$_('debug')) {
  var div = c('div');
  div.setAttribute('id', 'debug');
  document.body.appendChild(div);
 }
 var p = c('p');
 var text = txt(text);
 p.appendChild(text);
 $_('debug').appendChild(p);
}