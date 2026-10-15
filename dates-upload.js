
import { auth, db } from "./firebase-config.js";

import {
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CLOUD_NAME = "owvwb26a";
const UPLOAD_PRESET = "our_memories";

const showButton = document.getElementById("showDateUpload");
const form = document.getElementById("dateUploadForm");
const fileInput = document.getElementById("datePhotoFile");
const titleInput = document.getElementById("dateTitle");
const captionInput = document.getElementById("dateCaption");
const submitButton = document.getElementById("submitDatePhoto");
const status = document.getElementById("dateUploadStatus");
const gallery = document.getElementById("sharedDates");

let listening = false;

showButton.addEventListener("click", () => {
  form.classList.toggle("open");
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      status.textContent = "Could not connect to our dates.";
    }
    return;
  }

  if (listening) return;
  listening = true;

  const datesQuery = query(
    collection(db, "datePhotos"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(datesQuery, (snapshot) => {
    gallery.querySelectorAll(".uploaded-date").forEach(card => card.remove());

    snapshot.forEach((docSnapshot) => {
      const date = docSnapshot.data();

      if (
        typeof date.url !== "string" ||
        !date.url.startsWith(
          `https://res.cloudinary.com/${CLOUD_NAME}/`
        )
      ) return;

      const card = document.createElement("article");
      card.className = "date-card uploaded-date";

      const tape = document.createElement("div");
      tape.className = "date-tape";

      const image = document.createElement("img");
      image.src = date.url;
      image.alt = date.title || "Our date";
      image.loading = "lazy";

      const title = document.createElement("p");
      title.className = "date-time";
      title.textContent = date.title || "Our date ♡";

      const description = document.createElement("p");
      description.className = "date-description";
      description.textContent = date.caption || "";

      card.append(tape, image, title, description);
      gallery.appendChild(card);
    });
  }, () => {
    status.textContent = "Could not load our date photos.";
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];
  const title = titleInput.value.trim();

  if (!file || !title) {
    status.textContent = "Please choose a photo and name the date.";
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    status.textContent = "Choose a JPG, PNG or WebP image.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    status.textContent = "Choose a photo under 5 MB.";
    return;
  }

  if (!auth.currentUser) {
    status.textContent = "Still connecting. Try again.";
    return;
  }

  submitButton.disabled = true;
  status.textContent = "Saving our date... ♡";

  try {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: uploadData
      }
    );

    const result = await response.json();

    if (!response.ok || !result.secure_url) {
      throw new Error("Photo upload failed");
    }

    await addDoc(collection(db, "datePhotos"), {
      url: result.secure_url,
      title: title.slice(0, 80),
      caption: captionInput.value.trim().slice(0, 200),
      createdAt: serverTimestamp()
    });

    status.textContent = "Our date has been added! ♡";
    form.reset();

  } catch (error) {
    console.error(error);
    status.textContent = "Could not save the date. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});
