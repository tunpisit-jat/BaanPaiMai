document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. ระบบจัดการ Pop-up (Success & Search)
  // ==========================================
  const successModal = document.getElementById("successModal");
  const closeSuccessModal = document.getElementById("close-success-modal");
  const btnDoneSuccess = document.getElementById("btn-done-success");

  const closeSuccess = () => {
    if (successModal) successModal.classList.add("hidden");
  };
  if (closeSuccessModal)
    closeSuccessModal.addEventListener("click", closeSuccess);
  if (btnDoneSuccess) btnDoneSuccess.addEventListener("click", closeSuccess);

  const searchModal = document.getElementById("searchModal");
  const closeSearchModal = document.getElementById("close-search-modal");
  const btnsMyBooking = document.querySelectorAll("#btn-my-booking");

  if (btnsMyBooking.length > 0 && searchModal) {
    btnsMyBooking.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        searchModal.classList.remove("hidden");
      });
    });
  }
  if (closeSearchModal && searchModal) {
    closeSearchModal.addEventListener("click", () =>
      searchModal.classList.add("hidden"),
    );
  }

  // ==========================================
  // 2. ตั้งค่าระบบ และ ตัวแปรหลัก
  // ==========================================
  const timeSlots = document.querySelectorAll(".time-slot");
  const btnConfirm = document.getElementById("btn-confirm-booking");
  const inputName = document.getElementById("guest-name");
  const inputPhone = document.getElementById("guest-phone");
  const displayCode = document.getElementById("generated-code");

  let selectedTime = "";
  let isSystemClosed = false;
  // จำนวนชั่วโมงที่ต้องจองล่วงหน้าก่อนรอบเริ่ม
  const ADVANCE_BOOKING_HOURS = 1;

  let unsubBookings = null;
  let unsubSettings = null;

  // ตัวแปรเก็บค่าจาก Firebase Settings
  let currentMaxJeeps = 3;
  let currentAdvanceDays = 1;

  const getFormattedDate = (dateObj) => {
    return dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD
  };

  const todayStr = getFormattedDate(new Date());
  let selectedDate = todayStr;

  // ==========================================
  // 3. ระบบเช็กโควตา (Real-time Snapshot)
  // ==========================================
  const checkSlotAvailability = () => {
    const isTimePassed = (timeText) => {
      if (selectedDate !== todayStr) return false;
      const now = new Date();
      const [hours, minutes] = timeText.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);
      const cutoffTime = new Date(
        now.getTime() + ADVANCE_BOOKING_HOURS * 60 * 60 * 1000,
      );
      return cutoffTime > slotTime;
    };

    if (unsubBookings) unsubBookings();
    if (unsubSettings) unsubSettings();

    unsubSettings = db
      .collection("settings")
      .doc("system")
      .onSnapshot((settingsDoc) => {
        const settingsData = settingsDoc.exists ? settingsDoc.data() : {};
        isSystemClosed = settingsData.emergencyClose || false;
        const blockedSlots = settingsData.blockedSlots || [];

        currentMaxJeeps =
          settingsData.maxJeeps !== undefined ? settingsData.maxJeeps : 3;

        currentAdvanceDays =
          settingsData.advanceDays !== undefined ? settingsData.advanceDays : 1;

        // Re-render ปฏิทินทุกครั้งที่ settings เปลี่ยน พร้อม highlight วันที่เลือกไว้
        renderCalendar();

        if (unsubBookings) unsubBookings();

        unsubBookings = db
          .collection("bookings")
          .where("date", "==", selectedDate)
          .where("status", "in", ["PENDING", "CONFIRMED"])
          .onSnapshot((bookingSnapshot) => {
            const slotCounts = {};
            bookingSnapshot.forEach((doc) => {
              const time = doc.data().timeSlot;
              slotCounts[time] = (slotCounts[time] || 0) + 1;
            });

            timeSlots.forEach((slot) => {
              const timeText = slot.getAttribute("data-time");
              const currentCount = slotCounts[timeText] || 0;
              const timeAlreadyPassed = isTimePassed(timeText);

              slot.classList.remove(
                "opacity-50",
                "pointer-events-none",
                "bg-stone-200",
              );

              if (
                isSystemClosed ||
                blockedSlots.includes(timeText) ||
                currentCount >= currentMaxJeeps ||
                timeAlreadyPassed
              ) {
                slot.classList.add(
                  "opacity-50",
                  "pointer-events-none",
                  "bg-stone-200",
                );

                if (isSystemClosed || currentMaxJeeps === 0)
                  slot.innerHTML = `${timeText} <span class="text-[8px] block">(CLOSED)</span>`;
                else if (timeAlreadyPassed)
                  slot.innerHTML = `${timeText} <span class="text-[8px] block">(CLOSED)</span>`;
                else if (currentCount >= currentMaxJeeps)
                  slot.innerHTML = `${timeText} <span class="text-[8px] block">(FULL)</span>`;
              } else {
                slot.innerHTML = timeText;
              }
            });

            if (btnConfirm) {
              if (isSystemClosed || currentMaxJeeps === 0) {
                btnConfirm.disabled = true;
                btnConfirm.innerText = "ระบบปิดรับจองชั่วคราว";
                btnConfirm.classList.add("opacity-50");
              } else {
                btnConfirm.disabled = false;
                btnConfirm.innerText = "Confirm Booking";
                btnConfirm.classList.remove("opacity-50");
              }
            }
          });
      });
  };

  checkSlotAvailability();

  // ==========================================
  // 4. ระบบปฏิทิน (รองรับ advanceDays + จำ selectedDate ไว้เสมอ)
  // ==========================================
  const renderCalendar = () => {
    const calMonth = document.getElementById("calendar-month-display");
    const calGrid = document.getElementById("calendar-grid-display");
    if (!calMonth || !calGrid) return;

    const today = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    calMonth.innerText =
      monthNames[today.getMonth()] + " " + today.getFullYear();

    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // คำนวณวันสุดท้ายที่จองได้
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + currentAdvanceDays);
    const maxDateStr = getFormattedDate(maxDate);

    let gridHTML = "";
    for (let i = 0; i < firstDay; i++) gridHTML += `<div></div>`;

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = getFormattedDate(d);
      // เช็กว่าวันนี้คือวันที่ user เลือกไว้อยู่ไหม
      const isSelected = selectedDate === dStr;

      if (dStr === todayStr) {
        // วันนี้ — highlight สีเข้มเสมอ
        gridHTML += `<button class="calendar-day bg-[#3a2a18] text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto shadow-md cursor-pointer" data-date="${dStr}">${i}</button>`;
      } else if (dStr > todayStr && dStr <= maxDateStr) {
        // วันที่จองล่วงหน้าได้ — ถ้าถูกเลือกให้ highlight สีเข้ม ถ้าไม่ได้เลือกให้สีขาว
        gridHTML += `<button class="calendar-day ${isSelected ? "bg-[#cba472] text-white shadow-md" : "text-[#2c2c2c] bg-white border border-slate-200 hover:bg-[#cba472] hover:text-white"} rounded-full w-7 h-7 flex items-center justify-center mx-auto cursor-pointer" data-date="${dStr}">${i}</button>`;
      } else {
        // วันที่กดไม่ได้
        gridHTML += `<div class="text-slate-300 w-7 h-7 mx-auto flex items-center justify-center pointer-events-none">${i}</div>`;
      }
    }

    // Cross-month fix: ถ้า maxDate ข้ามเดือน ให้วาดวันต้นเดือนถัดไปด้วย
    if (maxDate.getMonth() !== today.getMonth()) {
      const nextMonthDays = maxDate.getDate();
      for (let i = 1; i <= nextMonthDays; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + 1, i);
        const dStr = getFormattedDate(d);
        const isSelected = selectedDate === dStr;
        gridHTML += `<button class="calendar-day ${isSelected ? "bg-[#3a2a18] text-white shadow-md" : "text-[#2c2c2c] bg-white border border-slate-200 hover:bg-[#cba472] hover:text-white"} rounded-full w-7 h-7 flex items-center justify-center mx-auto cursor-pointer" data-date="${dStr}">${i}</button>`;
      }
    }

    calGrid.innerHTML = gridHTML;

    // ผูก event listener ให้ปุ่มวันในปฏิทิน
    document.querySelectorAll(".calendar-day").forEach((dayBtn) => {
      dayBtn.addEventListener("click", function () {
        //  ไม่ต้อง toggle class ด้วย JS แล้ว เพราะ renderCalendar() จะ highlight ให้เองจาก selectedDate
        selectedDate = this.getAttribute("data-date");
        selectedTime = "";
        // re-render ปฏิทินให้ highlight วันใหม่ทันที
        renderCalendar();
        checkSlotAvailability();
      });
    });
  };

  renderCalendar();

  // ==========================================
  // 5. ระบบเลือกเวลา และการบันทึกการจอง
  // ==========================================
  const handleSlotClick = function () {
    if (this.classList.contains("pointer-events-none")) return;
    timeSlots.forEach((s) => {
      s.classList.remove("bg-[#8ba37a]", "text-white");
      s.classList.add("bg-white", "text-stone-700");
    });
    this.classList.replace("bg-white", "bg-[#8ba37a]");
    this.classList.replace("text-stone-700", "text-white");
    selectedTime = this.getAttribute("data-time");
  };

  timeSlots.forEach((slot) => {
    slot.addEventListener("click", handleSlotClick);
  });

  if (btnConfirm) {
    btnConfirm.addEventListener("click", async (e) => {
      e.preventDefault();
      const name = inputName.value.trim();
      const phone = inputPhone.value.trim();

      if (!selectedTime || !name || !phone) {
        return alert("กรุณาเลือกเวลา และกรอกข้อมูลให้ครบถ้วนครับ");
      }

      const phoneRegex = /^[0-9]{9,10}$/;
      if (!phoneRegex.test(phone)) {
        return alert("กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 9-10 หลักครับ");
      }

      const originalText = btnConfirm.innerText;
      btnConfirm.innerText = "กำลังประมวลผล...";
      btnConfirm.disabled = true;

      try {
        const snapshot = await db
          .collection("bookings")
          .where("date", "==", selectedDate)
          .where("timeSlot", "==", selectedTime)
          .where("status", "in", ["PENDING", "CONFIRMED"])
          .get();

        if (snapshot.size >= currentMaxJeeps) {
          alert("ขออภัยครับ รอบเวลานี้เพิ่งเต็มไปเมื่อสักครู่");
          timeSlots.forEach((s) => {
            s.classList.remove("bg-[#8ba37a]", "text-white");
            s.classList.add("bg-white", "text-stone-700");
          });
          selectedTime = "";
          return resetButton(btnConfirm, originalText);
        }

        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.floor(1000 + Math.random() * 9000);
        const trackingCode = `BPM-${timestamp}${random}`;

        await db.collection("bookings").add({
          bookingCode: trackingCode,
          name,
          phone,
          date: selectedDate,
          timeSlot: selectedTime,
          status: "PENDING",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        sendLineNotify({
          code: trackingCode,
          name,
          phone,
          date: selectedDate,
          time: selectedTime,
        });

        if (displayCode) displayCode.innerText = trackingCode;
        if (successModal) successModal.classList.remove("hidden");

        inputName.value = "";
        inputPhone.value = "";
        timeSlots.forEach((s) => {
          s.classList.remove("bg-[#8ba37a]", "text-white");
          s.classList.add("bg-white", "text-stone-700");
        });
        selectedTime = "";
        resetButton(btnConfirm, originalText);
      } catch (error) {
        alert("จองไม่สำเร็จ: " + error.message);
        resetButton(btnConfirm, originalText);
      }
    });
  }

  function resetButton(btn, text) {
    btn.innerText = text;
    btn.disabled = false;
  }

  // ==========================================
  // 6. ระบบคัดลอกรหัสจอง
  // ==========================================
  const btnCopyCode = document.getElementById("btn-copy-code");
  if (btnCopyCode && displayCode) {
    btnCopyCode.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(displayCode.innerText);
        alert(`คัดลอกรหัส ${displayCode.innerText} เรียบร้อยแล้ว!`);
      } catch (err) {
        alert("คัดลอกไม่สำเร็จ");
      }
    });
  }

  // ==========================================
  // 7. ระบบค้นหาคิวจอง
  // ==========================================
  const btnSearch = document.getElementById("btn-search-booking");
  const searchInput = document.getElementById("search-input");
  if (btnSearch && searchInput) {
    btnSearch.addEventListener("click", async () => {
      const code = searchInput.value.trim().toUpperCase();
      if (!code) return alert("กรุณาใส่รหัสจองครับ");

      const snapshot = await db
        .collection("bookings")
        .where("bookingCode", "==", code)
        .get();

      if (snapshot.empty) return alert("ไม่พบรหัสจองนี้ครับ");

      sessionStorage.setItem(
        "myBooking",
        JSON.stringify(snapshot.docs[0].data()),
      );
      window.location.href = window.location.pathname.includes("/pages/")
        ? "my_booking.html"
        : "pages/my_booking.html";
    });
  }
});

async function sendLineNotify(bookingData) {
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbySi_xd7ZKXa8SKRlk8WyR7oaw8gfK5J_eizjFUMjd-2tF6Q9rjgAek0c1YdvB7-fry/exec";
  try {
    await fetch(scriptURL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(bookingData),
    });
  } catch (error) {
    console.error("LINE Notify Error:", error);
  }
}