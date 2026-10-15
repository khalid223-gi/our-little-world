import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const music = document.getElementById('song');
const musicToggle = document.getElementById('musicToggle');
if (music && musicToggle) {
  musicToggle.addEventListener('click', async () => {
    if (music.paused) {
      try { await music.play(); musicToggle.textContent = '♫ Pause our song'; }
      catch { musicToggle.textContent = '♫ Add our-song.mp3'; }
    } else { music.pause(); musicToggle.textContent = '♫ Play our song'; }
  });
}

const page = document.body.dataset.page;
if (page === 'notes' || page === 'future-dates') {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const $ = id => document.getElementById(id);
  const authBox = $('authBox');
  const privateArea = $('privateArea');
  const authMessage = $('authMessage');
  const loginForm = $('loginForm');
  const collectionName = page === 'notes' ? 'notes' : 'plans';
  const target = page === 'notes' ? $('notesList') : $('plansList');
  let currentUser = null;
  let unsubscribe = null;
  let unlocked = sessionStorage.getItem('ourLittleWorldUnlocked') === 'yes';

  function showGate() {
    authBox.hidden = unlocked;
    privateArea.hidden = !unlocked;
  }

  function stopListening() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  }

  function startListening() {
    stopListening();
    if (!unlocked || !currentUser) return;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    unsubscribe = onSnapshot(q, snapshot => {
      target.replaceChildren();
      if (snapshot.empty) {
        target.append(el('p', 'Nothing here yet. Start your first one ♡', 'empty'));
      }
      snapshot.forEach(item => {
        if (page === 'notes') renderNote(target, item.id, item.data());
        else renderPlan(target, item.id, item.data());
      });
    }, error => {
      target.textContent = 'Could not load shared content. Check Firestore database rules.';
      console.error(error);
    });
  }

  async function connect() {
    authMessage.textContent = 'Opening our little world...';
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      currentUser = auth.currentUser;
      authMessage.textContent = '';
      showGate();
      startListening();
    } catch (error) {
      unlocked = false;
      sessionStorage.removeItem('ourLittleWorldUnlocked');
      showGate();
      authMessage.textContent = 'Could not connect. Enable Anonymous sign-in in Firebase Authentication.';
      console.error(error);
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if ($('secretWord').value.trim().toLowerCase() !== 'love') {
      authMessage.textContent = "That's not our secret word 🤍";
      return;
    }
    unlocked = true;
    sessionStorage.setItem('ourLittleWorldUnlocked', 'yes');
    await connect();
    loginForm.reset();
  });

  $('signOutBtn').addEventListener('click', () => {
    unlocked = false;
    sessionStorage.removeItem('ourLittleWorldUnlocked');
    stopListening();
    showGate();
    authMessage.textContent = '';
  });

  onAuthStateChanged(auth, user => {
    currentUser = user;
    if (unlocked && user) startListening();
    else stopListening();
  });

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function timeLabel(data) {
    return data.createdAt?.toDate?.().toLocaleDateString() || 'Just now';
  }
  function deleteButton(name, id, parent) {
    const btn = el('button', 'Delete');
    btn.type = 'button';
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this item for both of you?')) return;
      try { await deleteDoc(doc(db, name, id)); }
      catch { alert('Could not delete this item.'); }
    });
    parent.append(btn);
  }
  function renderNote(target, id, data) {
    const card = el('article', undefined, 'note-card');
    card.append(el('small', `${data.authorName || 'Someone special'} · ${timeLabel(data)}`));
    card.append(el('p', data.text || ''));
    const actions = el('div', undefined, 'card-actions');
    deleteButton('notes', id, actions);
    card.append(actions);
    target.append(card);
  }
  function renderPlan(target, id, data) {
    const card = el('article', undefined, 'plan-card');
    card.append(el('small', `${data.authorName || 'Us'} · ${data.date || 'Date TBD'}`));
    card.append(el('h3', data.title || 'Date idea'));
    card.append(el('p', data.details || ''));
    card.append(el('small', `Status: ${data.status || 'Wishlist'}`));
    const actions = el('div', undefined, 'card-actions');
    const status = el('button', data.status === 'Completed' ? 'Move to wishlist' : 'Mark completed');
    status.type = 'button';
    status.addEventListener('click', async () => {
      try { await updateDoc(doc(db, 'plans', id), { status: data.status === 'Completed' ? 'Wishlist' : 'Completed' }); }
      catch { alert('Could not update the plan.'); }
    });
    actions.append(status);
    deleteButton('plans', id, actions);
    card.append(actions);
    target.append(card);
  }

  if (page === 'notes') {
    $('noteForm').addEventListener('submit', async event => {
      event.preventDefault();
      const text = $('noteText').value.trim();
      if (!text || !currentUser || !unlocked) return;
      $('formMessage').textContent = 'Saving...';
      try {
        await addDoc(collection(db, 'notes'), { text, authorId: currentUser.uid, authorName: 'Someone special', createdAt: serverTimestamp() });
        $('noteForm').reset();
        $('formMessage').textContent = 'Your note is saved ♡';
      } catch (error) {
        $('formMessage').textContent = 'Could not save your note. Check Firestore rules.';
        console.error(error);
      }
    });
  } else {
    $('planForm').addEventListener('submit', async event => {
      event.preventDefault();
      const title = $('planTitle').value.trim();
      if (!title || !currentUser || !unlocked) return;
      $('formMessage').textContent = 'Saving...';
      try {
        await addDoc(collection(db, 'plans'), {
          title, date: $('planDate').value, details: $('planDetails').value.trim(),
          status: 'Wishlist', authorId: currentUser.uid, authorName: 'Someone special', createdAt: serverTimestamp()
        });
        $('planForm').reset();
        $('formMessage').textContent = 'Added to our plans ♡';
      } catch (error) {
        $('formMessage').textContent = 'Could not save this plan. Check Firestore rules.';
        console.error(error);
      }
    });
  }

  showGate();
  if (unlocked) connect();
}
