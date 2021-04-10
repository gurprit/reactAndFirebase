import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

var firebaseConfig = {
    apiKey: "AIzaSyCQJvUsriQXE1oBrGhqpST4Ul8PWXXuy6s",
    authDomain: "firestore-react-b3eed.firebaseapp.com",
    projectId: "firestore-react-b3eed",
    storageBucket: "firestore-react-b3eed.appspot.com",
    messagingSenderId: "375262820448",
    appId: "1:375262820448:web:246efe3b3ecf7880e7eb05"
  };

const firebaseApp = !firebase.apps.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();
const storage = firebaseApp.storage();

export async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    window.location.reload();
}

export function checkAuth(cb) {
    return auth.onAuthStateChanged(cb);
}

export async function logOut() {
    await auth.signOut();
    window.location.reload();
}

export async function getCollection(id) {
  const snapshot = await db.collection(id).get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(data);
}

export async function getUserLists(userId) {
    const snapshot = await db.
        collection('lists')
        //.where('author', '==', userId)
        .where('userIds', 'array-contains', userId)
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function uploadCoverImage(file) {
    const uploadTask = storage
        .ref(`images/${file.name}-${file.lastModified}`)
        .put(file);
        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed", 
                (snapshot) => console.log("image uploading", snapshot), 
                reject,
                () => {
                    storage.ref('images').child(`${file.name}-${file.lastModified}`).getDownloadURL().then(resolve)
                }
            );
        })
}

export async function createList(list, user) {
    const { name, description, image } = list
    await db.collection('lists').add({
        name, 
        description,
        image: image ? await uploadCoverImage(image) : null,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        author: user.uid,
        userIds: [user.uid],
        users: [
            {
                id: user.uid, 
                name: user.displayName
            },
        ],
    });
}

export async function getList(listId) {
    try {
        const list = await db.collection('lists').doc(listId).get();
        if (!list.exists) throw Error(`List doesn't exist`)
        return list.data();
    } catch (error) {
        console.error(error);
        throw Error(error);
    }
}

export async function createListItem({ user, listId , item }) {
    try {
        //const response = await fetch(`https://shot.screenshotapi.net/screenshot?token=5JFDS6Q-ZXC4V87-HWHHHBQ-FNBR7F7&url=${item.link}&output=image&file_type=png`);
        //const { screenshot } = await response.json();
        db.collection('lists').doc(listId).collection('items').add({
            name: item.name, 
            link: item.link, 
            image: null, 
            created: firebase.firestore.FieldValue.serverTimestamp(),
            author: {
                id: user.uid, 
                username: user.displayName
            }
        })
    } catch (error) {
        console.error(error);
        throw new Error(error)
    }
}

export function subscribeToListItems(listId, cb) {
    return db.collection('lists')
    .doc(listId)
    .collection('items')
    .orderBy('created', 'desc')
    .onSnapshot(cb);
}

export function deleteListItem(listId, itemId) {
    return db.collection('lists')
    .doc(listId)
    .collection('items')
    .doc(itemId)
    .delete();
}

export async function addUserToList(user, listId) {
    await db.collection('lists').doc(listId).update({
        userIds: firebase.firestore.FieldValue.arrayUnion(user.uid),
        users: firebase.firestore.FieldValue.arrayUnion({
            id: user.uid,
            name: user.displayName
        })
    })
    window.location.reload();
}