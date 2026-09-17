import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    query,
    where,
    orderBy,
    getDoc,
    updateDoc,
    addDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAyhSEWtN-y6o9Myt-cDe9193QWv11rbTU",
    authDomain: "turtless-web.firebaseapp.com",
    projectId: "turtless-web",
    storageBucket: "turtless-web.firebasestorage.app",
    messagingSenderId: "794305996729",
    appId: "1:794305996729:web:cf7132e77cc5621c5bb868"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.addDoc = addDoc;
window.collection = collection;
window.query = query;
window.orderBy = orderBy;
window.getDocs = getDocs;
window.doc = doc;
window.deleteDoc = deleteDoc;
window.updateDoc = updateDoc;
window.setDoc = setDoc;
window.getDoc = getDoc;

const IMGBB_API_KEY = "Ffc86d1890f11e1bb04886dd9c10ecbc";

let currentUserId = sessionStorage.getItem("turtlessUserId");
let currentUserData = null;
let isEditMode = false;

let cachedGallery = [];
let sliderData = [];
let sponsorData = [];
let allMembers = [];

let savedEditorRange = null;


/* =========================================================
   번역
========================================================= */

window.changeLanguage = function (val) {
    const gtCombo = document.querySelector(".goog-te-combo");

    if (gtCombo == null) {
        alert("번역기를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return false;
    }

    gtCombo.value = val;
    gtCombo.dispatchEvent(new Event("change"));
};


/* =========================================================
   에디터
========================================================= */

window.saveEditorSelection = () => {
    const sel = window.getSelection();

    if (sel.getRangeAt && sel.rangeCount) {
        savedEditorRange = sel.getRangeAt(0);
    }
};

window.applyCustomFontSize = (size) => {
    if (!size) return;

    const selection = window.getSelection();

    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) return;

    const span = document.createElement("span");

    span.style.fontSize = size;
    span.style.display = "inline-block";
    span.style.lineHeight = "1.4";

    try {
        range.surroundContents(span);
    } catch (e) {
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("fontSize", false, "3");

        const parent = range.commonAncestorContainer.parentElement;

        if (parent) {
            const fontElements = parent.querySelectorAll("font");

            fontElements.forEach(el => {
                if (el.getAttribute("size") === "3") {
                    el.removeAttribute("size");
                    el.style.fontSize = size;
                }
            });
        }
    }
};

window.insertEditorImage = async (input) => {
    if (!input.files || !input.files[0]) return;

    try {
        const formData = new FormData();

        formData.append("upload_preset", "ml_default");
        formData.append("file", input.files[0]);

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (data.secure_url) {
            const imageHtml = `
                <div
                    class="resizable-img-box"
                    style="
                        display:inline-block;
                        position:relative;
                        resize:both;
                        overflow:hidden;
                        width:200px;
                        max-width:100%;
                    "
                >
                    <img
                        src="${data.secure_url}"
                        referrerpolicy="no-referrer"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:contain;
                            pointer-events:none;
                        "
                    />
                </div>
                <p>&nbsp;</p>
            `;

            document.execCommand(
                "insertHTML",
                false,
                imageHtml
            );

            input.value = "";

            alert("이미지 삽입 완료!");
        } else {
            alert(
                "업로드 실패: " +
                (data.error?.message || "알 수 없는 오류")
            );
        }

    } catch (e) {
        alert("업로드 에러: " + e.message);
    }
};


/* =========================================================
   팀원
========================================================= */

async function loadMembers() {
    const list = document.getElementById("member-list");

    if (!list) return;

    try {
        const snap = await getDocs(
            collection(db, "users")
        );

        const uniqueMembersMap = new Map();

        snap.forEach(d => {
            const data = d.data();

            if (!data.name) return;

            const uniqueKey =
                `${data.school}_${data.grade}_${data.name}`;

            if (!uniqueMembersMap.has(uniqueKey)) {
                uniqueMembersMap.set(
                    uniqueKey,
                    {
                        id: d.id,
                        ...data
                    }
                );
            }
        });

        allMembers = Array.from(
            uniqueMembersMap.values()
        );

        allMembers.sort((a, b) =>
            a.school === b.school
                ? a.name.localeCompare(b.name)
                : a.school.localeCompare(b.school)
        );


        let mentorHtml = "";
        let leaderHtml = "";
        let memberHtml = "";


        /* -------------------------
           멘토
        ------------------------- */

        const mentorSpecs = [
            { name: "김정한" },
            { name: "천강숙" },
            { name: "김도윤" },
            { name: "장동준" }
        ];

        mentorSpecs.forEach(spec => {
            const found = allMembers.find(
                m => m.name === spec.name
            );

            if (!found) return;

            const imgDefault =
                found.profileImage ||
                "https://dummyimage.com/400x400/000000/ffffff&text=Default";

            const imgHover =
                found.profileHoverImage ||
                "https://dummyimage.com/400x400/ffffff/000000&text=Hover";

            const newBadge = found.isNew
                ? '<span class="member-badge-new">NEW</span>'
                : "";

            const roleBadge = `
                <span
                    style="
                        position:absolute;
                        top:10px;
                        left:10px;
                        background:#007bff;
                        color:white;
                        font-size:11px;
                        padding:4px 8px;
                        border-radius:4px;
                        font-weight:900;
                        z-index:10;
                        box-shadow:0 2px 5px rgba(0,0,0,0.2);
                    "
                >
                    멘토
                </span>
            `;

            mentorHtml += `
                <div
                    class="member-card"
                    onclick="window.openMemberModal('${found.id}')"
                >
                    ${newBadge}
                    ${roleBadge}

                    <div class="photo-area">
                        <img
                            src="${imgDefault}"
                            class="img-default"
                        >

                        <img
                            src="${imgHover}"
                            class="img-hover"
                        >
                    </div>

                    <div class="info-area">
                        <div class="school">
                            ${found.school || ""}
                        </div>

                        <div class="name">
                            ${found.name}
                        </div>
                    </div>
                </div>
            `;
        });


        /* -------------------------
           팀장
        ------------------------- */

        const leaderSpecs = [
            {
                name: "정지우",
                school: "용산철도고",
                grade: "2학년",
                title: "팀 리더"
            },
            {
                name: "김승혁",
                school: "용산철도고",
                grade: "2학년",
                title: "빌드 팀장"
            },
            {
                name: "김아인",
                school: "서울매그넷고",
                grade: "1학년",
                title: "마케팅 팀장"
            },
            {
                name: "송주원",
                school: "용산철도고",
                grade: "2학년",
                title: "회계 팀장"
            },
            {
                name: "김윤상",
                school: "선린인터넷고",
                grade: "1학년",
                title: "전략 팀장"
            }
        ];

        leaderSpecs.forEach(spec => {
            const found = allMembers.find(
                m =>
                    m.name === spec.name &&
                    m.school === spec.school &&
                    m.grade === spec.grade
            );

            if (!found) return;

            const imgDefault =
                found.profileImage ||
                "https://dummyimage.com/400x400/000000/ffffff&text=Default";

            const imgHover =
                found.profileHoverImage ||
                "https://dummyimage.com/400x400/ffffff/000000&text=Hover";

            const newBadge = found.isNew
                ? '<span class="member-badge-new">NEW</span>'
                : "";

            const roleBadge = `
                <span
                    style="
                        position:absolute;
                        top:10px;
                        left:10px;
                        background:#2c91f9;
                        color:#ffffff;
                        font-size:11px;
                        padding:4px 8px;
                        border-radius:4px;
                        font-weight:900;
                        z-index:10;
                        box-shadow:0 2px 5px rgba(0,0,0,0.2);
                    "
                >
                    ${spec.title}
                </span>
            `;

            leaderHtml += `
                <div
                    class="member-card"
                    onclick="window.openMemberModal('${found.id}')"
                >
                    ${newBadge}
                    ${roleBadge}

                    <div class="photo-area">
                        <img
                            src="${imgDefault}"
                            class="img-default"
                        >

                        <img
                            src="${imgHover}"
                            class="img-hover"
                        >
                    </div>

                    <div class="info-area">
                        <div class="school">
                            ${found.school}
                        </div>

                        <div class="name">
                            ${found.name}
                        </div>
                    </div>
                </div>
            `;
        });


        /* -------------------------
           일반 팀원
        ------------------------- */

        allMembers.forEach(m => {
            const isLeader = leaderSpecs.some(
                spec =>
                    m.name === spec.name &&
                    m.school === spec.school &&
                    m.grade === spec.grade
            );

            const isMentor = mentorSpecs.some(
                spec => m.name === spec.name
            );

            if (isLeader || isMentor) return;

            const imgDefault =
                m.profileImage ||
                "https://dummyimage.com/400x400/000000/ffffff&text=Default";

            const imgHover =
                m.profileHoverImage ||
                "https://dummyimage.com/400x400/ffffff/000000&text=Hover";

            const newBadge = m.isNew
                ? '<span class="member-badge-new">NEW</span>'
                : "";

            const roleBadge = `
                <span
                    style="
                        position:absolute;
                        top:10px;
                        left:10px;
                        background:#6c757d;
                        color:white;
                        font-size:11px;
                        padding:4px 8px;
                        border-radius:4px;
                        font-weight:900;
                        z-index:10;
                        box-shadow:0 2px 5px rgba(0,0,0,0.2);
                    "
                >
                    팀원
                </span>
            `;

            memberHtml += `
                <div
                    class="member-card"
                    onclick="window.openMemberModal('${m.id}')"
                >
                    ${newBadge}
                    ${roleBadge}

                    <div class="photo-area">
                        <img
                            src="${imgDefault}"
                            class="img-default"
                        >

                        <img
                            src="${imgHover}"
                            class="img-hover"
                        >
                    </div>

                    <div class="info-area">
                        <div class="school">
                            ${m.school}
                        </div>

                        <div class="name">
                            ${m.name}
                        </div>
                    </div>
                </div>
            `;
        });


        list.innerHTML = `
            <h3
                style="
                    margin-bottom:15px;
                    color:var(--text-main);
                    font-weight:900;
                    border-left:4px solid #007bff;
                    padding-left:10px;
                "
            >
                Mentors (멘토)
            </h3>

            <div
                class="member-grid"
                style="
                    margin-top:0;
                    margin-bottom:40px;
                "
            >
                ${
                    mentorHtml ||
                    '<p style="color:#777;font-size:14px;grid-column:1/-1;">등록된 멘토가 없습니다.</p>'
                }
            </div>


            <h3
                style="
                    margin-bottom:15px;
                    color:var(--text-main);
                    font-weight:900;
                    border-left:4px solid var(--primary-color);
                    padding-left:10px;
                "
            >
                Leaders (팀장)
            </h3>

            <div
                class="member-grid"
                style="
                    margin-top:0;
                    margin-bottom:40px;
                "
            >
                ${
                    leaderHtml ||
                    '<p style="color:#777;font-size:14px;grid-column:1/-1;">등록된 팀장이 없습니다.</p>'
                }
            </div>


            <h3
                style="
                    margin-bottom:15px;
                    color:var(--text-main);
                    font-weight:900;
                    border-left:4px solid #6c757d;
                    padding-left:10px;
                "
            >
                Members (팀원)
            </h3>

            <div
                class="member-grid"
                style="margin-top:0;"
            >
                ${
                    memberHtml ||
                    '<p style="color:#777;font-size:14px;grid-column:1/-1;">등록된 팀원이 없습니다.</p>'
                }
            </div>
        `;

    } catch (e) {
        console.error("[TURTLESS] 팀원 불러오기 실패:", e);
    }
}


function getShortSchoolName(school) {
    if (!school) return "";

    if (school === "용산고") return "용고";
    if (school === "선린인터넷고") return "선린인고";

    let name = school
        .replace(/\s+/g, "")
        .replace(/고등학교$/, "")
        .replace(/고등$/, "")
        .replace(/학교$/, "");

    if (name.length <= 2) {
        return name + "고";
    }

    return name[0] + name[2] + "고";
}


window.editingMemberId = null;

window.openMemberModal = (id) => {
    window.editingMemberId = id;

    const m = allMembers.find(x => x.id === id);

    if (!m) return;

    const img =
        m.profileImage ||
        "https://dummyimage.com/400x400/000000/ffffff&text=Profile";

    const bio =
        m.bio ||
        "아직 등록된 소개가 없습니다.";

    const contact =
        m.contact ||
        "없음";


    const html = `
        <div class="member-detail-header">
            <span>${m.name}</span>
        </div>

        <div class="member-detail-body">

            <div class="member-detail-profile">
                <img
                    src="${img}"
                    alt="${m.name}"
                >

                <h2>
                    ${m.name}

                    <span>
                        ${getShortSchoolName(m.school)}
                        ${m.grade}
                    </span>
                </h2>
            </div>


            <div class="member-detail-box">
                <strong>학교 · 학년</strong>
                <p>
                    ${m.school} ${m.grade}
                </p>
            </div>


            <div class="member-detail-box">
                <strong>소개글</strong>

                <p>
                    ${bio.replace(/\n/g, "<br>")}
                </p>
            </div>


            <div class="member-detail-box">
                <strong>연락처/SNS</strong>

                <p>
                    ${contact}
                </p>
            </div>

        </div>
    `;


    document.getElementById(
        "member-detail-view"
    ).innerHTML = html;


    const editSection =
        document.getElementById("member-detail-edit");


    if (
        currentUserId === id ||
        (
            currentUserData &&
            currentUserData.role === "admin"
        )
    ) {
        editSection.style.display = "block";

        document.getElementById("edit-bio").value =
            m.bio || "";

        document.getElementById("edit-contact").value =
            m.contact || "";

        document.getElementById("edit-isnew").checked =
            !!m.isNew;

    } else {
        editSection.style.display = "none";
    }


    document.getElementById(
        "member-detail-modal"
    ).style.display = "flex";
};


window.closeMemberModal = () => {
    document.getElementById(
        "member-detail-modal"
    ).style.display = "none";
};


window.saveMemberDetails = async () => {
    const targetId =
        window.editingMemberId ||
        currentUserId;

    if (!targetId) return;

    const bio =
        document.getElementById("edit-bio").value;

    const contact =
        document.getElementById("edit-contact").value;

    const isNew =
        document.getElementById("edit-isnew").checked;


    try {
        await updateDoc(
            doc(db, "users", targetId),
            {
                bio,
                contact,
                isNew
            }
        );

        alert("정보가 저장되었습니다!");

        await loadMembers();

        window.closeMemberModal();

    } catch (e) {
        alert("저장 실패: " + e.message);
    }
};


window.uploadProfileImage = async (
    input,
    fieldName
) => {
    if (
        !input.files ||
        !input.files[0] ||
        !currentUserId
    ) {
        return;
    }

    try {
        alert("업로드 중...");

        const formData = new FormData();

        formData.append(
            "upload_preset",
            "ml_default"
        );

        formData.append(
            "file",
            input.files[0]
        );


        const response = await fetch(
            "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();


        if (data.secure_url) {
            const updateData = {};

            updateData[fieldName] =
                data.secure_url;

            await updateDoc(
                doc(db, "users", currentUserId),
                updateData
            );

            alert("성공적으로 변경되었습니다!");

            await loadMembers();

        } else {
            alert("업로드 실패");
        }

    } catch (e) {
        alert("오류: " + e.message);
    }
};


window.resetProfileImage = async () => {
    if (!currentUserId) return;

    if (
        !confirm(
            "프로필 사진을 삭제하고 기본 이미지로 초기화하시겠습니까?"
        )
    ) {
        return;
    }

    try {
        await updateDoc(
            doc(db, "users", currentUserId),
            {
                profileImage: null,
                profileHoverImage: null
            }
        );

        alert("초기화가 완료되었습니다.");

        await loadMembers();

    } catch (e) {
        alert("초기화 실패: " + e.message);
    }
};


/* =========================================================
   주요 활동
========================================================= */

window.uploadActivity = async () => {
    if (!currentUserData) return;

    const title =
        document.getElementById(
            "new-act-title"
        ).value.trim();

    const content =
        document.getElementById(
            "new-act-content"
        ).value.trim();

    const fileInput =
        document.getElementById(
            "new-act-file"
        );


    if (!title || !content) {
        alert("제목과 내용을 입력하세요.");
        return;
    }


    let imageUrl = null;


    if (
        fileInput.files &&
        fileInput.files[0]
    ) {
        alert("사진을 업로드하는 중입니다...");

        const formData = new FormData();

        formData.append(
            "upload_preset",
            "ml_default"
        );

        formData.append(
            "file",
            fileInput.files[0]
        );


        const response = await fetch(
            "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();


        if (data.secure_url) {
            imageUrl = data.secure_url;
        } else {
            alert(
                "사진 업로드 실패. 텍스트만 등록됩니다."
            );
        }
    }


    try {
        await addDoc(
            collection(db, "activities"),
            {
                title,
                content,
                imageUrl,
                author: currentUserData.name,
                createdAt: Date.now()
            }
        );

        alert("등록 완료!");

        document.getElementById(
            "new-act-title"
        ).value = "";

        document.getElementById(
            "new-act-content"
        ).value = "";

        fileInput.value = "";

        await loadActivities();

    } catch (e) {
        console.error(
            "[TURTLESS] 활동 등록 실패:",
            e
        );
    }
};


async function loadActivities() {
    const notice =
        document.getElementById(
            "home-notice-board"
        );

    const ticker =
        document.getElementById(
            "latest-ticker"
        );

    const actPageContent =
        document.getElementById(
            "activity-page-content"
        );


    try {
        const snap =
            await getDocs(
                collection(db, "activities")
            );


        const items = [];

        snap.forEach(d => {
            items.push({
                id: d.id,
                ...d.data()
            });
        });


        items.sort(
            (a, b) =>
                (b.createdAt || 0) -
                (a.createdAt || 0)
        );


        if (
            items.length > 0 &&
            ticker
        ) {
            ticker.innerText =
                items[0].title;
        }


        if (notice) {
            let nh = "";

            items
                .slice(0, 4)
                .forEach(i => {
                    nh += `
                        <div
                            class="notice-item"
                            onclick="window.goAct('${i.id}')"
                        >
                            <span class="notice-badge">
                                소식
                            </span>

                            <p>
                                ${i.title}
                            </p>
                        </div>
                    `;
                });

            notice.innerHTML =
                nh ||
                "<p>최신 소식 없음</p>";
        }


        if (actPageContent) {
            let ah = "";

            const isAdmin =
                currentUserData?.role === "admin";

            const now = Date.now();


            items.forEach(i => {
                const delBtn = isAdmin
                    ? `
                        <button
                            class="delete-btn"
                            style="display:block"
                            onclick="window.deleteActivity('${i.id}')"
                        >
                            🗑️ 삭제
                        </button>
                    `
                    : "";


                const isNew =
                    now -
                    (i.createdAt || 0) <=
                    86400000;


                const newBadge = isNew
                    ? `
                        <span
                            style="
                                background:var(--primary-color);
                                color:white;
                                font-size:11px;
                                padding:2px 6px;
                                border-radius:4px;
                                margin-left:8px;
                                vertical-align:middle;
                                font-weight:900;
                            "
                        >
                            최신
                        </span>
                    `
                    : "";


                const imgTag = i.imageUrl
                    ? `
                        <div
                            class="resizable-img-box"
                            style="
                                margin-top:15px;
                                width:100%;
                                max-width:400px;
                            "
                        >
                            <img
                                src="${i.imageUrl}"
                                style="
                                    width:100%;
                                    display:block;
                                    pointer-events:none;
                                "
                            >
                        </div>
                    `
                    : "";


                ah += `
                    <div
                        class="act-list-item"
                        id="act-${i.id}"
                    >
                        ${delBtn}

                        <h3>
                            ${i.title}

                            <span
                                class="date"
                                style="
                                    font-size:13px;
                                    color:#777;
                                    margin-left:10px;
                                    font-weight:500;
                                "
                            >
                                ${
                                    i.createdAt
                                        ? new Date(
                                              i.createdAt
                                          ).toLocaleDateString()
                                        : ""
                                }
                            </span>

                            ${newBadge}
                        </h3>

                        <p style="white-space:pre-wrap;">
                            ${i.content}
                        </p>

                        ${imgTag}
                    </div>
                `;
            });


            actPageContent.innerHTML =
                ah ||
                "<p>등록된 활동 없음</p>";


            if (
                location.hash.startsWith(
                    "#act-"
                )
            ) {
                const targetEl =
                    document.getElementById(
                        decodeURIComponent(
                            location.hash.slice(1)
                        )
                    );

                if (targetEl) {
                    setTimeout(
                        () => {
                            targetEl.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });
                        },
                        50
                    );
                }
            }
        }


        loadYoutubeFallback();

    } catch (e) {
        console.error(
            "[TURTLESS] 활동 불러오기 실패:",
            e
        );

        loadYoutubeFallback();
    }
}


window.deleteActivity = async (id) => {
    if (!confirm("삭제하시겠습니까?")) {
        return;
    }

    try {
        await deleteDoc(
            doc(db, "activities", id)
        );

        await loadActivities();

    } catch (e) {
        alert(
            "삭제 실패: " +
            e.message
        );
    }
};


window.goAct = (id) => {
    const el =
        document.getElementById(
            "act-" + id
        );

    if (el) {
        el.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return;
    }


    const isHome =
        !!document.getElementById(
            "page-home"
        );

    const activityPath =
        isHome
            ? "./pages/activity/"
            : "../activity/";


    location.href =
        activityPath +
        "#act-" +
        encodeURIComponent(id);
};


/* =========================================================
   갤러리
========================================================= */

window.uploadGalleryImage = async () => {
    if (!currentUserData) return;

    const fileInput =
        document.getElementById(
            "new-gal-file"
        );

    const categorySelect =
        document.getElementById(
            "new-gal-category"
        ).value;

    const dateInput =
        document.getElementById(
            "new-gal-date"
        ).value;


    if (
        !fileInput.files ||
        !fileInput.files[0]
    ) {
        return;
    }


    const selectedTimestamp =
        dateInput
            ? new Date(dateInput).getTime()
            : Date.now();


    try {
        alert("업로드 중...");

        const formData =
            new FormData();

        formData.append(
            "upload_preset",
            "ml_default"
        );

        formData.append(
            "file",
            fileInput.files[0]
        );


        const response = await fetch(
            "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data =
            await response.json();


        if (data.secure_url) {
            await addDoc(
                collection(db, "gallery"),
                {
                    url: data.secure_url,
                    category: categorySelect,
                    uploader:
                        currentUserData.name,
                    createdAt: Date.now(),
                    selectedDate:
                        selectedTimestamp
                }
            );

            alert("사진 추가 완료!");

            fileInput.value = "";

            await loadGallery();

        } else {
            alert(
                "업로드 실패: " +
                (
                    data.error
                        ? data.error.message
                        : "알 수 없는 오류"
                )
            );
        }

    } catch (e) {
        alert(
            "오류: " +
            e.message
        );
    }
};


async function loadGallery() {
    try {
        const snap =
            await getDocs(
                collection(db, "gallery")
            );


        cachedGallery = [];

        snap.forEach(d => {
            cachedGallery.push({
                id: d.id,
                ...d.data()
            });
        });


        cachedGallery.sort(
            (a, b) =>
                (
                    b.selectedDate ||
                    b.createdAt ||
                    0
                ) -
                (
                    a.selectedDate ||
                    a.createdAt ||
                    0
                )
        );


        const homeGrid =
            document.getElementById(
                "home-gallery-4grid"
            );


        if (homeGrid) {
            let gh = "";

            for (
                let i = 0;
                i < 6;
                i++
            ) {
                const imgUrl =
                    cachedGallery[i]
                        ? cachedGallery[i].url
                        : "https://dummyimage.com/300x300/f0f0f0/999999&text=TURTLESS";

                gh += `
                    <div class="home-photo-item">
                        <img src="${imgUrl}">
                    </div>
                `;
            }

            homeGrid.innerHTML = gh;
        }


        window.filterGallery("종합");

    } catch (e) {
        console.error(
            "[TURTLESS] 갤러리 불러오기 실패:",
            e
        );
    }
}


window.filterGallery = (category) => {
    document
        .querySelectorAll(
            "#gallery-filters .filter-btn"
        )
        .forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.innerText === category
            );
        });


    const galleryPage =
        document.getElementById(
            "gallery-page-content"
        );


    if (!galleryPage) return;


    const filtered =
        category !== "종합"
            ? cachedGallery.filter(
                  g =>
                      g.category ===
                      category
              )
            : cachedGallery;


    const isAdmin =
        currentUserData?.role ===
        "admin";


    let ph =
        '<div class="gallery-grid">';


    filtered.forEach(g => {
        const displayDate =
            g.selectedDate ||
            g.createdAt;

        const dateStr =
            displayDate
                ? new Date(
                      displayDate
                  ).toLocaleDateString()
                : "";


        const delBtn = isAdmin
            ? `
                <button
                    class="delete-btn"
                    style="
                        display:block;
                        position:absolute;
                        top:10px;
                        right:10px;
                        background:rgba(220,53,69,0.9);
                        color:white;
                        border:none;
                        padding:5px 10px;
                        border-radius:4px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:bold;
                        z-index:10;
                    "
                    onclick="window.deleteGallery('${g.id}')"
                >
                    🗑️ 삭제
                </button>
            `
            : "";


        const editBtn = isAdmin
            ? `
                <button
                    class="edit-btn"
                    style="
                        display:block;
                        position:absolute;
                        top:10px;
                        right:70px;
                        background:rgba(0,123,255,0.9);
                        color:white;
                        border:none;
                        padding:5px 10px;
                        border-radius:4px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:bold;
                        z-index:10;
                    "
                    onclick="window.updateGalleryDate('${g.id}', ${displayDate})"
                >
                    📅 수정
                </button>
            `
            : "";


        ph += `
            <div class="gallery-grid-item">
                ${delBtn}
                ${editBtn}

                <img
                    src="${g.url}"
                    style="pointer-events:none;"
                >

                <div
                    style="
                        text-align:center;
                        font-size:12.5px;
                        color:#777;
                        margin-top:8px;
                        font-weight:500;
                    "
                >
                    ${dateStr}
                </div>
            </div>
        `;
    });


    ph += "</div>";


    galleryPage.innerHTML =
        ph ===
        '<div class="gallery-grid"></div>'
            ? "<p>등록된 이미지가 없습니다.</p>"
            : ph;
};


window.deleteGallery = async (id) => {
    if (!confirm("삭제하시겠습니까?")) {
        return;
    }

    try {
        await deleteDoc(
            doc(db, "gallery", id)
        );

        await loadGallery();

    } catch (e) {
        alert(
            "삭제 실패: " +
            e.message
        );
    }
};


window.updateGalleryDate = async (
    id,
    currentTimestamp
) => {
    const currentStr =
        currentTimestamp
            ? new Date(
                  currentTimestamp
              )
                  .toISOString()
                  .split("T")[0]
            : "";


    const newDate =
        prompt(
            "수정할 날짜를 입력하세요 (형식: YYYY-MM-DD)",
            currentStr
        );


    if (!newDate) return;


    const selectedTimestamp =
        new Date(newDate).getTime();


    if (isNaN(selectedTimestamp)) {
        alert(
            "올바른 날짜 형식이 아닙니다. (예: 2026-07-01)"
        );

        return;
    }


    try {
        await updateDoc(
            doc(db, "gallery", id),
            {
                selectedDate:
                    selectedTimestamp
            }
        );

        alert(
            "사진 날짜가 성공적으로 수정되었습니다!"
        );

        await loadGallery();

    } catch (e) {
        alert(
            "날짜 수정 실패: " +
            e.message
        );
    }
};


/* =========================================================
   유튜브
========================================================= */

function loadYoutubeFallback() {
    const ytList =
        document.getElementById(
            "youtube-auto-list"
        );

    if (!ytList) return;


    const channelId =
        "UC8QwTy46OaCGdTauiPYkeow";

    const cacheKey =
        "turtless_youtube_latest_v3";

    const feedUrl =
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;


    ytList.innerHTML =
        '<div class="youtube-auto-loading">최근 영상을 불러오는 중…</div>';


    const escapeHtml = (v) =>
        String(v || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");


    const render = (items) => {
        if (
            !Array.isArray(items) ||
            !items.length
        ) {
            throw new Error(
                "No videos"
            );
        }


        ytList.innerHTML =
            '<h2 class="section-subtitle">Youtube Media</h2>';


        items
            .slice(0, 3)
            .forEach(item => {
                const videoId =
                    item.videoId || "";


                const href =
                    item.link ||
                    (
                        videoId
                            ? `https://www.youtube.com/watch?v=${videoId}`
                            : `https://www.youtube.com/channel/${channelId}`
                    );


                const thumb =
                    item.thumbnail ||
                    (
                        videoId
                            ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                            : ""
                    );


                const title =
                    escapeHtml(
                        item.title ||
                        "YouTube 영상"
                    );


                ytList.innerHTML += `
                    <a
                        href="${href}"
                        target="_blank"
                        rel="noopener"
                        class="unified-card"
                    >
                        <div class="card-top">
                            <img
                                src="${thumb}"
                                alt="${title}"
                                loading="lazy"
                            >
                        </div>

                        <div class="card-bottom">
                            <h4>
                                ${title}
                            </h4>
                        </div>
                    </a>
                `;
            });


        try {
            localStorage.setItem(
                cacheKey,
                JSON.stringify({
                    time: Date.now(),
                    items:
                        items.slice(0, 3)
                })
            );
        } catch (e) {}
    };


    const getCache = () => {
        try {
            const c =
                JSON.parse(
                    localStorage.getItem(
                        cacheKey
                    ) || "null"
                );

            if (
                c &&
                Array.isArray(c.items) &&
                c.items.length
            ) {
                return c.items;
            }

        } catch (e) {}

        return null;
    };


    const rss2json = () =>
        fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=3`,
            {
                cache: "no-store"
            }
        )
            .then(r => {
                if (!r.ok) {
                    throw new Error(
                        "rss2json failed"
                    );
                }

                return r.json();
            })
            .then(data => {
                if (
                    data.status !== "ok" ||
                    !Array.isArray(data.items) ||
                    !data.items.length
                ) {
                    throw new Error(
                        "rss2json empty"
                    );
                }


                return data.items
                    .slice(0, 3)
                    .map(item => {
                        let videoId = "";


                        if (
                            item.link &&
                            item.link.includes("v=")
                        ) {
                            videoId =
                                item.link
                                    .split("v=")[1]
                                    .split("&")[0]
                                    .substring(0, 11);

                        } else if (
                            item.link &&
                            item.link.includes(
                                "youtu.be/"
                            )
                        ) {
                            videoId =
                                item.link
                                    .split("youtu.be/")[1]
                                    .split("?")[0]
                                    .substring(0, 11);
                        }


                        return {
                            videoId,
                            title:
                                item.title,
                            thumbnail:
                                item.thumbnail ||
                                (
                                    videoId
                                        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                                        : ""
                                ),
                            link:
                                item.link
                        };
                    });
            });


    const directRss = () =>
        fetch(
            feedUrl,
            {
                cache: "no-store"
            }
        )
            .then(r => {
                if (!r.ok) {
                    throw new Error(
                        "direct RSS failed"
                    );
                }

                return r.text();
            })
            .then(parseRss);


    const proxyRss = () =>
        fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
            {
                cache: "no-store"
            }
        )
            .then(r => {
                if (!r.ok) {
                    throw new Error(
                        "proxy RSS failed"
                    );
                }

                return r.text();
            })
            .then(parseRss);


    function parseRss(xmlText) {
        const xml =
            new DOMParser().parseFromString(
                xmlText,
                "text/xml"
            );


        if (
            xml.querySelector(
                "parsererror"
            )
        ) {
            throw new Error(
                "RSS parse failed"
            );
        }


        const entries =
            Array.from(
                xml.querySelectorAll(
                    "entry"
                )
            ).slice(0, 3);


        if (!entries.length) {
            throw new Error(
                "RSS has no entries"
            );
        }


        return entries.map(entry => {
            const videoId =
                entry.getElementsByTagNameNS(
                    "*",
                    "videoId"
                )[0]?.textContent || "";


            const title =
                entry.getElementsByTagName(
                    "title"
                )[0]?.textContent ||
                "YouTube 영상";


            const links =
                Array.from(
                    entry.querySelectorAll(
                        "link"
                    )
                );


            const linkNode =
                links.find(
                    n =>
                        n.getAttribute(
                            "rel"
                        ) === "alternate"
                ) ||
                links[0];


            return {
                videoId,
                title,
                thumbnail:
                    videoId
                        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                        : "",
                link:
                    linkNode?.getAttribute(
                        "href"
                    ) ||
                    `https://www.youtube.com/watch?v=${videoId}`
            };
        });
    }


    const cached =
        getCache();


    if (cached) {
        try {
            render(cached);
        } catch (e) {}
    }


    rss2json()
        .catch(() => directRss())
        .catch(() => proxyRss())
        .then(items => render(items))
        .catch(() => {
            if (!cached) {
                ytList.innerHTML = `
                    <div class="youtube-auto-empty">
                        최근 영상을 불러오지 못했습니다.

                        <a
                            href="https://www.youtube.com/channel/UC8QwTy46OaCGdTauiPYkeow"
                            target="_blank"
                            rel="noopener"
                        >
                            채널에서 확인하기 →
                        </a>
                    </div>
                `;
            }
        });
}


/* =========================================================
   로그인
========================================================= */

window.firebaseLogin = async () => {
    try {
        const s =
            document.getElementById(
                "school"
            ).value;

        const g =
            document.getElementById(
                "grade"
            ).value;

        const n =
            document.getElementById(
                "username"
            ).value.trim();

        const p =
            document.getElementById(
                "password"
            ).value.trim();


        const snap =
            await getDocs(
                query(
                    collection(
                        db,
                        "users"
                    ),
                    where(
                        "school",
                        "==",
                        s
                    ),
                    where(
                        "grade",
                        "==",
                        g
                    ),
                    where(
                        "name",
                        "==",
                        n
                    ),
                    where(
                        "pass",
                        "==",
                        p
                    )
                )
            );


        if (snap.empty) {
            alert("인증 실패");
            return;
        }


        currentUserId =
            snap.docs[0].id;

        currentUserData =
            snap.docs[0].data();


        sessionStorage.setItem(
            "turtlessUserId",
            currentUserId
        );


        alert(
            n + "님 인증 성공"
        );


        window.closeLoginModal();


        const welcomeMsg =
            document.getElementById(
                "welcome-msg"
            );


        if (welcomeMsg) {
            welcomeMsg.innerText =
                `${s} ${g} [${n}]`;
        }


        const memberActions =
            document.getElementById(
                "member-actions"
            );


        if (memberActions) {
            memberActions.style.display =
                "block";
        }


        const adminPanel =
            document.getElementById(
                "admin-panel"
            );


        if (
            adminPanel &&
            currentUserData?.role ===
                "admin"
        ) {
            adminPanel.style.display =
                "block";
        }


        const loginBtn =
            document.getElementById(
                "main-login-btn"
            );


        if (loginBtn) {
            loginBtn.innerText =
                "로그아웃";

            loginBtn.onclick =
                window.firebaseLogout;
        }


        const dateInput =
            document.getElementById(
                "new-gal-date"
            );


        if (dateInput) {
            dateInput.valueAsDate =
                new Date();
        }


        await loadActivities();
        await loadGallery();
        await loadMembers();

    } catch (e) {
        console.error(
            "[TURTLESS] 로그인 실패:",
            e
        );

        alert(
            "로그인 중 오류가 발생했습니다."
        );
    }
};


/* =========================================================
   로그인 상태 복구
========================================================= */

async function restoreLoginSession() {
    const savedUserId =
        sessionStorage.getItem(
            "turtlessUserId"
        );


    if (!savedUserId) return;


    try {
        const userSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    savedUserId
                )
            );


        if (!userSnap.exists()) {
            sessionStorage.removeItem(
                "turtlessUserId"
            );

            currentUserId = null;
            currentUserData = null;

            return;
        }


        currentUserId =
            savedUserId;

        currentUserData =
            userSnap.data();


        const welcomeMsg =
            document.getElementById(
                "welcome-msg"
            );


        if (welcomeMsg) {
            welcomeMsg.innerText =
                `${currentUserData.school || ""} ${currentUserData.grade || ""} [${currentUserData.name || ""}]`;
        }


        const memberActions =
            document.getElementById(
                "member-actions"
            );


        if (memberActions) {
            memberActions.style.display =
                "block";
        }


        const adminPanel =
            document.getElementById(
                "admin-panel"
            );


        if (
            adminPanel &&
            currentUserData?.role ===
                "admin"
        ) {
            adminPanel.style.display =
                "block";
        }


        const loginBtn =
            document.getElementById(
                "main-login-btn"
            );


        if (loginBtn) {
            loginBtn.innerText =
                "로그아웃";

            loginBtn.onclick =
                window.firebaseLogout;
        }


        const dateInput =
            document.getElementById(
                "new-gal-date"
            );


        if (dateInput) {
            dateInput.valueAsDate =
                new Date();
        }


        await loadActivities();
        await loadGallery();
        await loadMembers();

    } catch (error) {
        console.error(
            "[TURTLESS] 로그인 세션 복구 실패:",
            error
        );


        sessionStorage.removeItem(
            "turtlessUserId"
        );


        currentUserId = null;
        currentUserData = null;
    }
}


/* =========================================================
   로그아웃
========================================================= */

window.firebaseLogout = () => {
    if (
        !confirm(
            "로그아웃 하시겠습니까?"
        )
    ) {
        return;
    }


    sessionStorage.removeItem(
        "turtlessUserId"
    );


    currentUserId = null;
    currentUserData = null;


    const memberActions =
        document.getElementById(
            "member-actions"
        );


    if (memberActions) {
        memberActions.style.display =
            "none";
    }


    const adminPanel =
        document.getElementById(
            "admin-panel"
        );


    if (adminPanel) {
        adminPanel.style.display =
            "none";
    }


    const loginBtn =
        document.getElementById(
            "main-login-btn"
        );


    if (loginBtn) {
        loginBtn.innerText =
            "팀원 로그인";

        loginBtn.onclick =
            window.openLoginModal;
    }


    if (isEditMode) {
        window.toggleEditMode();
    }


    alert(
        "로그아웃 되었습니다."
    );


    loadActivities();
    loadGallery();
    loadMembers();
};


/* =========================================================
   페이지 편집
========================================================= */

window.toggleEditMode = () => {
    isEditMode =
        !isEditMode;


    document.body.classList.toggle(
        "edit-mode",
        isEditMode
    );


    const toolbar =
        document.getElementById(
            "edit-toolbar"
        );


    if (toolbar) {
        toolbar.classList.toggle(
            "active",
            isEditMode
        );
    }


    document
        .querySelectorAll(
            ".editable-content"
        )
        .forEach(el => {
            el.contentEditable =
                isEditMode;
        });


    const saveBtn =
        document.getElementById(
            "save-float-btn"
        );


    if (saveBtn) {
        saveBtn.style.display =
            isEditMode
                ? "block"
                : "none";
    }
};


window.savePageContent = async () => {
    try {
        const data = {};


        document
            .querySelectorAll(
                ".editable-content"
            )
            .forEach(el => {
                data[el.id] =
                    el.innerHTML;
            });


        document
            .querySelectorAll(
                ".team-color-hex"
            )
            .forEach(el => {
                data[el.id] =
                    el.value;
            });


        await setDoc(
            doc(
                db,
                "settings",
                "page_content"
            ),
            data,
            {
                merge: true
            }
        );


        alert(
            "전체 변경사항 저장 완료"
        );


        window.toggleEditMode();

    } catch (e) {
        alert(
            "저장 실패: " +
            e.message
        );
    }
};


/* =========================================================
   메인 슬라이더
========================================================= */

let slideInt = null;
let isMainSliderPaused = false;


async function loadSlider() {
    try {
        const s =
            await getDoc(
                doc(
                    db,
                    "settings",
                    "main_slider"
                )
            );


        if (
            s.exists() &&
            s.data().slides &&
            s.data().slides.length === 5
        ) {
            sliderData =
                s.data().slides;

        } else {
            sliderData =
                Array(5).fill({
                    title: "TURTLESS",
                    sub: "Future Engineering",
                    img: "#111111"
                });


            await setDoc(
                doc(
                    db,
                    "settings",
                    "main_slider"
                ),
                {
                    slides:
                        sliderData
                }
            );
        }

    } catch (e) {
        console.error(
            "[TURTLESS] 메인 슬라이더 불러오기 실패:",
            e
        );

        sliderData =
            Array(5).fill({
                title: "TURTLESS",
                sub: "",
                img: "#2c91f9"
            });
    }


    const c =
        document.getElementById(
            "slider-content"
        );

    const d =
        document.getElementById(
            "slider-dots"
        );


    if (!c || !d) return;


    let sliderHtml = "";


    let dotsHtml = `
        <button
            class="slider-control-btn"
            onclick="prevS()"
        >
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;


    sliderData.forEach((s, i) => {
        const img =
            s.img || "#111111";


        const bgStyle =
            img.startsWith("#") ||
            img.startsWith("rgb")
                ? `background-color:${img};`
                : `background-image:url('${img}');`;


        sliderHtml += `
            <div
                class="slide ${i === 0 ? "active" : ""}"
                style="${bgStyle}"
            >
                <h1>
                    ${s.title || ""}
                </h1>

                <p>
                    ${s.sub || ""}
                </p>
            </div>
        `;


        dotsHtml += `
            <div
                class="slider-dot ${i === 0 ? "active" : ""}"
                onclick="showS(${i})"
            ></div>
        `;
    });


    dotsHtml += `
        <button
            class="slider-control-btn"
            onclick="togglePauseS()"
            id="main-pause-btn"
        >
            <i class="fa-solid fa-pause"></i>
        </button>

        <button
            class="slider-control-btn"
            onclick="nextS()"
        >
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;


    c.innerHTML =
        sliderHtml;

    d.innerHTML =
        dotsHtml;


    startS();
}


window.showS = (n) => {
    const sls =
        document.querySelectorAll(
            ".slide"
        );

    const dots =
        document.querySelectorAll(
            "#slider-dots .slider-dot"
        );


    if (!sls.length) return;


    sls.forEach(
        (s, i) => {
            s.classList.toggle(
                "active",
                i === n
            );
        }
    );


    dots.forEach(
        (s, i) => {
            s.classList.toggle(
                "active",
                i === n
            );
        }
    );


    if (!isMainSliderPaused) {
        startS();
    }
};


window.nextS = () => {
    const sls =
        document.querySelectorAll(
            ".slide"
        );


    if (!sls.length) return;


    const curr =
        Array.from(sls)
            .findIndex(
                s =>
                    s.classList.contains(
                        "active"
                    )
            );


    window.showS(
        (curr + 1) %
        sls.length
    );
};


window.prevS = () => {
    const sls =
        document.querySelectorAll(
            ".slide"
        );


    if (!sls.length) return;


    const curr =
        Array.from(sls)
            .findIndex(
                s =>
                    s.classList.contains(
                        "active"
                    )
            );


    window.showS(
        (curr - 1 + sls.length) %
        sls.length
    );
};


window.togglePauseS = () => {
    isMainSliderPaused =
        !isMainSliderPaused;


    const btn =
        document.getElementById(
            "main-pause-btn"
        );


    if (btn) {
        btn.innerHTML =
            isMainSliderPaused
                ? '<i class="fa-solid fa-play"></i>'
                : '<i class="fa-solid fa-pause"></i>';
    }


    if (isMainSliderPaused) {
        clearInterval(slideInt);
    } else {
        startS();
    }
};


function startS() {
    if (slideInt) {
        clearInterval(slideInt);
    }


    slideInt =
        setInterval(
            () => {
                if (
                    !isMainSliderPaused
                ) {
                    window.nextS();
                }
            },
            5000
        );
}


window.uploadSliderImg = async (
    input,
    idx
) => {
    if (
        !input.files ||
        !input.files[0]
    ) {
        return;
    }


    try {
        alert(
            "배경 이미지를 업로드하는 중입니다..."
        );


        const formData =
            new FormData();


        formData.append(
            "upload_preset",
            "ml_default"
        );

        formData.append(
            "file",
            input.files[0]
        );


        const response =
            await fetch(
                "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (data.secure_url) {
            const targetInput =
                document.getElementById(
                    `s-img-${idx}`
                );


            if (targetInput) {
                targetInput.value =
                    data.secure_url;

                alert(
                    "배경 사진 업로드 완료! 아래 '변경사항 최종 저장' 버튼을 눌러주세요."
                );

            } else {
                alert(
                    "입력창을 찾을 수 없습니다."
                );
            }

        } else {
            alert(
                "업로드 실패: " +
                (
                    data.error
                        ? data.error.message
                        : "알 수 없는 오류"
                )
            );
        }

    } catch (e) {
        alert(
            "업로드 에러: " +
            e.message
        );
    }
};


window.openSliderEditModal = () => {
    let h = "";


    for (
        let i = 0;
        i < 5;
        i++
    ) {
        const s =
            sliderData[i] || {
                title: "",
                sub: "",
                img: "#111111"
            };


        h += `
            <div
                style="
                    background:#f5f5f5;
                    padding:15px;
                    margin-bottom:15px;
                    border-radius:10px;
                "
            >
                <strong>
                    📍 슬라이드 ${i + 1}
                </strong>


                <div
                    style="
                        margin:8px 0;
                    "
                >
                    <label
                        style="
                            font-size:11px;
                            color:#555;
                            display:block;
                            margin-bottom:4px;
                        "
                    >
                        배경
                        (헥사코드 #000000 혹은 이미지 링크 주소 입력)
                    </label>


                    <div
                        style="
                            display:flex;
                            gap:10px;
                        "
                    >
                        <input
                            id="s-img-${i}"
                            value="${s.img}"
                            placeholder="예: #2c91f9 또는 https://주소"
                            style="
                                width:100%;
                                padding:5px;
                                background:white;
                            "
                        >


                        <button
                            class="dash-btn-sm"
                            onclick="document.getElementById('s-file-${i}').click()"
                        >
                            파일 업로드
                        </button>


                        <input
                            type="file"
                            id="s-file-${i}"
                            style="display:none"
                            accept="image/*"
                            onchange="window.uploadSliderImg(this, ${i})"
                        >
                    </div>
                </div>


                <input
                    id="s-t-${i}"
                    value="${s.title}"
                    placeholder="메인 대제목"
                    style="
                        width:100%;
                        padding:5px;
                        margin-bottom:5px;
                        background:white;
                    "
                >


                <input
                    id="s-s-${i}"
                    value="${s.sub}"
                    placeholder="서브 소제목"
                    style="
                        width:100%;
                        padding:5px;
                        background:white;
                    "
                >
            </div>
        `;
    }


    document.getElementById(
        "slider-inputs-container"
    ).innerHTML = h;


    document.getElementById(
        "slider-edit-modal"
    ).style.display = "flex";
};


window.closeSliderEditModal = () => {
    document.getElementById(
        "slider-edit-modal"
    ).style.display = "none";
};


window.saveSliderData = async () => {
    try {
        const news = [];


        for (
            let i = 0;
            i < 5;
            i++
        ) {
            news.push({
                img:
                    document.getElementById(
                        `s-img-${i}`
                    ).value.trim(),

                title:
                    document.getElementById(
                        `s-t-${i}`
                    ).value.trim(),

                sub:
                    document.getElementById(
                        `s-s-${i}`
                    ).value.trim()
            });
        }


        await setDoc(
            doc(
                db,
                "settings",
                "main_slider"
            ),
            {
                slides: news
            }
        );


        alert("업데이트됨!");

        location.reload();

    } catch (e) {
        alert(
            "슬라이더 저장 실패: " +
            e.message
        );
    }
};


/* =========================================================
   후원사 슬라이더
========================================================= */

let spInt = null;
let isSpPaused = false;


async function loadSponsors() {
    try {
        const s =
            await getDoc(
                doc(
                    db,
                    "settings",
                    "sponsors"
                )
            );


        if (
            s.exists() &&
            Array.isArray(
                s.data().list
            )
        ) {
            sponsorData =
                s.data().list;

        } else {
            sponsorData = [];
        }

    } catch (e) {
        console.error(
            "[TURTLESS] 후원사 불러오기 실패:",
            e
        );

        sponsorData = [];
    }


    renderSponsorSliders();
}


/* ---------------------------------------------------------
   후원사 슬라이더 렌더링
--------------------------------------------------------- */

function renderSponsorSliders() {
    const html =
        sponsorData.length > 0
            ? buildSpHtml()
            : `
                <div
                    style="
                        padding:40px;
                        text-align:center;
                        color:#777;
                    "
                >
                    등록된 후원사가 없습니다.
                </div>
            `;


    const homeSp =
        document.getElementById(
            "home-sponsor-slider"
        );

    const pageSp =
        document.getElementById(
            "page-sponsor-slider"
        );


    if (homeSp) {
        homeSp.innerHTML =
            html;
    }


    if (pageSp) {
        pageSp.innerHTML =
            html;
    }


    if (sponsorData.length > 0) {
        document
            .querySelectorAll(
                "#home-sponsor-slider .sp-slide, #page-sponsor-slider .sp-slide"
            )
            .forEach(el => {
                el.classList.remove(
                    "active"
                );
            });


        document
            .querySelectorAll(
                "#home-sponsor-slider .sp-nav .slider-dot, #page-sponsor-slider .sp-nav .slider-dot"
            )
            .forEach(el => {
                el.classList.remove(
                    "active"
                );
            });


        showSp(0);
        startSp();
    } else {
        if (spInt) {
            clearInterval(spInt);
        }
    }
}


/* ---------------------------------------------------------
   후원사 HTML
--------------------------------------------------------- */

function buildSpHtml() {
    let slides = "";


    let dots = `
        <button
            class="slider-control-btn"
            onclick="prevSp()"
        >
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;


    sponsorData.forEach((sp, i) => {
        const logo =
            sp.logo ||
            "https://dummyimage.com/300x200/fff/000&text=LOGO";


        const desc =
            String(
                sp.desc || ""
            ).replace(
                /\n/g,
                "<br>"
            );


        slides += `
            <div
                class="sp-slide ${i === 0 ? "active" : ""}"
                data-index="${i}"
            >
                <div class="sp-left">
                    <img
                        src="${logo}"
                        alt="${sp.name || ""}"
                    >
                </div>


                <div class="sp-right">
                    <h3>
                        ${sp.name || ""}
                    </h3>

                    <p>
                        ${desc}
                    </p>
                </div>
            </div>
        `;


        dots += `
            <div
                class="slider-dot ${i === 0 ? "active" : ""}"
                onclick="showSp(${i})"
            ></div>
        `;
    });


    dots += `
        <button
            class="slider-control-btn sp-pause-btn"
            onclick="togglePauseSp()"
        >
            <i class="fa-solid fa-pause"></i>
        </button>


        <button
            class="slider-control-btn"
            onclick="nextSp()"
        >
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;


    return (
        slides +
        `<div class="sp-nav">${dots}</div>`
    );
}


/* ---------------------------------------------------------
   후원사 슬라이드 이동
--------------------------------------------------------- */

window.showSp = (n) => {
    document
        .querySelectorAll(
            "#home-sponsor-slider .sp-slide, #page-sponsor-slider .sp-slide"
        )
        .forEach(s => {
            s.classList.remove(
                "active"
            );
        });


    document
        .querySelectorAll(
            "#home-sponsor-slider .sp-nav .slider-dot, #page-sponsor-slider .sp-nav .slider-dot"
        )
        .forEach(d => {
            d.classList.remove(
                "active"
            );
        });


    document
        .querySelectorAll(
            `#home-sponsor-slider .sp-slide[data-index="${n}"], #page-sponsor-slider .sp-slide[data-index="${n}"]`
        )
        .forEach(s => {
            s.classList.add(
                "active"
            );
        });


    const dotContainers =
        document.querySelectorAll(
            "#home-sponsor-slider .sp-nav, #page-sponsor-slider .sp-nav"
        );


    dotContainers.forEach(
        container => {
            const dots =
                container.querySelectorAll(
                    ".slider-dot"
                );


            if (dots[n]) {
                dots[n].classList.add(
                    "active"
                );
            }
        }
    );


    if (!isSpPaused) {
        startSp();
    }
};


window.nextSp = () => {
    if (
        sponsorData.length === 0
    ) {
        return;
    }


    const active =
        document.querySelector(
            "#home-sponsor-slider .sp-slide.active, #page-sponsor-slider .sp-slide.active"
        );


    const curr =
        active
            ? parseInt(
                  active.getAttribute(
                      "data-index"
                  ) || "0",
                  10
              )
            : 0;


    window.showSp(
        (curr + 1) %
        sponsorData.length
    );
};


window.prevSp = () => {
    if (
        sponsorData.length === 0
    ) {
        return;
    }


    const active =
        document.querySelector(
            "#home-sponsor-slider .sp-slide.active, #page-sponsor-slider .sp-slide.active"
        );


    const curr =
        active
            ? parseInt(
                  active.getAttribute(
                      "data-index"
                  ) || "0",
                  10
              )
            : 0;


    window.showSp(
        (
            curr -
            1 +
            sponsorData.length
        ) %
        sponsorData.length
    );
};


window.togglePauseSp = () => {
    isSpPaused =
        !isSpPaused;


    document
        .querySelectorAll(
            ".sp-pause-btn"
        )
        .forEach(btn => {
            btn.innerHTML =
                isSpPaused
                    ? '<i class="fa-solid fa-play"></i>'
                    : '<i class="fa-solid fa-pause"></i>';
        });


    if (isSpPaused) {
        clearInterval(spInt);
    } else {
        startSp();
    }
};


function startSp() {
    if (spInt) {
        clearInterval(spInt);
    }


    if (
        sponsorData.length <= 1
    ) {
        return;
    }


    spInt =
        setInterval(
            () => {
                if (!isSpPaused) {
                    window.nextSp();
                }
            },
            6000
        );
}


/* =========================================================
   ★ 후원사 관리
   여기서부터 기존에 없던 실제 순서 변경 기능
========================================================= */


/* ---------------------------------------------------------
   후원사 관리창 열기
--------------------------------------------------------- */

window.openSponsorAdminModal = () => {
    let h = "";


    sponsorData.forEach(
        (sp, i) => {
            const isFirst =
                i === 0;

            const isLast =
                i ===
                sponsorData.length - 1;


            h += `
                <div
                    style="
                        background:#f9f9f9;
                        padding:10px;
                        border:1px solid #ddd;
                        margin-bottom:10px;
                        border-radius:8px;

                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                    "
                >

                    <div
                        style="
                            font-size:14px;
                            font-weight:bold;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            min-width:0;
                            flex:1;
                        "
                    >
                        <strong>
                            ${sp.name || "이름 없음"}
                        </strong>
                    </div>


                    <div
                        style="
                            display:flex;
                            gap:5px;
                            flex-shrink:0;
                        "
                    >

                        <!-- 위로 -->
                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#555;
                                padding:4px 8px;
                                ${
                                    isFirst
                                        ? "opacity:0.35; cursor:not-allowed;"
                                        : ""
                                }
                            "
                            onclick="window.moveSponsorUp(${i})"
                            ${
                                isFirst
                                    ? "disabled"
                                    : ""
                            }
                            title="위로 올리기"
                        >
                            ▲
                        </button>


                        <!-- 아래로 -->
                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#555;
                                padding:4px 8px;
                                ${
                                    isLast
                                        ? "opacity:0.35; cursor:not-allowed;"
                                        : ""
                                }
                            "
                            onclick="window.moveSponsorDown(${i})"
                            ${
                                isLast
                                    ? "disabled"
                                    : ""
                            }
                            title="아래로 내리기"
                        >
                            ▼
                        </button>


                        <!-- 삭제 -->
                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#dc3545;
                            "
                            onclick="window.deleteSponsor(${i})"
                        >
                            삭제
                        </button>

                    </div>

                </div>
            `;
        }
    );


    const list =
        document.getElementById(
            "sponsor-admin-list"
        );


    if (list) {
        list.innerHTML =
            h ||
            `
                <p
                    style="
                        font-size:12px;
                        color:#777;
                    "
                >
                    등록된 후원사가 없습니다.
                </p>
            `;
    }


    const modal =
        document.getElementById(
            "sponsor-admin-modal"
        );


    if (modal) {
        modal.style.display =
            "flex";
    }
};


/* ---------------------------------------------------------
   후원사 관리창 닫기
--------------------------------------------------------- */

window.closeSponsorAdminModal = () => {
    const modal =
        document.getElementById(
            "sponsor-admin-modal"
        );


    if (modal) {
        modal.style.display =
            "none";
    }
};


/* ---------------------------------------------------------
   ★ 후원사 순서 저장 공통 함수
--------------------------------------------------------- */

async function saveSponsorOrder() {
    await setDoc(
        doc(
            db,
            "settings",
            "sponsors"
        ),
        {
            list: sponsorData
        }
    );
}


/* ---------------------------------------------------------
   ★ 후원사 위로
--------------------------------------------------------- */

window.moveSponsorUp = async (
    index
) => {
    if (
        index <= 0 ||
        index >= sponsorData.length
    ) {
        return;
    }


    const current =
        sponsorData[index];

    const previous =
        sponsorData[index - 1];


    /* 화면상 배열 먼저 변경 */
    sponsorData[index] =
        previous;

    sponsorData[index - 1] =
        current;


    try {
        /* Firebase에 실제 순서 저장 */
        await saveSponsorOrder();


        /* 현재 슬라이드 유지가 아닌
           새 순서 기준으로 다시 렌더링 */
        renderSponsorSliders();


        /* 관리창도 새 순서로 갱신 */
        window.openSponsorAdminModal();

    } catch (e) {
        /* 저장 실패 시 원상복구 */
        sponsorData[index - 1] =
            previous;

        sponsorData[index] =
            current;


        console.error(
            "[TURTLESS] 후원사 위로 이동 실패:",
            e
        );


        alert(
            "후원사 순서 변경에 실패했습니다.\n" +
            e.message
        );
    }
};


/* ---------------------------------------------------------
   ★ 후원사 아래로
--------------------------------------------------------- */

window.moveSponsorDown = async (
    index
) => {
    if (
        index < 0 ||
        index >=
            sponsorData.length - 1
    ) {
        return;
    }


    const current =
        sponsorData[index];

    const next =
        sponsorData[index + 1];


    /* 화면상 배열 먼저 변경 */
    sponsorData[index] =
        next;

    sponsorData[index + 1] =
        current;


    try {
        /* Firebase에 실제 순서 저장 */
        await saveSponsorOrder();


        renderSponsorSliders();


        window.openSponsorAdminModal();

    } catch (e) {
        /* 저장 실패 시 원상복구 */
        sponsorData[index] =
            current;

        sponsorData[index + 1] =
            next;


        console.error(
            "[TURTLESS] 후원사 아래 이동 실패:",
            e
        );


        alert(
            "후원사 순서 변경에 실패했습니다.\n" +
            e.message
        );
    }
};


/* ---------------------------------------------------------
   후원사 추가
--------------------------------------------------------- */

window.addSponsor = async () => {
    const name =
        document.getElementById(
            "sp-new-name"
        ).value.trim();


    const desc =
        document.getElementById(
            "sp-new-desc"
        ).value.trim();


    const fileInput =
        document.getElementById(
            "sp-new-logo"
        );


    if (!name) {
        alert(
            "이름을 입력하세요."
        );

        return;
    }


    let logoUrl = "";


    if (
        fileInput.files &&
        fileInput.files[0]
    ) {
        try {
            alert(
                "로고 업로드 중..."
            );


            const formData =
                new FormData();


            formData.append(
                "upload_preset",
                "ml_default"
            );


            formData.append(
                "file",
                fileInput.files[0]
            );


            const response =
                await fetch(
                    "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (data.secure_url) {
                logoUrl =
                    data.secure_url;
            } else {
                alert(
                    "업로드 실패: " +
                    (
                        data.error
                            ? data.error.message
                            : "알 수 없는 오류"
                    )
                );

                return;
            }

        } catch (e) {
            alert(
                "로고 업로드 오류: " +
                e.message
            );

            return;
        }
    }


    try {
        /* 새 후원사는 가장 마지막에 추가 */
        sponsorData.push({
            name,
            desc,
            logo: logoUrl
        });


        await saveSponsorOrder();


        alert(
            "후원사 추가 완료!"
        );


        document.getElementById(
            "sp-new-name"
        ).value = "";

        document.getElementById(
            "sp-new-desc"
        ).value = "";

        fileInput.value = "";


        renderSponsorSliders();


        window.openSponsorAdminModal();

    } catch (e) {
        console.error(
            "[TURTLESS] 후원사 추가 실패:",
            e
        );

        alert(
            "후원사 추가 실패: " +
            e.message
        );
    }
};


/* ---------------------------------------------------------
   후원사 삭제
--------------------------------------------------------- */

window.deleteSponsor = async (
    index
) => {
    if (
        index < 0 ||
        index >= sponsorData.length
    ) {
        return;
    }


    const target =
        sponsorData[index];


    if (
        !confirm(
            `"${target.name || "이 후원사"}"를 삭제하시겠습니까?`
        )
    ) {
        return;
    }


    const backup =
        sponsorData[index];


    sponsorData.splice(
        index,
        1
    );


    try {
        await saveSponsorOrder();


        renderSponsorSliders();


        window.openSponsorAdminModal();

    } catch (e) {
        /* 저장 실패하면 삭제 취소 */
        sponsorData.splice(
            index,
            0,
            backup
        );


        console.error(
            "[TURTLESS] 후원사 삭제 실패:",
            e
        );


        alert(
            "후원사 삭제 실패: " +
            e.message
        );
    }
};


/* =========================================================
   경력 관리
========================================================= */

window.cachedCareers = [];
window.editingCareerId = null;


/* ---------------------------------------------------------
   경력 관리창
--------------------------------------------------------- */

window.openCareerAdminModal = async () => {
    const modal =
        document.getElementById(
            "career-admin-modal"
        );


    if (modal) {
        modal.style.display =
            "flex";
    }


    window.renderCareerAdminList();
};


window.closeCareerAdminModal = () => {
    const modal =
        document.getElementById(
            "career-admin-modal"
        );


    if (modal) {
        modal.style.display =
            "none";
    }


    window.cancelEditCareer();
};


/* ---------------------------------------------------------
   경력 관리 목록
--------------------------------------------------------- */

window.renderCareerAdminList = () => {
    let html = "";


    window.cachedCareers.forEach(
        (c, index) => {
            const isFirst =
                index === 0;

            const isLast =
                index ===
                window.cachedCareers.length -
                    1;


            html += `
                <div
                    style="
                        background:#f9f9f9;
                        padding:10px;
                        border:1px solid #ddd;
                        margin-bottom:10px;
                        border-radius:8px;

                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                    "
                >

                    <div
                        style="
                            font-size:14px;
                            font-weight:bold;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            max-width:50%;
                        "
                    >
                        <span
                            style="
                                color:#005a9c;
                                margin-right:5px;
                            "
                        >
                            [${c.period || "기간없음"}]
                        </span>

                        ${c.title || ""}
                    </div>


                    <div
                        style="
                            display:flex;
                            gap:5px;
                            flex-shrink:0;
                        "
                    >

                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#555;
                                padding:4px 8px;
                                ${
                                    isFirst
                                        ? "opacity:0.35;cursor:not-allowed;"
                                        : ""
                                }
                            "
                            onclick="window.moveCareerUp(${index})"
                            ${
                                isFirst
                                    ? "disabled"
                                    : ""
                            }
                            title="위로 올리기"
                        >
                            ▲
                        </button>


                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#555;
                                padding:4px 8px;
                                ${
                                    isLast
                                        ? "opacity:0.35;cursor:not-allowed;"
                                        : ""
                                }
                            "
                            onclick="window.moveCareerDown(${index})"
                            ${
                                isLast
                                    ? "disabled"
                                    : ""
                            }
                            title="아래로 내리기"
                        >
                            ▼
                        </button>


                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#007bff;
                            "
                            onclick="window.editCareer('${c.id}')"
                        >
                            수정
                        </button>


                        <button
                            type="button"
                            class="dash-btn-sm"
                            style="
                                background:#dc3545;
                            "
                            onclick="window.deleteCareer('${c.id}')"
                        >
                            삭제
                        </button>

                    </div>

                </div>
            `;
        }
    );


    const list =
        document.getElementById(
            "career-admin-list"
        );


    if (list) {
        list.innerHTML =
            html ||
            `
                <p
                    style="
                        font-size:12px;
                        color:#777;
                    "
                >
                    등록된 경력이 없습니다.
                </p>
            `;
    }
};


/* ---------------------------------------------------------
   경력 불러오기
--------------------------------------------------------- */

window.loadCareers = async () => {
    const container =
        document.getElementById(
            "career-container"
        );


    if (!container) return;


    try {
        const querySnapshot =
            await getDocs(
                collection(
                    db,
                    "careers"
                )
            );


        window.cachedCareers =
            [];


        querySnapshot.forEach(
            docSnap => {
                window.cachedCareers.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            }
        );


        window.cachedCareers.sort(
            (a, b) =>
                (b.createdAt || 0) -
                (a.createdAt || 0)
        );


        if (
            window.cachedCareers
                .length === 0
        ) {
            container.innerHTML = `
                <div
                    style="
                        text-align:center;
                        padding:40px;
                        color:#777;
                    "
                >
                    등록된 경력 사항이 없습니다.
                </div>
            `;

            return;
        }


        let html = "";


        window.cachedCareers.forEach(
            (c, index) => {
                const layoutClass =
                    index % 2 === 0
                        ? "normal"
                        : "reverse";


                const imgUrl =
                    c.imageUrl ||
                    "https://dummyimage.com/600x400/f0f0f0/999999&text=No+Image";


                html += `
                    <div
                        class="career-row ${layoutClass}"
                    >

                        <div
                            class="career-dot"
                        ></div>


                        <div
                            class="career-col-text"
                        >
                            <div
                                class="career-year"
                            >
                                ${c.period || ""}
                            </div>


                            <div
                                class="career-details"
                            >
                                <h3>
                                    ${c.title || "제목 없음"}
                                </h3>

                                <p>
                                    ${
                                        (
                                            c.desc ||
                                            ""
                                        ).replace(
                                            /\n/g,
                                            "<br>"
                                        )
                                    }
                                </p>
                            </div>
                        </div>


                        <div
                            class="career-col-img"
                        >
                            <div
                                class="career-img-box"
                            >
                                <img
                                    src="${imgUrl}"
                                    alt="경력 증빙 사진"
                                >
                            </div>
                        </div>

                    </div>
                `;
            }
        );


        container.innerHTML =
            html;


        const careerModal =
            document.getElementById(
                "career-admin-modal"
            );


        if (
            careerModal &&
            careerModal.style.display ===
                "flex"
        ) {
            window.renderCareerAdminList();
        }

    } catch (error) {
        console.error(
            "[TURTLESS] 경력 불러오기 실패:",
            error
        );
    }
};


/* ---------------------------------------------------------
   경력 추가 / 수정
--------------------------------------------------------- */

window.addOrUpdateCareer = async () => {
    const period =
        document.getElementById(
            "c-new-period"
        ).value.trim();


    const title =
        document.getElementById(
            "c-new-title"
        ).value.trim();


    const desc =
        document.getElementById(
            "c-new-desc"
        ).value.trim();


    const fileInput =
        document.getElementById(
            "c-new-img"
        );


    if (!title || !desc) {
        alert(
            "제목과 내용을 모두 입력하세요."
        );

        return;
    }


    let imageUrl = null;


    if (
        fileInput.files &&
        fileInput.files[0]
    ) {
        try {
            alert(
                "사진 업로드 중..."
            );


            const formData =
                new FormData();


            formData.append(
                "upload_preset",
                "ml_default"
            );

            formData.append(
                "file",
                fileInput.files[0]
            );


            const response =
                await fetch(
                    "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (data.secure_url) {
                imageUrl =
                    data.secure_url;
            } else {
                alert(
                    "업로드 실패: " +
                    (
                        data.error
                            ? data.error.message
                            : "알 수 없는 오류"
                    )
                );

                return;
            }

        } catch (e) {
            alert(
                "사진 업로드 오류: " +
                e.message
            );

            return;
        }
    }


    try {
        if (
            window.editingCareerId
        ) {
            const updateData = {
                period,
                title,
                desc
            };


            if (imageUrl) {
                updateData.imageUrl =
                    imageUrl;
            }


            await updateDoc(
                doc(
                    db,
                    "careers",
                    window.editingCareerId
                ),
                updateData
            );


            alert(
                "수정 완료되었습니다."
            );


            window.cancelEditCareer();

        } else {
            await addDoc(
                collection(
                    db,
                    "careers"
                ),
                {
                    period,
                    title,
                    desc,
                    imageUrl:
                        imageUrl || "",
                    createdAt:
                        Date.now()
                }
            );


            alert(
                "새 경력이 추가되었습니다!"
            );


            document.getElementById(
                "c-new-period"
            ).value = "";

            document.getElementById(
                "c-new-title"
            ).value = "";

            document.getElementById(
                "c-new-desc"
            ).value = "";

            fileInput.value = "";
        }


        await window.loadCareers();

    } catch (e) {
        alert(
            "오류 발생: " +
            e.message
        );
    }
};


/* ---------------------------------------------------------
   경력 수정 모드
--------------------------------------------------------- */

window.editCareer = (id) => {
    const c =
        window.cachedCareers.find(
            x => x.id === id
        );


    if (!c) return;


    window.editingCareerId =
        id;


    document.getElementById(
        "c-form-title"
    ).innerText =
        "✏️ 경력 수정 모드";


    document.getElementById(
        "c-new-period"
    ).value =
        c.period || "";


    document.getElementById(
        "c-new-title"
    ).value =
        c.title || "";


    document.getElementById(
        "c-new-desc"
    ).value =
        c.desc || "";


    document.getElementById(
        "c-submit-btn"
    ).innerText =
        "수정 내용 저장";


    document.getElementById(
        "c-cancel-btn"
    ).style.display =
        "block";
};


/* ---------------------------------------------------------
   경력 수정 취소
--------------------------------------------------------- */

window.cancelEditCareer = () => {
    window.editingCareerId =
        null;


    const title =
        document.getElementById(
            "c-form-title"
        );

    if (title) {
        title.innerText =
            "새 경력 추가";
    }


    const period =
        document.getElementById(
            "c-new-period"
        );

    if (period) {
        period.value = "";
    }


    const newTitle =
        document.getElementById(
            "c-new-title"
        );

    if (newTitle) {
        newTitle.value = "";
    }


    const desc =
        document.getElementById(
            "c-new-desc"
        );

    if (desc) {
        desc.value = "";
    }


    const img =
        document.getElementById(
            "c-new-img"
        );

    if (img) {
        img.value = "";
    }


    const submit =
        document.getElementById(
            "c-submit-btn"
        );

    if (submit) {
        submit.innerText =
            "경력 등록하기";
    }


    const cancel =
        document.getElementById(
            "c-cancel-btn"
        );

    if (cancel) {
        cancel.style.display =
            "none";
    }
};


/* ---------------------------------------------------------
   경력 위로
--------------------------------------------------------- */

window.moveCareerUp = async (
    index
) => {
    if (index <= 0) return;


    const current =
        window.cachedCareers[
            index
        ];

    const prev =
        window.cachedCareers[
            index - 1
        ];


    if (!current || !prev) {
        return;
    }


    try {
        const tempTime =
            current.createdAt;


        await updateDoc(
            doc(
                db,
                "careers",
                current.id
            ),
            {
                createdAt:
                    prev.createdAt
            }
        );


        await updateDoc(
            doc(
                db,
                "careers",
                prev.id
            ),
            {
                createdAt:
                    tempTime
            }
        );


        await window.loadCareers();

    } catch (e) {
        alert(
            "경력 순서 변경 실패: " +
            e.message
        );
    }
};


/* ---------------------------------------------------------
   경력 아래로
--------------------------------------------------------- */

window.moveCareerDown = async (
    index
) => {
    if (
        index <
            0 ||
        index >=
            window.cachedCareers.length -
                1
    ) {
        return;
    }


    const current =
        window.cachedCareers[
            index
        ];

    const next =
        window.cachedCareers[
            index + 1
        ];


    if (!current || !next) {
        return;
    }


    try {
        const tempTime =
            current.createdAt;


        await updateDoc(
            doc(
                db,
                "careers",
                current.id
            ),
            {
                createdAt:
                    next.createdAt
            }
        );


        await updateDoc(
            doc(
                db,
                "careers",
                next.id
            ),
            {
                createdAt:
                    tempTime
            }
        );


        await window.loadCareers();

    } catch (e) {
        alert(
            "경력 순서 변경 실패: " +
            e.message
        );
    }
};


/* ---------------------------------------------------------
   경력 삭제
--------------------------------------------------------- */

window.deleteCareer = async (
    id
) => {
    if (
        !confirm(
            "이 경력을 정말 삭제하시겠습니까?"
        )
    ) {
        return;
    }


    try {
        await deleteDoc(
            doc(
                db,
                "careers",
                id
            )
        );


        alert(
            "삭제되었습니다."
        );


        await window.loadCareers();

    } catch (e) {
        alert(
            "삭제 실패: " +
            e.message
        );
    }
};


/* =========================================================
   기타 네비게이션
========================================================= */

window.toggleDrop = (
    id
) => {
    document
        .querySelectorAll(
            ".dropdown-content"
        )
        .forEach(d => {
            if (d.id !== id) {
                d.classList.remove(
                    "show"
                );
            }
        });


    const target =
        document.getElementById(
            id
        );


    if (target) {
        target.classList.toggle(
            "show"
        );
    }
};


window.openLoginModal = () => {
    const modal =
        document.getElementById(
            "login-modal"
        );

    if (modal) {
        modal.style.display =
            "flex";
    }
};


window.closeLoginModal = () => {
    const modal =
        document.getElementById(
            "login-modal"
        );

    if (modal) {
        modal.style.display =
            "none";
    }
};


/* =========================================================
   DOMContentLoaded
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* 로그인 상태 먼저 복구 */
        await restoreLoginSession();


        /* 메인 데이터 로드 */
        await loadSlider();


        await Promise.allSettled([
            loadMembers(),
            loadActivities(),
            loadGallery(),
            loadSponsors(),
            window.loadCareers()
        ]);


        /* 페이지 콘텐츠 */
        try {
            const s =
                await getDoc(
                    doc(
                        db,
                        "settings",
                        "page_content"
                    )
                );


            if (s.exists()) {
                const d =
                    s.data();


                document
                    .querySelectorAll(
                        ".editable-content"
                    )
                    .forEach(el => {
                        if (
                            d[el.id]
                        ) {
                            el.innerHTML =
                                d[el.id];
                        }
                    });


                document
                    .querySelectorAll(
                        ".team-color-hex"
                    )
                    .forEach(el => {
                        if (
                            d[el.id]
                        ) {
                            el.value =
                                d[el.id];


                            if (
                                typeof window.updateTeamColor ===
                                "function"
                            ) {
                                window.updateTeamColor(
                                    Number(
                                        el.id.replace(
                                            "team-color-hex-",
                                            ""
                                        )
                                    )
                                );
                            }
                        }
                    });
            }

        } catch (e) {
            console.error(
                "[TURTLESS] 페이지 콘텐츠 불러오기 실패:",
                e
            );
        }
    }
);
