# SPEC-017: Mobile Schrauber-Kamera-Integration & Wandfoto-Erfassung

## Status: DONE

## Summary
Ermöglicht Routenschraubern (Route Settern) in der Boulderhalle auf Mobilgeräten das zuverlässige, verzögerungsfreie Aufnehmen von Sektor-Wandfotos direkt aus der App. Behebt die Entkopplung des Live-Kamerabildes durch robuste MediaStream-Bindung (Callback-Ref & Synchronisationseffekt), implementiert eine automatische Fallback-Kaskade für Browser-Kamera-Constraints, bietet nahtlose Umschaltung zwischen Live-WebRTC-Sucher (mit Kamera-Wechsel vorn/hinten) und nativer System-Kamera (`capture="environment"`), öffnet auf Mobilgeräten standardmäßig direkt den Kameramodus und ermöglicht sofortige Einhand-Übernahme des Fotos ohne Scrollaufwand.

---

## Kontext & Problemstellung
Beim mobilen Testen in der Boulderhalle ("in der Halle per mobile als Schrauber ein Foto schießen") traten kritische Usability- und Technologie-Probleme auf:
1. **Verbindungs-Abriss / Schwarzbild**: Das `<video>`-Element für den Live-Sucher war erst im DOM vorhanden, nachdem `isCameraActive` auf `true` gesetzt wurde. Die Zuweisung `videoRef.current.srcObject = stream` schlug synchron fehl, weil React noch nicht neu gerendert hatte. Das Videoelement blieb schwarz und unverbunden.
2. **Falscher Default-Tab**: Das Wandfoto-Modal öffnete standardmäßig im Reiter "Datei vom Computer" ("Wandfoto vom Laptop auswählen"), was für Schrauber an der Boulderwand unpassend ist.
3. **HTTP/WebRTC-Restriktionen auf Mobilgeräten**: Im lokalen Hallen-WLAN ohne SSL (`http://192.168.x.x`) oder in restriktiven Browsern ist `navigator.mediaDevices.getUserMedia` blockiert. Es fehlte ein prominenter, barrierefreier Direkt-Zugang zur nativen Handy-Kamera.
4. **Umständlicher Bestätigungs-Flow**: Nach Aufnahme über die System-Kamera blieb der Nutzer im Auswahldialog hängen und musste zum Bestätigen nach unten scrollen.

---

## User Stories
- **US-1 (Schrauber - Direktes Fotografieren an der Wand)**: Als Schrauber an der Boulderwand möchte ich mit einem Fingertipp direkt die Kamera öffnen und die frisch geschraubte Wand fotografieren können.
- **US-2 (Schrauber - Garantierter Live-Sucher)**: Als Schrauber möchte ich im Live-Sucher sofort das reale Bild der Rückkamera meines Handys sehen, den Sektor im Fadenkreuz ausrichten und per Shutter-Button auslösen.
- **US-3 (Schrauber - Native System-Kamera-Alternative)**: Als Schrauber möchte ich bei Verbindungsproblemen oder für native Kamerafeatures (z. B. Ultraweitwinkel / HDR) mit einem einzigen Klick die native Handy-Kamera-App öffnen und das Ergebnis direkt in die App übernehmen.
- **US-4 (Schrauber - 1-Tap Bestätigung & Wiederholung)**: Als Schrauber möchte ich das aufgenommene Foto sofort groß sehen und mit einem einzigen Daumentipp übernehmen oder bei Bedarf sofort wiederholen.
- **US-5 (Schrauber - Rück- & Frontkamera Wechsel)**: Als Schrauber möchte ich im Live-Sucher nahtlos zwischen Hauptkamera (Rückseite) und Frontkamera wechseln können.

---

## Acceptance Criteria

- [x] **AC-1**: **Mobile-First Kamera-Default**:
  - Beim Öffnen der Wandfoto-Auswahl aus dem Schrauber-Studio (`BatchBoulderWorkflow` oder `WallPhotoCanvas`) auf Mobilgeräten oder über Kamera-Buttons ist standardmäßig direkt der Reiter "Foto machen (Kamera)" aktiv.
- [x] **AC-2**: **Garantierte MediaStream-Bindung (Kein Schwarzbild / Echte Hardware-Verbindung)**:
  - Der `<video>`-Viewfinder wird zuverlässig mit dem aktiven `MediaStream` verknüpft (Callback-Ref & Synchronisationseffekt).
  - Beim Starten der Kamera (`startCamera`) wird der Stream sofort dem Videoelement zugewiesen und abgespielt (`video.play()`).
  - Fallback-Kaskade bei Kamera-Constraints: Falls 1080p oder `facingMode: ideal` fehlschlägt, fällt die Verbindung kaskadierend auf Standard-Constraints und schließlich auf jeden verfügbaren Videotrack zurück, um Gerätekompatibilität auf allen Smartphones zu garantieren.
- [x] **AC-3**: **Nahtloser nativer System-Kamera-Fallback (Handy-Kamera)**:
  - Falls WebRTC/`getUserMedia` im Browser nicht verfügbar ist (z. B. lokales Netzwerk per HTTP ohne SSL oder fehlende WebRTC-Berechtigungen), führt die App den Nutzer nicht in eine Sackgasse, sondern bietet einen prominenten, fingergroßen Button "Handy-Kamera öffnen" (`capture="environment"`), der die native Kamera-App des Smartphones direkt öffnet.
- [x] **AC-4**: **Sofortige Foto-Vorschau & 1-Tap-Bestätigung (Single-Action Confirmation)**:
  - Sobald ein Foto geschossen (Live-Sucher) oder über die System-Kamera aufgenommen wurde, wird die Aufnahme unmittelbar zentriert und vollflächig im Fokusbereich des Modals angezeigt.
  - Direkt am Foto stehen zwei große, touch-optimierte Schaltflächen (>= 44px) bereit:
    - **"Wandfoto übernehmen"** (Hervorgehobener Gold-Button)
    - **"Foto wiederholen"** (Erneut fotografieren)
  - Der Schrauber muss nicht scrollen oder nach unten wischen, um das Foto zu bestätigen.
- [x] **AC-5**: **Kamera-Umschaltung & Hardware-Freigabe**:
  - Im Live-Sucher kann mit einem Button zwischen Hauptkamera (Rückseite / `environment`) und Frontkamera (`user`) gewechselt werden.
  - Beim Schließen des Modals oder Tab-Wechsel werden alle aktiven MediaStream-Tracks sofort ordnungsgemäß gestoppt (`track.stop()`), sodass das Kamera-Icon / die Hardware-LED des Smartphones sofort erlischt.
- [x] **AC-6**: **Robuste Frame-Erfassung (`captureVideoFrame`)**:
  - `captureVideoFrame` prüft vor der Canvas-Erfassung `video.videoWidth > 0` und `readyState >= 2`, um leere oder schwarze Aufnahmen zuverlässig abzufangen.
- [x] **AC-7**: **Erhalt aller bestehenden Sektor- und Routen-Workflows**:
  - Beim Übernehmen des neuen Wandfotos bleiben alle existierenden Boulder-Pins und Koordinaten des Sektors 1:1 erhalten.

---

## Technical Design

### MediaStream Lifecycle & Ref Binding
```
[User klickt "Foto aufnehmen"]
          │
          ▼
[WallPhotoUploadModal öffnet mit activeTab = 'camera']
          │
          ▼
[startCamera(facingMode: 'environment')]
          │
     ┌────┴────────────────────────┐
     ▼                             ▼
[getUserMedia Success]     [getUserMedia Fail / HTTP]
     │                             │
     ▼                             ▼
[streamRef.current = stream] [cameraError anzeigen]
[setIsCameraActive(true)]          │
     │                             ▼
     ▼                    [Prominenter Button:]
[Callback Ref setVideoRef] ["Handy-Kamera öffnen"]
     │                    [<input capture="environment">]
     ▼
[video.srcObject = stream]
[video.play()]
     │
     ▼
[Live-Sucher aktiv mit Fadenkreuz & Auslöser]
```

### Affected Components & Modules
1. `src/lib/imageUtils.ts`:
   - `captureVideoFrame`: Prüfung auf Video-Bereitschaft und reale Dimensionen.
2. `src/components/WallPhotoUploadModal.tsx`:
   - Robuste Stream-Bindung, mobile Kamera-Default, Dual-Mode (Live-Sucher & System-Kamera), Sofort-Vorschau und 1-Tap-Bestätigung.
3. `src/components/BatchBoulderWorkflow.tsx`:
   - `initialTab="camera"` beim Klick auf Foto-Button im Schrauber-Bereich.
4. `src/components/WallPhotoCanvas.tsx`:
   - Kamera-Button triggert `onChangePhoto` mit direktem Kamera-Fokus.
