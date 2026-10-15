# Our Little World — setup

1. Open the folder in VS Code. Use a local server (Live Server extension or `python3 -m http.server 5500`). Do not open as file:// because JavaScript modules need a server.
2. Replace `images/photo1.jpg` through `photo8.jpg` and `images/date1.jpg`, `date2.jpg` with your own images (or change the `src` values in HTML). Add `music/our-song.mp3`.
3. Firebase Console (https://console.firebase.google.com) → Add project → Add app (Web). Copy the config into `firebase-config.js`.
4. Firebase → Build → Authentication → Get started → Sign-in method → Enable **Email/Password**. Under Users, add two users manually, each with a strong unique password. **Do not enable public self-signup.**
5. Authentication → Users: copy each user's UID. Firebase → Build → Firestore Database → Create database. Use production mode and select a region. In Firestore → Rules, paste `firestore.rules` and replace the two UID placeholders with the exact user UIDs. Publish rules. Never use `allow read, write: if true`.
6. In Authentication → Settings → Authorized domains, add your GitHub Pages hostname (`yourusername.github.io`) if needed. Firebase may include localhost by default depending on project age; add it for local testing if necessary.
7. Test the site using Live Server. Sign in on `notes.html`, add a note, and confirm it appears on the other approved account. Test future dates too.
8. Publish the **contents** of this folder to a GitHub repository: Settings → Pages → Deploy from branch → main → root. Wait for the deployment. The link will be `https://YOURUSERNAME.github.io/REPOSITORYNAME/`.

Security/privacy: GitHub Pages publishes HTML, JS, images and music publicly. Firestore rules restrict notes and plans to two Firebase Auth UIDs. Firebase config is not a secret; NEVER put admin SDK service-account keys in the site. Each partner can delete their own notes; either can update/delete shared plans. Anyone with your public photo URLs may view them. If you need private photos, use authenticated Firebase Storage instead of GitHub Pages static images.

Editing: replace the headings, paragraphs, and photo captions in each HTML page. Duplicate `<figure class="polaroid album-photo">...</figure>` for more photos. Duplicate `<article class="date-entry">...</article>` for more past dates.
