document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // ส่วนที่ 1: ระบบเปิด-ปิดเมนู Hamburger
  // ==========================================
  const mobileBtn = document.getElementById("mobile-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconMenu = document.getElementById("icon-menu");
  const iconClose = document.getElementById("icon-close");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  let isMenuOpen = false;

  // ฟังก์ชันส่วนกลางสำหรับสั่งปิดเมนู
  function closeMenu() {
    isMenuOpen = false;
    mobileMenu.classList.remove("opacity-100", "pointer-events-auto");
    mobileMenu.classList.add("opacity-0", "pointer-events-none");

    iconClose.classList.add("hidden", "rotate-90");
    iconMenu.classList.remove("hidden");

    mobileLinks.forEach((link) => {
      link.classList.remove("translate-y-0", "opacity-100");
      link.classList.add("translate-y-10", "opacity-0");
    });

    document.body.style.overflow = ""; // คืนค่าให้ scroll หน้าจอได้ปกติ
  }

  mobileBtn.addEventListener("click", () => {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
      // เปิดเมนู
      mobileMenu.classList.remove("opacity-0", "pointer-events-none");
      mobileMenu.classList.add("opacity-100", "pointer-events-auto");

      iconMenu.classList.add("hidden");
      iconClose.classList.remove("hidden", "rotate-90");
      iconClose.classList.add("rotate-0");

      mobileLinks.forEach((link, index) => {
        setTimeout(
          () => {
            link.classList.remove("translate-y-10", "opacity-0");
            link.classList.add("translate-y-0", "opacity-100");
          },
          100 * (index + 1),
        );
      });

      document.body.style.overflow = "hidden"; // ล็อคหน้าจอไม่ให้ไถตอนเปิดเมนู
    } else {
      closeMenu(); // ใช้ฟังก์ชันปิดเมนู
    }
  });

  // วนลูปให้ลิงก์ในมือถือทุกตัว ถ้าโดน "คลิก" ให้สั่งปิดเมนูทันที
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu(); // ปิดเมนูอัตโนมัติเมื่อเลือกหัวข้อ
    });
  });

  // ==========================================
  // ส่วนที่ 2: ระบบ Scroll Animation (แบบ Premium)
  // ==========================================
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("opacity-0", "translate-y-12");
          entry.target.classList.add("opacity-100", "translate-y-0");
        } else {
          if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove("opacity-100", "translate-y-0");
            entry.target.classList.add("opacity-0", "translate-y-12");
          }
        }
      });
    },
    { threshold: 0.15 },
  );

  const animateElements = document.querySelectorAll(".scroll-animate");
  animateElements.forEach((el) => observer.observe(el));

  // ==========================================
  // ส่วนที่ 3: ACTIVE STATE (Scroll Spy)
  // ==========================================
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  function onScroll() {
    let currentSectionId = "";

    document
      .querySelectorAll("section[id], div[id], header[id], footer[id]")
      .forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 150) {
          currentSectionId = section.getAttribute("id");
        }
      });

    // ดักจับขอบล่างของเว็บ
    if (
      window.innerHeight + Math.round(window.scrollY) >=
      document.body.offsetHeight - 20
    ) {
      currentSectionId = "contact";
    }

    navLinks.forEach((link) => {
      const linkHref = link.getAttribute("href");
      link.classList.remove("text-[#cba472]");
      link.classList.add("text-white");

      if (linkHref === `#${currentSectionId}`) {
        link.classList.remove("text-white");
        link.classList.add("text-[#cba472]");
      }
    });
  }

  window.addEventListener("scroll", onScroll);
});
