import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import * as closetApp from "./closetApp.js";
import * as makeupApp from "./makeupApp.js";
const notSignedIn = document.getElementById('not-signed-in');
const authForm = document.getElementById('auth-form');
const toggleSignUp = document.getElementById('toggle-sign-up');
const signOutButton = document.getElementById ('sign-out-button');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
let isSignUpMode = false;
export let userId = null;

//注册+登录

toggleSignUp.addEventListener("click", () => {
    isSignUpMode = true;
})

authForm.addEventListener("submit", handleAuth);

async function handleAuth(e) {
    e.preventDefault();  

    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
    } else {
        await signInWithEmailAndPassword(auth, email, password);
    }
}

//注销功能 log off
signOutButton.addEventListener("click",()=>{
    signOut(auth);
})

//Toast功能
export function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'py-3 px-5 rounded-lg shadow-lg text-white font-semibold'; 
    
    if (type === 'success') {
        toast.classList.add('bg-green-500');
    } else {
        toast.classList.add('bg-blue-500');
    }

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

//switchApp
const appCloset = document.getElementById("app-closet");
const appMakeup = document.getElementById("app-makeup");
const mobileNavCloset = document.getElementById("mobile-nav-closet");
const mobileNavMakeup = document.getElementById("mobile-nav-makeup");
function switchApp(appName) {
    // 先全部隐藏
    appCloset.classList.add("hidden");
    appMakeup.classList.add("hidden");

    // 再显示目标 app
    if (appName === "closet") {
        appCloset.classList.remove("hidden");
    }

    if (appName === "makeup") {
        appMakeup.classList.remove("hidden");
    }
}
document
    .getElementById("nav-closet")
    .addEventListener("click", () => {
        switchApp("closet");
    });

document
    .getElementById("nav-makeup")
    .addEventListener("click", () => {
        switchApp("makeup");
    });

mobileNavCloset.addEventListener("click", () => {
    switchApp("closet");
});

mobileNavMakeup.addEventListener("click", () => {
    switchApp("makeup");
});

//登录前显示登录页，用户名为空；登录后显示软件，更新用户名
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        notSignedIn.classList.add('hidden');
    
        closetApp.init(); //开始运行衣橱程序，未来改成开始运行switchApp的程序
        makeupApp.init();   // 👈 新增
        switchApp("closet");   // ③ 决定当前显示哪个
    } else {
        userId = null;
        notSignedIn.classList.remove('hidden');
    }
});