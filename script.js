// عنوان الـ API المضمون
const API_BASE = "https://secure-quiz-asala-1.onrender.com/api/results?quiz_id=";

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  loadQuizzes();
});

// جلب قائمة الاختبارات
async function loadQuizzes() {
  const quizList = document.getElementById("quiz-list");
  quizList.innerHTML = "<p>جاري تحميل البيانات...</p>";

  try {
    // استبدل هذا لاحقًا ببيانات الاختبارات الفعلية من الـ API
    const quizzes = [
      { id: "quiz_6745ab2f", name: "اختبار مبادئ القانون", date: "2025-10-11", successRate: 82, students: 42 },
      { id: "quiz_6745bc3a", name: "اختبار الأنظمة المقارنة", date: "2025-10-08", successRate: 76, students: 38 }
    ];

    let html = `
      <table class="results-table">
        <thead>
          <tr>
            <th>الرقم</th>
            <th>اسم الاختبار</th>
            <th>التاريخ</th>
            <th>عدد الطلاب</th>
            <th>نسبة النجاح</th>
            <th>عرض التفاصيل</th>
            <th>الباركود</th>
          </tr>
        </thead>
        <tbody>
    `;

    quizzes.forEach((quiz, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${quiz.name}</td>
          <td>${quiz.date}</td>
          <td>${quiz.students}</td>
          <td>${quiz.successRate}%</td>
          <td><button onclick="showDetails('${quiz.id}', '${quiz.name}')">🔍 عرض</button></td>
          <td><div id="qr-${quiz.id}" class="qr-code"></div></td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    quizList.innerHTML = html;

    // توليد أكواد QR لكل اختبار
    quizzes.forEach(q => {
      new QRCode(document.getElementById(`qr-${q.id}`), {
        text: `https://secure-quiz-asala-1.onrender.com/quiz?id=${q.id}`,
        width: 80,
        height: 80
      });
    });
  } catch (err) {
    quizList.innerHTML = "<p style='color:red'>حدث خطأ أثناء تحميل البيانات.</p>";
    console.error(err);
  }
}

// عرض التفاصيل داخل النافذة
async function showDetails(quizId, quizName) {
  const modal = document.getElementById("details-modal");
  const title = document.getElementById("quiz-title");
  const resultsDiv = document.getElementById("quiz-results");

  modal.style.display = "block";
  title.textContent = quizName;
  resultsDiv.innerHTML = "<p>جاري تحميل النتائج...</p>";

  try {
    const response = await fetch(API_BASE + quizId);
    const data = await response.json();

    if (!data || data.length === 0) {
      resultsDiv.innerHTML = "<p>لا توجد نتائج بعد لهذا الاختبار.</p>";
      return;
    }

    let html = `
      <table class="details-table">
        <thead>
          <tr>
            <th>اسم الطالب</th>
            <th>الرقم الجامعي</th>
            <th>الدرجة</th>
            <th>النسبة</th>
            <th>الوقت المستغرق</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(s => {
      html += `
        <tr>
          <td>${s.name}</td>
          <td>${s.studentId}</td>
          <td>${s.score}</td>
          <td>${s.percent}%</td>
          <td>${s.time}</td>
          <td>${s.status}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    resultsDiv.innerHTML = html;
  } catch (error) {
    resultsDiv.innerHTML = "<p style='color:red'>تعذّر جلب النتائج من المنصة.</p>";
    console.error(error);
  }
}

// إغلاق النافذة
function closeModal() {
  document.getElementById("details-modal").style.display = "none";
}

// تسجيل الخروج
function logout() {
  window.location.href = "index.html";
}
