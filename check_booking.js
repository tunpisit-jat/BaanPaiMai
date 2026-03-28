document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. ดึงข้อมูลจาก Session Storage
  // ==========================================
  const bookingDataStr = sessionStorage.getItem("myBooking");

  if (!bookingDataStr) {
    alert("ไม่พบข้อมูลการค้นหา กรุณากลับไปกรอกรหัสการจองอีกครั้งครับ");
    window.location.href = document.referrer || "index.html";
    return;
  }

  const initialData = JSON.parse(bookingDataStr);
  const targetBookingCode = initialData.bookingCode;

  // ==========================================
  // 2. ประกาศตัวแปรเชื่อมกับ HTML
  // ==========================================
  const showCode = document.getElementById("show-code");
  const showName = document.getElementById("show-name");
  const showPhone = document.getElementById("show-phone");
  const showTime = document.getElementById("show-time");
  const showStatus = document.getElementById("show-status");
  const showMonth = document.getElementById("show-month");
  const showDay = document.getElementById("show-day");
  const showYear = document.getElementById("show-year");
  const btnCancel = document.getElementById("btn-cancel-booking");

  // ==========================================
  // 3. ดึงข้อมูลแบบ Real-time
  // ==========================================
  db.collection("bookings")
    .where("bookingCode", "==", targetBookingCode)
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          console.log("No matching documents.");
          return;
        }

        const doc = snapshot.docs[0];
        const bookingData = doc.data();
        const docId = doc.id;

        // แสดงข้อมูลทั่วไป
        if (showCode) showCode.innerText = bookingData.bookingCode;
        if (showName) showName.innerText = bookingData.name;
        if (showPhone) showPhone.innerText = bookingData.phone;
        if (showTime) showTime.innerText = bookingData.timeSlot;

        // แสดงวันที่นัดหมาย
        if (bookingData.date) {
          const dateObj = new Date(bookingData.date + "T00:00:00");
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          if (showMonth) showMonth.innerText = monthNames[dateObj.getMonth()];
          if (showDay)
            showDay.innerText = String(dateObj.getDate()).padStart(2, "0");
          if (showYear) showYear.innerText = dateObj.getFullYear();
        }

        // แสดงสถานะและสี
        if (showStatus) {
          showStatus.innerText = bookingData.status;
          showStatus.classList.remove(
            "text-amber-600",
            "bg-amber-100",
            "text-[#6a805b]",
            "bg-[#8ba37a]/10",
            "text-red-600",
            "bg-red-100",
          );
          if (bookingData.status === "PENDING") {
            showStatus.classList.add("text-amber-600", "bg-amber-100");
          } else if (bookingData.status === "CONFIRMED") {
            showStatus.classList.add("text-[#6a805b]", "bg-[#8ba37a]/10");
          } else if (bookingData.status === "CANCELLED") {
            showStatus.classList.add("text-red-600", "bg-red-100");
          }
        }

        // ==========================================
        // 4. ปุ่มยกเลิก — ลด counter slots ด้วย Transaction
        // ==========================================
        if (btnCancel) {
          if (bookingData.status === "PENDING") {
            btnCancel.classList.remove("hidden");

            btnCancel.onclick = async () => {
              if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?")) return;

              const originalText = btnCancel.innerText;
              btnCancel.innerText = "กำลังยกเลิก...";
              btnCancel.disabled = true;

              try {
                const bookingRef = db.collection("bookings").doc(docId);
                const slotKey = `${bookingData.date}_${bookingData.timeSlot}`;
                const slotRef = db.collection("slots").doc(slotKey);

                // Transaction: อัปเดต status + ลด counter พร้อมกัน
                await db.runTransaction(async (transaction) => {
                  const slotDoc = await transaction.get(slotRef);
                  const currentCount = slotDoc.exists
                    ? slotDoc.data().count
                    : 0;

                  transaction.update(bookingRef, { status: "CANCELLED" });
                  transaction.set(
                    slotRef,
                    { count: Math.max(0, currentCount - 1) },
                    { merge: true },
                  );
                });

                // แจ้ง LINE หลัง transaction สำเร็จ
                sendLineNotify({
                  type: "cancel",
                  code: bookingData.bookingCode,
                  name: bookingData.name,
                  phone: bookingData.phone,
                  date: bookingData.date,
                  time: bookingData.timeSlot,
                });

                alert("ยกเลิกการจองเรียบร้อยแล้วครับ");
                // onSnapshot จะซ่อนปุ่มให้อัตโนมัติ
              } catch (error) {
                console.error("Error cancelling:", error);
                alert("ยกเลิกไม่สำเร็จ: " + error.message);
                btnCancel.innerText = originalText;
                btnCancel.disabled = false;
              }
            };
          } else {
            btnCancel.classList.add("hidden");
          }
        }
      },
      (error) => {
        console.error("Firebase Snapshot Error:", error);
        if (error.code === "permission-denied") {
          alert(
            "Firebase ปฏิเสธการเข้าถึง! อย่าลืมเช็กการตั้งค่า Rules นะครับ",
          );
        }
      },
    );
});

// ==========================================
// ฟังก์ชันแจ้งเตือน LINE Notify
// ==========================================
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
