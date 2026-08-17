const gradePoints = {
    O: 10,
    "A+": 9,
    A: 8,
    "B+": 7,
    B: 6,
    C: 5,
    U: 0,
    RA: 0
};

const subjectBody = document.getElementById("subjectBody");
const message = document.getElementById("message");
const resultBox = document.getElementById("resultBox");
const totalCreditsElement = document.getElementById("totalCredits");
const weightedPointsElement = document.getElementById("weightedPoints");
const sgpaValueElement = document.getElementById("sgpaValue");
const historyList = document.getElementById("historyList");
const cgpaBox = document.getElementById("cgpaBox");
const cgpaValueElement = document.getElementById("cgpaValue");

let latestCalculation = null;
let savedSemesters = JSON.parse(localStorage.getItem("kgislSemesters")) || [];

function createGradeOptions(selectedGrade = "") {
    const grades = Object.keys(gradePoints);

    return `
    <option value="">Select</option>
    ${grades
            .map(
                (grade) =>
                    `<option value="${grade}" ${grade === selectedGrade ? "selected" : ""}>
            ${grade}
          </option>`
            )
            .join("")}
  `;
}

function addSubject(data = {}) {
    const row = document.createElement("tr");

    row.innerHTML = `
    <td><input class="course-code" placeholder="24UTA161" value="${data.code || ""}" /></td>
    <td><input class="subject-name" placeholder="Subject name" value="${data.name || ""}" /></td>
    <td><input class="credit" type="number" min="0" step="0.5" placeholder="3" value="${data.credit ?? ""}" /></td>
    <td>
      <select class="grade">
        ${createGradeOptions(data.grade || "")}
      </select>
    </td>
    <td class="grade-point">—</td>
    <td><button type="button" class="delete-btn">Remove</button></td>
  `;

    const gradeSelect = row.querySelector(".grade");
    const gradePointCell = row.querySelector(".grade-point");

    function updateGradePoint() {
        const grade = gradeSelect.value;
        gradePointCell.textContent = grade ? gradePoints[grade].toFixed(2) : "—";
    }

    gradeSelect.addEventListener("change", updateGradePoint);

    row.querySelector(".delete-btn").addEventListener("click", () => {
        row.remove();
    });

    subjectBody.appendChild(row);
    updateGradePoint();
}

function calculateSGPA() {
    const rows = [...subjectBody.querySelectorAll("tr")];

    if (rows.length === 0) {
        message.textContent = "At least one subject must be added.";
        resultBox.classList.add("hidden");
        return;
    }

    let totalCredits = 0;
    let weightedPoints = 0;
    let validSubjects = 0;

    for (const row of rows) {
        const code = row.querySelector(".course-code").value.trim();
        const name = row.querySelector(".subject-name").value.trim();
        const creditValue = row.querySelector(".credit").value;
        const grade = row.querySelector(".grade").value;

        if (!creditValue && !grade && !code && !name) {
            continue;
        }

        const credit = Number(creditValue);

        if (!Number.isFinite(credit) || credit < 0 || (credit > 0 && !grade)) {
            message.textContent =
                "Each entered subject needs a valid credit and grade. Use 0 credit for non-credit courses.";
            resultBox.classList.add("hidden");
            return;
        }

        if (credit === 0) {
            continue;
        }

        totalCredits += credit;
        weightedPoints += credit * gradePoints[grade];
        validSubjects++;
    }

    if (validSubjects === 0 || totalCredits === 0) {
        message.textContent = "Enter at least one credit-bearing subject.";
        resultBox.classList.add("hidden");
        return;
    }

    const sgpa = weightedPoints / totalCredits;

    latestCalculation = {
        semester: document.getElementById("semesterName").value,
        regulation: document.getElementById("regulation").value,
        totalCredits,
        weightedPoints,
        sgpa
    };

    totalCreditsElement.textContent = totalCredits.toFixed(2);
    weightedPointsElement.textContent = weightedPoints.toFixed(2);
    sgpaValueElement.textContent = sgpa.toFixed(2);

    message.textContent = "";
    resultBox.classList.remove("hidden");
}

function saveSemester() {
    if (!latestCalculation) {
        message.textContent = "Calculate My CGPA before saving the semester.";
        return;
    }

    const semesterIndex = savedSemesters.findIndex(
        (item) => item.semester === latestCalculation.semester
    );

    if (semesterIndex >= 0) {
        savedSemesters[semesterIndex] = latestCalculation;
    } else {
        savedSemesters.push(latestCalculation);
    }

    savedSemesters.sort((a, b) => {
        const semesterA = Number(a.semester.replace(/\D/g, ""));
        const semesterB = Number(b.semester.replace(/\D/g, ""));
        return semesterA - semesterB;
    });

    localStorage.setItem("kgislSemesters", JSON.stringify(savedSemesters));
    message.textContent = `${latestCalculation.semester} saved successfully.`;
    renderHistory();
}

function deleteSemester(semester) {
    savedSemesters = savedSemesters.filter((item) => item.semester !== semester);
    localStorage.setItem("kgislSemesters", JSON.stringify(savedSemesters));
    renderHistory();
}

function renderHistory() {
    if (savedSemesters.length === 0) {
        historyList.innerHTML = `<p class="empty-history">No saved semesters yet.</p>`;
        cgpaBox.classList.add("hidden");
        return;
    }

    historyList.innerHTML = savedSemesters
        .map(
            (item) => `
        <div class="history-item">
          <div>
            <strong>${item.semester}</strong>
            <span> • ${item.regulation} • ${item.totalCredits.toFixed(2)} credits</span>
          </div>
          <div>
            <strong>SGPA: ${item.sgpa.toFixed(2)}</strong>
            <button type="button" class="delete-btn" data-semester="${item.semester}">
              Delete
            </button>
          </div>
        </div>
      `
        )
        .join("");

    document.querySelectorAll("[data-semester]").forEach((button) => {
        button.addEventListener("click", () => {
            deleteSemester(button.dataset.semester);
        });
    });

    const totalCredits = savedSemesters.reduce(
        (sum, item) => sum + item.totalCredits,
        0
    );

    const totalWeightedPoints = savedSemesters.reduce(
        (sum, item) => sum + item.weightedPoints,
        0
    );

    const cgpa = totalWeightedPoints / totalCredits;

    cgpaValueElement.textContent = cgpa.toFixed(2);
    cgpaBox.classList.remove("hidden");
}

document.getElementById("addSubjectBtn").addEventListener("click", () => addSubject());
document.getElementById("calculateBtn").addEventListener("click", calculateSGPA);
document.getElementById("saveSemesterBtn").addEventListener("click", saveSemester);
// Manual entry-ku separate button
const calculateManualBtn = document.getElementById('calculateManualBtn');
if (calculateManualBtn) {
    calculateManualBtn.addEventListener('click', calculateSGPA);
}

const yourSemesterOneSubjects = [
    { code: "24UTA161", name: "Heritage of Tamils", credit: 1, grade: "B+" },
    { code: "24UEN171", name: "Communicative English", credit: 3, grade: "A" },
    { code: "24UMA161", name: "Calculus and Matrix Algebra", credit: 4, grade: "A+" },
    { code: "24UPY171", name: "Physics", credit: 3, grade: "A" },
    { code: "24UCH171", name: "Engineering Chemistry", credit: 3, grade: "A" },
    { code: "24UCS161", name: "Computational Thinking", credit: 3, grade: "B+" },
    { code: "24UCS171", name: "Python Programming", credit: 4, grade: "B+" },
    { code: "24UME166", name: "Engineering Graphics", credit: 2, grade: "O" }
];

yourSemesterOneSubjects.forEach(addSubject);
renderHistory();
// Screenshot upload and preview

const resultImageInput = document.getElementById("resultImage");
const uploadZone = document.getElementById("uploadZone");
const previewArea = document.getElementById("previewArea");
const imagePreview = document.getElementById("imagePreview");
const imageName = document.getElementById("imageName");
const removeImageBtn = document.getElementById("removeImageBtn");

let selectedImageFile = null;

function showUploadMessage(text) {
    message.textContent = text;

    setTimeout(() => {
        if (message.textContent === text) {
            message.textContent = "";
        }
    }, 4500);
}

function handleSelectedImage(file) {
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        showUploadMessage("Please select a PNG, JPG, or JPEG image.");
        return;
    }

    if (file.size > maxFileSize) {
        showUploadMessage("Image is too large. Please select an image below 5 MB.");
        return;
    }

    selectedImageFile = file;

    const reader = new FileReader();

    reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imageName.textContent = file.name;
        previewArea.classList.remove("hidden");

        showUploadMessage(
            "Screenshot selected successfully. Please review it before scanning."
        );
    };

    reader.readAsDataURL(file);
}

resultImageInput.addEventListener("change", (event) => {
    handleSelectedImage(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.classList.add("dragging");
    });
});

["dragleave", "drop"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.classList.remove("dragging");
    });
});

uploadZone.addEventListener("drop", (event) => {
    handleSelectedImage(event.dataTransfer.files[0]);
});

removeImageBtn.addEventListener("click", () => {
    selectedImageFile = null;
    resultImageInput.value = "";
    imagePreview.src = "";
    imageName.textContent = "";
    previewArea.classList.add("hidden");

    showUploadMessage("Screenshot removed.");
});
// OCR: Read text from the uploaded result screenshot

const scanResultBtn = document.getElementById("scanResultBtn");
const scanStatus = document.getElementById("scanStatus");
const ocrTextBox = document.getElementById("ocrTextBox");
const ocrText = document.getElementById("ocrText");
const fillSubjectsBtn = document.getElementById("fillSubjectsBtn");
fillSubjectsBtn.addEventListener("click", () => {
    const ocrTextContent = ocrText.textContent.trim();

    if (!ocrTextContent) {
        scanStatus.textContent = "No text detected. Please upload a clear screenshot.";
        return;
    }

    const subjects = parseKgiSLResultText(ocrTextContent);

    if (subjects.length === 0) {
        scanStatus.textContent =
            "Could not detect any subjects. Please check the OCR text or use manual entry.";
        return;
    }

    // Clear existing rows
    subjectBody.innerHTML = "";

    // Fill detected subjects
    subjects.forEach((subject) => addSubject(subject));

    scanStatus.textContent = `Filled ${subjects.length} subjects. Please review and calculate.`;
    fillSubjectsBtn.classList.add("hidden");
    ocrTextBox.classList.add("hidden");

    // Scroll to calculator
    document
        .querySelector(".calculator-card")
        .scrollIntoView({ behavior: "smooth", block: "start" });
});

scanResultBtn.addEventListener("click", async () => {
    if (!selectedImageFile) {
        scanStatus.textContent = "Please choose a result screenshot first.";
        return;
    }

    if (typeof Tesseract === "undefined") {
        scanStatus.textContent =
            "OCR library could not load. Check your internet connection and refresh the page.";
        return;
    }

    scanResultBtn.disabled = true;
    scanResultBtn.innerHTML = "Reading screenshot...";
    scanStatus.textContent = "Preparing the scanner. Please wait...";
    ocrTextBox.classList.add("hidden");

    try {
        const worker = await Tesseract.createWorker("eng", 1, {
            logger: (progress) => {
                const percent = Math.round((progress.progress || 0) * 100);

                if (progress.status === "recognizing text") {
                    scanStatus.textContent = `Reading your result... ${percent}%`;
                } else if (progress.status) {
                    scanStatus.textContent = "Setting up scanner...";
                }
            }
        });

        const result = await worker.recognize(selectedImageFile);
        const detectedText = result.data.text.trim();

        await worker.terminate();

        if (!detectedText) {
            scanStatus.textContent =
                "We could not find readable text. Please upload a clearer screenshot.";
            return;
        }

        ocrText.textContent = detectedText;
        ocrTextBox.classList.remove("hidden");
        scanStatus.textContent =
            "Text read successfully. Please review it before we fill the subjects.";
        fillSubjectsBtn.classList.remove("hidden");
    } catch (error) {
        console.error(error);
        scanStatus.textContent =
            "We could not read this image. Try a clear screenshot or use manual entry.";
    } finally {
        scanResultBtn.disabled = false;
        scanResultBtn.innerHTML = 'Read My Result <span>→</span>';
    }
});
// Convert OCR text into editable calculator subject rows



function normalizeOcrText(text) {
    return text
        .replace(/\r/g, "")
        .replace(/[|]/g, " ")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, " ")
        .trim();
}

function findGradeInText(text) {
    const gradeMatch = text.match(
        /(?:\s|^)(O|A\+|A|B\+|B|C|U|RA)(?=\s|$)/i
    );

    return gradeMatch ? gradeMatch[1].toUpperCase() : "";
}

function parseKgiSLResultText(text) {
    const lines = text
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const subjects = [];

    for (const line of lines) {
        // Course code pattern: 24UTA161, CS101, etc.
        const coursePattern = /\b(\d{2,3}[A-Z]{2,6}\d{2,4}|[A-Z]{2,4}\d{3,5})\b/i;
        const courseMatch = line.match(coursePattern);

        if (!courseMatch) {
            continue;
        }

        const code = courseMatch[1].toUpperCase();
        const afterCode = line
            .slice(line.indexOf(courseMatch[0]) + courseMatch[0].length)
            .trim();

        // Credit: 1, 2, 3, 4 (with optional .00)
        const creditMatch = afterCode.match(/\b(1|2|3|4|5)(?:\.00)?\b/);

        if (!creditMatch) {
            continue;
        }

        const credit = Number(creditMatch[1]);
        const subjectName = afterCode
            .slice(0, creditMatch.index)
            .trim();

        const resultPart = afterCode
            .slice(creditMatch.index + creditMatch[0].length)
            .trim();

        // Grade: PASS A, PASS A+, PASS B+, etc.
        const gradeMatch = resultPart.match(
            /\b(?:PASS|FAIL|COMPLETED)\s+(O|A\+|A|B\+|B|C|U|RA)\b/i
        );

        let grade = gradeMatch ? gradeMatch[1].toUpperCase() : "";

        // GP column base panni grade-a confirm/correct pannum.
        const gpMatch = resultPart.match(
            /\b(10\.00|9\.00|8\.00|7\.00|6\.00|5\.00|0\.00)\b\s*$/
        );

        const gradeFromGp = {
            "10.00": "O",
            "9.00": "A+",
            "8.00": "A",
            "7.00": "B+",
            "6.00": "B",
            "5.00": "C",
            "0.00": "U"
        };

        // Grade missing-a irundha GP use pannu.
        if (!grade && gpMatch && gradeFromGp[gpMatch[1]]) {
            grade = gradeFromGp[gpMatch[1]];
        }

        // Grade irundha, GP-oda match check pannu (OCR mistake correct pannum).
        if (grade && gpMatch && gradeFromGp[gpMatch[1]]) {
            const gpGrade = gradeFromGp[gpMatch[1]];
            if (gpGrade !== grade) {
                grade = gpGrade;
            }
        }

        subjects.push({
            code,
            name: subjectName || "Course name not detected",
            credit,
            grade
        });
    }

    return subjects;
}

// Download current SGPA calculation as a PDF

const downloadPdfBtn = document.getElementById("downloadPdfBtn");

downloadPdfBtn.addEventListener("click", () => {
    if (!latestCalculation) {
        showUploadMessage("Please calculate My CGPA before downloading the PDF.");
        return;
    }

    if (typeof window.jspdf === "undefined") {
        showUploadMessage(
            "PDF library could not load. Check internet connection and refresh the page."
        );
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    const semester = latestCalculation.semester;
    const regulation = latestCalculation.regulation;

    pdf.setFillColor(20, 33, 61);
    pdf.rect(0, 0, 210, 38, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("KGiSL Institute of Technology", 15, 16);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("CGPA Calculator - Semester Result Summary", 15, 24);
    pdf.text(`${semester} | ${regulation}`, 15, 31);

    pdf.setTextColor(35, 35, 45);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("CGPA Summary", 15, 52);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Total Credits: ${latestCalculation.totalCredits.toFixed(2)}`, 15, 61);
    pdf.text(
        `Weighted Points: ${latestCalculation.weightedPoints.toFixed(2)}`,
        15,
        68
    );

    pdf.setFillColor(105, 53, 140);
    pdf.roundedRect(140, 50, 55, 24, 3, 3, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text("YOUR CGPA", 158, 59);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(latestCalculation.sgpa.toFixed(2), 158, 69);

    pdf.setTextColor(35, 35, 45);
    pdf.setFontSize(13);
    pdf.text("Course Details", 15, 87);

    const rows = [...subjectBody.querySelectorAll("tr")];
    let y = 96;

    pdf.setFillColor(242, 238, 246);
    pdf.rect(15, y - 6, 180, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("Course Code", 17, y);
    pdf.text("Subject", 48, y);
    pdf.text("Credit", 151, y);
    pdf.text("Grade", 169, y);
    pdf.text("GP", 185, y);

    y += 8;

    pdf.setFont("helvetica", "normal");

    rows.forEach((row, index) => {
        const code = row.querySelector(".course-code").value.trim() || "-";
        const name = row.querySelector(".subject-name").value.trim() || "-";
        const credit = row.querySelector(".credit").value || "0";
        const grade = row.querySelector(".grade").value || "-";
        const gp = grade ? gradePoints[grade].toFixed(2) : "-";

        if (y > 275) {
            pdf.addPage();
            y = 20;
        }

        if (index % 2 === 0) {
            pdf.setFillColor(250, 248, 252);
            pdf.rect(15, y - 5, 180, 7, "F");
        }

        const shortName =
            name.length > 42 ? `${name.substring(0, 39)}...` : name;

        pdf.setFontSize(8);
        pdf.text(code, 17, y);
        pdf.text(shortName, 48, y);
        pdf.text(String(credit), 151, y);
        pdf.text(grade, 169, y);
        pdf.text(gp, 185, y);

        y += 7;
    });

    const pageCount = pdf.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
        pdf.setPage(page);
        pdf.setDrawColor(220, 215, 225);
        pdf.line(15, 286, 195, 286);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(7);
        pdf.setTextColor(110, 105, 120);
        pdf.text(
            "For academic reference only. Verify final results with the official college portal.",
            15,
            291
        );
    }

    const fileName = `${semester.replace(" ", "-")}-CGPA-Result.pdf`;
    pdf.save(fileName);
});
// Clear current calculator data for a new semester calculation

const resetCalculatorBtn = document.getElementById("resetCalculatorBtn");

resetCalculatorBtn.addEventListener("click", () => {
    const shouldReset = confirm(
        "Start a new calculation? Current subject rows and uploaded screenshot will be cleared. Saved semester history will remain."
    );

    if (!shouldReset) return;

    subjectBody.innerHTML = "";
    addSubject();

    latestCalculation = null;
    resultBox.classList.add("hidden");
    message.textContent = "";

    selectedImageFile = null;
    resultImageInput.value = "";
    imagePreview.src = "";
    imageName.textContent = "";
    previewArea.classList.add("hidden");

    scanStatus.textContent = "Review the screenshot, then tap “Read My Result”.";
    ocrText.textContent = "";
    ocrTextBox.classList.add("hidden");
    fillSubjectsBtn.classList.add("hidden");

    document.getElementById("semesterName").value = "Semester 1";

    document
        .querySelector(".calculator-card")
        .scrollIntoView({ behavior: "smooth", block: "start" });

    showUploadMessage("Ready for a new calculation.");
});