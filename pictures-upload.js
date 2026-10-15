
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

const showUpload = document.getElementById("showUpload");
const uploadForm = document.getElementById("uploadForm");
const photoFile = document.getElementById("photoFile");
const photoCaption = document.getElementById("photoCaption");
const submitPhoto = document.getElementById("submitPhoto");
const uploadStatus = document.getElementById("uploadStatus");
const sharedAlbum = document.getElementById("sharedAlbum");

let ready = false;

showUpload.addEventListener("click", () => {
  uploadForm.classList.toggle("open");
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      uploadStatus.textContent = "Could not connect to our album.";
    }
    return;
  }

  if (ready) return;
  ready = true;

  const photosQuery = query(
    collection(db, "photos"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(photosQuery, (snapshot) => {
    sharedAlbum.replaceChildren();

    snapshot.forEach((documentSnapshot) => {
      const photo = documentSnapshot.data();

      if (
        typeof photo.url !== "string" ||
        !photo.url.startsWith(
          `https://res.cloudinary.com/${CLOUD_NAME}/`
        )
      ) return;

      const figure = document.createElement("figure");
      figure.className = "polaroid album-photo";

      const img = document.createElement("img");
      img.src = photo.url;
      img.alt = photo.caption || "Our memory";
      img.loading = "lazy";

      const caption = document.createElement("figcaption");
      caption.textContent = photo.caption || "♡";

      figure.append(img, caption);
      sharedAlbum.appendChild(figure);
    });
  }, () => {
    uploadStatus.textContent = "Could not load shared photos.";
  });
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = photoFile.files[0];

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    uploadStatus.textContent = "Choose a JPG, PNG or WebP image.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadStatus.textContent = "Please choose a photo under 5 MB.";
    return;
  }

  if (!auth.currentUser) {
    uploadStatus.textContent = "Still connecting. Try again.";
    return;
  }

  submitPhoto.disabled = true;
  uploadStatus.textContent = "Uploading your memory... ♡";

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok || !result.secure_url) {
      throw new Error("Upload failed");
    }

    await addDoc(collection(db, "photos"), {
      url: result.secure_url,
      caption: photoCaption.value.trim().slice(0, 120),
      createdAt: serverTimestamp()
    });

    uploadStatus.textContent = "Memory added! ♡";
    uploadForm.reset();

  } catch (error) {
    uploadStatus.textContent =
      "Something went wrong. Please try again.";
  } finally {
    submitPhoto.disabled = false;
  }
});
