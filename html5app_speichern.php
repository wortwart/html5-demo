<?php
$dbhost = 'localhost';
$dbuser = 'root';
$dbpasswort = '';
$dbname = 'notizbuch';
$tabelle = 'notizbuch';

header('Content-type: text/plain');
$db = new mysqli($dbhost, $dbuser, $dbpasswort, $dbname);
if ($_POST) {
 if ($_POST['id']) $id = $_POST['id'];
 // ID wird als String übergeben, weil PHP keine großen Zahlen kann :-(
 if ($_POST['aktion'] == 'speichern') {
  $stmt = $db->prepare('INSERT ' . $tabelle . ' (id, eintrag) VALUES (?, ?)');
  $stmt->bind_param('ss', $id, utf8_decode($_POST['eintrag']));
  echo 'Schreibe Eintrag ' . $id;
 } elseif ($_POST['aktion'] == 'loeschen') {
  $stmt = $db->prepare('UPDATE ' . $tabelle . ' SET eintrag = NULL WHERE id = ?');
  $stmt->bind_param('s', $id);
  echo 'Lösche Eintrag ' . $id;
 } else {
  echo 'Ungültige Parameter!';
  exit;
 }
 $stmt->execute();
 printf("%d Zeilen aktualisiert", $stmt->affected_rows);
 $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET') {
 if ($res = $db->query('SELECT id, eintrag FROM ' . $tabelle .' ORDER BY id')) {
  $eintraege = Array();
  while ($obj = $res->fetch_object()) $eintraege[] = '{"id": ' . $obj->id . ', "eintrag": "' . addslashes(utf8_encode($obj->eintrag)) . '"}';
  $res->close();
  echo '[' . join(',', $eintraege) . ']';
 }
}
if ($db->error) echo $db->error;
$db->close();
?>
