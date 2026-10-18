LIVE MP3 CONTROLLER — FIRST SETUP (Windows)

WHAT YOU NEED
- A Windows computer on the same Wi-Fi as both phones.
- Node.js installed on the computer.
- Your 7–8 MP3 files.
- Phone A connected to the speaker by cable.

1. INSTALL NODE.JS
Install the current Node.js LTS version from https://nodejs.org/ if not already installed.
Close and reopen PowerShell after installation.

2. ADD YOUR AUDIO FILES
Copy your MP3 files into public\audio.
Rename them exactly:
track01.mp3
track02.mp3
track03.mp3
track04.mp3
track05.mp3
track06.mp3
track07.mp3
track08.mp3

If you only have 7 tracks, remove the eighth object from public\tracks.json.
You may change the visible titles in public\tracks.json, but each file name must match exactly.
Do not put MP3 files in a different folder.

3. START THE SERVER
Open PowerShell in this project folder.
Run:
npm install
npm start

Keep this PowerShell window open while using the app.

4. FIND YOUR COMPUTER'S WI-FI IP ADDRESS
Open a second PowerShell window and run:
ipconfig
Find the IPv4 Address under the Wi-Fi adapter (example only: 192.168.1.25).
Do not use the example unless it is actually your address.

5. OPEN THE PLAYER ON PHONE A
Connect both phones and the computer to the same Wi-Fi.
On Phone A, open:
http://YOUR-COMPUTER-IP:3000/player
Replace YOUR-COMPUTER-IP with the computer's actual IPv4 address.
Example format: http://192.168.1.25:3000/player
Tap Enable audio once. Confirm you hear sound from the speaker.

6. OPEN THE REMOTE ON PHONE B
Open:
http://YOUR-COMPUTER-IP:3000/controller
Tap Next. Phone A should switch to the next MP3.

7. WINDOWS FIREWALL
If the phone cannot connect, allow Node.js on Private networks when Windows asks.
Only use this on a trusted private Wi-Fi network. Do not create a public internet port-forward.
If needed, create a Windows Defender Firewall inbound rule for TCP port 3000 on Private networks only.

TROUBLESHOOTING
- Check server on computer: http://localhost:3000/health
- On phones, do not use localhost; use the computer's IPv4 address.
- Both phones and computer must be on the same Wi-Fi. Some guest Wi-Fi networks block devices from seeing each other.
- If phone shows "Not secure", that is expected for local HTTP. Use this only on your trusted local network.
- If there is no audio, check the MP3 filename, speaker cable, phone volume, and tap Enable audio on Phone A.
- Keep Phone A's browser page open and the screen awake. Mobile browsers can suspend playback when locked or sent to the background.
- If Wi-Fi IP changes, find it again with ipconfig and update the URL on both phones.

ACCURACY NOTES
Commands are sent over a persistent WebSocket connection; no periodic polling or page refresh is used.
This improves responsiveness but cannot guarantee zero latency. Local Wi-Fi quality and phone browser behavior still matter.
The player intentionally does not auto-advance when a track ends.
