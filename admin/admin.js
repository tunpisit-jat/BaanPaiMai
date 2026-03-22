// ==========================================
// 1. ระบบ Login Admin (Firebase Auth)
// ==========================================
const loginOverlay = document.getElementById("login-overlay");
const adminEmailInput = document.getElementById("admin-email");
const adminPasswordInput = document.getElementById("admin-password");
const btnLogin = document.getElementById("btn-login");
const loginError = document.getElementById("login-error");
const btnLogout = document.getElementById("btn-logout");
const adminUserEmailDisplay = document.getElementById("admin-user-email");

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    if (loginOverlay) loginOverlay.classList.add("hidden");
    console.log("ยินดีต้อนรับ Admin:", user.email);
    if (adminUserEmailDisplay) {
      adminUserEmailDisplay.innerText = "Staff: " + user.email;
    }
    startAdminSystem();
  } else {
    if (loginOverlay) loginOverlay.classList.remove("hidden");
  }
});

if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    const email = adminEmailInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (!email || !password) {
      loginError.innerText = "❌ กรุณากรอกอีเมลและรหัสผ่าน";
      loginError.classList.remove("hidden");
      return;
    }

    btnLogin.innerText = "กำลังเข้าสู่ระบบ...";
    btnLogin.disabled = true;

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        loginError.classList.add("hidden");
        adminEmailInput.value = "";
        adminPasswordInput.value = "";
        btnLogin.innerText = "Sign In to Dashboard";
        btnLogin.disabled = false;
      })
      .catch(() => {
        loginError.innerText = "❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!";
        loginError.classList.remove("hidden");
        btnLogin.innerText = "Sign In to Dashboard";
        btnLogin.disabled = false;
      });
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      firebase
        .auth()
        .signOut()
        .then(() => {
          adminEmailInput.value = "";
          adminPasswordInput.value = "";
          alert("ออกจากระบบเรียบร้อยครับ");
        });
    }
  });
}

// ==========================================
// 2. ระบบหลังบ้าน (เริ่มทำงานเมื่อ Login แล้วเท่านั้น)
// ==========================================
function startAdminSystem() {
  const filterDateInput = document.getElementById("filter-date");
  const countTotal = document.getElementById("count-total");
  const countPending = document.getElementById("count-pending");
  const countConfirmed = document.getElementById("count-confirmed");
  const emergencyToggle = document.getElementById("emergency-toggle");
  const toggleBg = document.getElementById("toggle-bg");
  const toggleDot = document.getElementById("toggle-dot");
  const emergencyText = document.getElementById("emergency-text");
  const slotControls = document.getElementById("slot-controls");
  const jeepQuotaSelect = document.getElementById("jeep-quota-select");
  const btnUpdateQuota = document.getElementById("btn-update-quota");
  const container = document.getElementById("booking-list-container");

  const ALL_SLOTS = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  let allBookings = [];
  let currentMaxJeeps = 3;

  // Timezone Fix
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000,
  );
  const todayStr = localDate.toISOString().split("T")[0];
  if (filterDateInput && !filterDateInput.value) {
    filterDateInput.value = todayStr;
  }

  // ==========================================
  // ระบบสลับ Tab (Overview / Settings)
  // ==========================================
  const navOverview = document.getElementById("nav-overview");
  const navSettings = document.getElementById("nav-settings");
  const tabOverview = document.getElementById("tab-overview");
  const tabSettings = document.getElementById("tab-settings");

  if (navOverview && navSettings && tabOverview && tabSettings) {
    navOverview.addEventListener("click", () => {
      tabOverview.classList.remove("hidden");
      tabSettings.classList.add("hidden");
      navOverview.classList.add("bg-[#8ba37a]/10", "text-[#8ba37a]");
      navOverview.classList.remove("text-stone-500", "hover:bg-stone-50");
      navSettings.classList.add("text-stone-500", "hover:bg-stone-50");
      navSettings.classList.remove("bg-[#8ba37a]/10", "text-[#8ba37a]");
    });

    navSettings.addEventListener("click", () => {
      tabSettings.classList.remove("hidden");
      tabOverview.classList.add("hidden");
      navSettings.classList.add("bg-[#8ba37a]/10", "text-[#8ba37a]");
      navSettings.classList.remove("text-stone-500", "hover:bg-stone-50");
      navOverview.classList.add("text-stone-500", "hover:bg-stone-50");
      navOverview.classList.remove("bg-[#8ba37a]/10", "text-[#8ba37a]");
    });
  }

  // ==========================================
  // ระบบ SYSTEM CONTROLS
  // ==========================================
  function loadSystemSettings() {
    if (!emergencyToggle) return;

    db.collection("settings")
      .doc("system")
      .onSnapshot((doc) => {
        let emergencyClose = false;
        let blockedSlots = [];

        if (doc.exists) {
          const data = doc.data();
          emergencyClose = data.emergencyClose || false;
          blockedSlots = data.blockedSlots || [];
          currentMaxJeeps = data.maxJeeps !== undefined ? data.maxJeeps : 3;

          const advanceDaysInput =
            document.getElementById("advance-days-input");
          if (advanceDaysInput) {
            advanceDaysInput.value =
              data.advanceDays !== undefined ? data.advanceDays : 1;
          }

          const headerQuota = document.getElementById("header-quota-display");
          const headerAdvance = document.getElementById(
            "header-advance-display",
          );
          if (headerQuota) headerQuota.innerText = currentMaxJeeps;
          if (headerAdvance)
            headerAdvance.innerText =
              data.advanceDays !== undefined ? data.advanceDays : 1;
        }

        if (jeepQuotaSelect) jeepQuotaSelect.value = currentMaxJeeps;

        emergencyToggle.checked = emergencyClose;
        if (emergencyClose) {
          toggleBg.classList.replace("bg-stone-200", "bg-red-500");
          toggleDot.classList.add("translate-x-6");
          emergencyText.innerText = "🚨 ระบบปิดรับจอง! ลูกค้ากดจองไม่ได้";
          emergencyText.classList.replace("text-stone-500", "text-red-600");
        } else {
          toggleBg.classList.replace("bg-red-500", "bg-stone-200");
          toggleDot.classList.remove("translate-x-6");
          emergencyText.innerText = "✅ ระบบทำงานปกติ เปิดรับจองอยู่";
          emergencyText.classList.replace("text-red-600", "text-stone-500");
        }

        if (slotControls) {
          slotControls.innerHTML = "";
          ALL_SLOTS.forEach((slot) => {
            const isBlocked = blockedSlots.includes(slot);
            const btnClass = isBlocked
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-white text-stone-600 border-stone-200";
            slotControls.innerHTML += `<button 
              data-slot="${slot}" 
              data-blocked="${isBlocked}" 
              class="btn-toggle-slot px-4 py-2 text-xs font-bold border rounded-lg transition-all ${btnClass}">
              ${slot}
            </button>`;
          });
        }

        renderCards();
      });
  }

  if (emergencyToggle) {
    emergencyToggle.onclick = async () => {
      const isClosed = emergencyToggle.checked;
      await db
        .collection("settings")
        .doc("system")
        .update({ emergencyClose: isClosed });
    };
  }

  if (slotControls) {
    slotControls.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-toggle-slot");
      if (!btn) return;

      const slot = btn.dataset.slot;
      const currentlyBlocked = btn.dataset.blocked === "true";
      const docRef = db.collection("settings").doc("system");

      btn.disabled = true;

      try {
        if (currentlyBlocked) {
          await docRef.update({
            blockedSlots: firebase.firestore.FieldValue.arrayRemove(slot),
          });
        } else {
          await docRef.update({
            blockedSlots: firebase.firestore.FieldValue.arrayUnion(slot),
          });
        }
      } catch (err) {
        console.error(err);
        btn.disabled = false;
      }
    });
  }

  if (btnUpdateQuota && jeepQuotaSelect) {
    btnUpdateQuota.addEventListener("click", async () => {
      const newQuota = parseInt(jeepQuotaSelect.value);
      btnUpdateQuota.innerText = "กำลังบันทึก...";
      btnUpdateQuota.disabled = true;
      try {
        await db
          .collection("settings")
          .doc("system")
          .set({ maxJeeps: newQuota }, { merge: true });
        alert(`✅ อัปเดตโควตารถเป็น ${newQuota} คัน เรียบร้อยแล้ว!`);
      } catch (error) {
        console.error(error);
        alert("❌ เกิดข้อผิดพลาด");
      } finally {
        btnUpdateQuota.innerText = "อัปเดต";
        btnUpdateQuota.disabled = false;
      }
    });
  }

  const advanceDaysInput = document.getElementById("advance-days-input");
  const btnUpdateAdvanceDays = document.getElementById(
    "btn-update-advance-days",
  );

  if (btnUpdateAdvanceDays && advanceDaysInput) {
    btnUpdateAdvanceDays.addEventListener("click", async () => {
      const newDays = parseInt(advanceDaysInput.value);
      if (isNaN(newDays) || newDays < 1 || newDays > 60) {
        alert("❌ กรุณากรอกตัวเลข 1-60 วันครับ");
        return;
      }
      btnUpdateAdvanceDays.innerText = "กำลังบันทึก...";
      btnUpdateAdvanceDays.disabled = true;
      try {
        await db
          .collection("settings")
          .doc("system")
          .set({ advanceDays: newDays }, { merge: true });
        alert(`✅ ตั้งค่าจองล่วงหน้าได้ ${newDays} วัน เรียบร้อยแล้ว!`);
      } catch (error) {
        console.error(error);
        alert("❌ เกิดข้อผิดพลาด");
      } finally {
        btnUpdateAdvanceDays.innerText = "บันทึก";
        btnUpdateAdvanceDays.disabled = false;
      }
    });
  }

  // ==========================================
  // ระบบ BOOKING LIST (เวอร์ชันการ์ด)
  // ==========================================
  function loadBookings() {
    db.collection("bookings")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        allBookings = [];
        snapshot.forEach((doc) => {
          allBookings.push({ id: doc.id, ...doc.data() });
        });
        renderCards();
      });
  }

  function renderCards() {
    if (!container) return;

    let total = 0,
      pending = 0,
      confirmed = 0;
    const selectedDate = filterDateInput.value;
    const filteredBookings = allBookings.filter((b) => b.date === selectedDate);

    filteredBookings.forEach((data) => {
      total++;
      if (data.status === "PENDING") pending++;
      if (data.status === "CONFIRMED") confirmed++;
    });

    if (countTotal) countTotal.innerText = total;
    if (countPending) countPending.innerText = pending;
    if (countConfirmed) countConfirmed.innerText = confirmed;

    if (filteredBookings.length === 0) {
      container.innerHTML = `<div class="col-span-full py-16 flex flex-col items-center justify-center text-stone-400 bg-white rounded-2xl border border-dashed border-stone-300 shadow-sm">
        <svg class="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">ไม่มีข้อมูลการจองในวันที่เลือกครับ</span>
      </div>`;
      return;
    }

    let htmlContent = "";

    ALL_SLOTS.forEach((slotTime) => {
      const slotBookings = filteredBookings.filter(
        (b) => b.timeSlot === slotTime,
      );
      const activeBookings = slotBookings.filter(
        (b) => b.status === "PENDING" || b.status === "CONFIRMED",
      );
      const hasAnyBookings = slotBookings.length > 0;
      const currentCount = activeBookings.length;

      let headerBg = "bg-stone-100 text-stone-500 border-b border-stone-200";
      let badgeStyle = "bg-white text-stone-500 border border-stone-200";

      if (currentCount >= currentMaxJeeps) {
        headerBg = "bg-[#cba472] text-white shadow-sm";
        badgeStyle = "bg-red-500 text-white shadow-inner";
      } else if (currentCount > 0) {
        headerBg = "bg-[#8ba37a] text-white shadow-sm";
        badgeStyle = "bg-black/20 text-white";
      }

      htmlContent += `
        <div class="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full transition-all hover:shadow-md">
            <div class="px-5 py-3.5 ${headerBg} flex justify-between items-center transition-colors">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="font-bold text-xl font-serif tracking-wider">${slotTime}</span>
                </div>
                <span class="text-xs px-2.5 py-1 ${badgeStyle} rounded-md font-bold tracking-widest">
                    ${currentCount} / ${currentMaxJeeps} คัน
                </span>
            </div>
            <div class="p-3.5 flex-1 flex flex-col gap-3 bg-stone-50/50">`;

      if (!hasAnyBookings) {
        htmlContent += `
            <div class="flex flex-col items-center justify-center h-full text-stone-300 py-8 opacity-70">
                <span class="text-sm font-medium tracking-wide">ยังไม่มีคิวจอง</span>
            </div>`;
      } else {
        slotBookings.forEach((data) => {
          const isCancelled = data.status === "CANCELLED";
          const cardOpacity = isCancelled ? "opacity-60 grayscale-[50%]" : "";

          let statusBadge =
            data.status === "PENDING"
              ? `<span class="bg-yellow-50 text-yellow-600 border border-yellow-200 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">รอยืนยัน</span>`
              : data.status === "CONFIRMED"
                ? `<span class="bg-green-50 text-green-600 border border-green-200 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">ยืนยันแล้ว</span>`
                : `<span class="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">ยกเลิกแล้ว</span>`;

          htmlContent += `
                <div class="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col gap-3 relative transition-all hover:border-[#8ba37a]/50 ${cardOpacity}">
                    <div class="flex justify-between items-start gap-2">
                        <div class="flex-1">
                            <p class="font-bold text-base text-stone-800 leading-none mb-2">${data.name}</p>
                            <p class="text-[10px] text-stone-500 mb-2 leading-none">Date: ${data.date}</p>
                            <span class="inline-block bg-stone-100 text-stone-500 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-mono border border-stone-200">
                                Ref: ${data.bookingCode}
                            </span>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100 mt-1">
                        <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <span class="font-medium tracking-wide">${data.phone}</span>
                    </div>
                    ${
                      !isCancelled
                        ? `
                    <div class="flex gap-2 w-full pt-1">
                        ${
                          data.status === "PENDING"
                            ? `
                            <button data-id="${data.id}" data-status="CONFIRMED" class="btn-update-status flex-1 bg-[#8ba37a] text-white py-2 rounded-lg text-[11px] font-bold tracking-wider shadow-sm hover:bg-[#6a805b] active:scale-95 transition">
                                รับคิว (CONFIRM)
                            </button>`
                            : ""
                        }
                        <button data-id="${data.id}" data-status="CANCELLED" class="btn-update-status flex-1 bg-white border border-red-200 text-red-500 py-2 rounded-lg text-[11px] font-bold tracking-wider hover:bg-red-50 active:scale-95 transition">
                            ยกเลิก
                        </button>
                    </div>`
                        : ""
                    }
                </div>`;
        });
      }

      htmlContent += `</div></div>`;
    });

    container.innerHTML = htmlContent;
  }

  if (container) {
    container.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-update-status");
      if (!btn) return;

      const docId = btn.dataset.id;
      const newStatus = btn.dataset.status;

      if (confirm("ยืนยันการเปลี่ยนสถานะ?")) {
        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = "อัปเดต...";

        try {
          await db
            .collection("bookings")
            .doc(docId)
            .update({ status: newStatus });
        } catch (err) {
          console.error(err);
          btn.disabled = false;
          btn.innerText = originalText;
          alert("เกิดข้อผิดพลาด");
        }
      }
    });
  }

  if (filterDateInput) {
    filterDateInput.addEventListener("change", renderCards);
  }

  loadSystemSettings();
  loadBookings();
}
