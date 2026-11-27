<?php
/**
 * Kontaktformular – versendet Anfragen per E-Mail an die Praxis.
 * Läuft auf jedem Standard-Webhosting mit PHP (z. B. STRATO).
 * Es werden KEINE Daten in einer Datenbank gespeichert.
 */

declare(strict_types=1);

const RECIPIENT = 'info@schoenfeld-psychotherapie.de';
const SENDER    = 'website@schoenfeld-psychotherapie.de'; // muss zur eigenen Domain gehören
const REDIRECT  = '/?gesendet=1#kontakt';

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $error = ''): never {
    global $wantsJson;
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? REDIRECT : '/#kontakt'), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Ungültige Anfrage.');
}

// Honeypot: Bots füllen das versteckte Feld aus → stillschweigend "Erfolg" melden
if (!empty($_POST['website'])) {
    respond(true);
}

// Eingaben bereinigen (Zeilenumbrüche aus Kopfzeilen-relevanten Feldern entfernen)
$clean = static fn(string $k, int $max = 200): string =>
    trim(mb_substr(preg_replace('/[\r\n\t]+/', ' ', (string)($_POST[$k] ?? '')), 0, $max));

$name     = $clean('name');
$geb      = $clean('geburtsdatum', 20);
$email    = $clean('email');
$telefon  = $clean('telefon', 40);
$anliegen = $clean('anliegen', 60);
$nachricht = trim(mb_substr((string)($_POST['nachricht'] ?? ''), 0, 5000));
$consent  = ($_POST['einwilligung'] ?? '') === 'ja';

if ($name === '' || $geb === '' || $nachricht === '' || !$consent) {
    respond(false, 'Bitte füllen Sie alle Pflichtfelder aus und bestätigen Sie die Einwilligung.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Die E-Mail-Adresse ist ungültig.');
}

$allowed  = ['Erstgespräch', 'Gruppentherapie', 'Allgemeine Frage'];
if (!in_array($anliegen, $allowed, true)) {
    $anliegen = 'Allgemeine Frage';
}

$subject = '=?UTF-8?B?' . base64_encode("Website-Anfrage: $anliegen – $name") . '?=';
$body = "Neue Anfrage über die Website\n"
      . "==============================\n\n"
      . "Anliegen:      $anliegen\n"
      . "Name:          $name\n"
      . "Geburtsdatum:  $geb\n"
      . "E-Mail:        $email\n"
      . "Telefon:       " . ($telefon ?: '–') . "\n\n"
      . "Nachricht:\n$nachricht\n\n"
      . "Einwilligung Datenverarbeitung: ja (" . date('d.m.Y H:i') . ")\n";

$headers = implode("\r\n", [
    'From: Website Praxis Schönfeld <' . SENDER . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail(RECIPIENT, $subject, $body, $headers, '-f' . SENDER);

respond($sent, $sent ? '' : 'Beim Senden ist ein Fehler aufgetreten. Bitte schreiben Sie direkt an ' . RECIPIENT . '.');
