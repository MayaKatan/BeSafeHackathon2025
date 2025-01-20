let currentQuestion = 0;
let score = 0;

const questions = [
    {
        question: "המשטרה מזהירה: היזהרו מהונאות פישינג ברשת",
        options: [
            { text: "המשטרה מזהירה מפני כנופייה בשם פישינג שדגה את המידע של המשתמש באפליקציה אינסטגרם", isCorrect: false },
            { text: "המשטרה פרסמה אזהרה על הונאות פישינג המתרחשות ברשת, בהן נשלחות הודעות דואר אלקטרוני המתחזות לגורמים מוסמכים במטרה לגנוב מידע אישי.", isCorrect: true },
        ]
    },
    {
        question: "הורים, שימו לב: ילדים נחשפים לתוכן לא ראוי באינטרנט",
        options: [
            { text: "מחקרים מראים כי ילדים נחשפים לתוכן לא ראוי באינטרנט, כולל תכנים אלימים ומיניים, המשפיעים על התפתחותם.", isCorrect: true },
            { text: " מחקרים מראים כי ילדים נחשפים לסרטי פעולה בהם הצפייה היא מעל גיל 16 בלבד ", isCorrect: false }
        ]
    },
    {
        question: "הזהרו: אפליקציות מזויפות גונבות מידע אישי",
        options: [
            { text: "פליקציות מזויפות המתחזות לאפליקציות פופולריות גונבות מידע אישי, כולל סיסמאות ופרטי כרטיסי אשראי.", isCorrect: true },
            { text: "אפליקציה חדשה שמתקשרת לילד וגונבת ממנו פרטי מידע ונשמעת ממש כמו אדם אמיתי", isCorrect: false },
        ]
    },
    {
        question: "המשטרה מזהירה: היזהרו מהונאות רומנטיות באינטרנט",
        options: [
            { text: "המשטרה מנסה להגן על האזרחים מפני הודעות מיותרות באפליקציות היכרויות", isCorrect:  false },
            { text: "המשטרה פרסמה אזהרה על הונאות רומנטיות, בהן נוכלים מתחזים לדמויות רומנטיות במטרה להונות אנשים ברשת.", isCorrect: true  },
        ]
    },
    {
        question: "הורים, שימו לב: ילדים נחשפים להטרדות מיניות באינטרנט",
        options: [
            { text: "מחקרים מראים כי ילדים נחשפים להטרדות מיניות בטלוויזיה, כולל שיחות לא הולמות והצעות מיניות.", isCorrect: false },
            { text: "מחקרים מראים כי ילדים נחשפים להטרדות מיניות באינטרנט, כולל שיחות לא הולמות והצעות מיניות.", isCorrect: true },
        ]
    },
    {
        question: "היזהרו: וירוסים המתחזים לעדכוני מערכת הפעלה",
        options: [
            { text: "וירוסים חדשניים שיצאו בשנת 2025 מתחזים לאדם מוכר וגונבים מידע טלפונית", isCorrect: false },
            { text: "וירוסים המתחזים לעדכוני מערכת הפעלה יכולים להתקין תוכנות זדוניות במחשב, גונבות מידע אישי.", isCorrect: true },
        ]
    },
    {
        question: "משטרה מזהירה: היזהרו מהונאות השקעות באינטרנט",
        options: [
            { text: "המשטרה חוששת שאזרחים לא ישקיעו במטבע הישראלי ולכן מזהירה מגורמים המנסים לייצר השקעות במדינות זרות", isCorrect: false },
            { text: " המשטרה פרסמה אזהרה על הונאות השקעות, בהן נוכלים מציעים השקעות מזויפות במטרה להונות אנשים ברשת.", isCorrect: true },
        ]
    },
    {
        question: "הורים, שימו לב: ילדים נחשפים לתכנים אלימים באינטרנט",
        options: [
            { text: "מחקרים מראים כי ילדים נחשפים לתכנים אלימים באינטרנט, כולל סרטונים ותמונות המעודדים אלימות.", isCorrect: true },
            { text: "ילדים מזמינים מפלצות שיחכו מתחת למיטה של ילדים אחרים", isCorrect: false }
        ]
    },
    {
        question: "היזהרו: אתרי אינטרנט המתחזים לאתרים רשמיים",
        options: [
            { text: "אתרי אינטרנט המתחזים לאתרים רשמיים יכולים לגנוב מידע אישי, כולל סיסמאות ופרטי כרטיסי אשראי.", isCorrect: true },
            { text: "אתרי אינטרנט שהופכים לאתר אחר בגלל פריצות סייבר", isCorrect: false },
        ]
    },
    {
        question: "המשטרה חושפת: פדופילים מנהלים קשרים עם ילדים דרך חדרי צ'אט באינטרנט",
        options: [
            { text: "במדינת פדופילוס גורמים חשאיים מנסים לגייס ישראלים לשורות הצבא", isCorrect: false },
            { text: "המשטרה פרסמה אזהרה על פדופילים המנהלים קשרים עם ילדים דרך חדרי צ'אט באינטרנט, במטרה לנצלם מינית.", isCorrect: true },
        ]
    }
];

function loadQuestion() {
    document.getElementById('start-screen').classList.add('hidden'); // הסתרת התמונה לאחר ההתחלה
    if (currentQuestion >= questions.length) {
        showResults();
        return;
    }

    const questionObj = questions[currentQuestion];
    document.getElementById('question').textContent = `${currentQuestion + 1}. ${questionObj.question}`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    questionObj.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => checkAnswer(option.isCorrect);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect) score++;
    currentQuestion++;
    loadQuestion();
}

function showResults() {
    const totalQuestions = questions.length;
    const percentage = (score / totalQuestions) * 100; // חישוב אחוזי הצלחה
    let message = '';

    if (percentage >= 80) {
        message = "מרשים מאוד! הצלחת לזהות כל כך הרבה פייקניוז!";
    } else {
        message = "לא פשוט לזהות פייקניוז, אולי תצליח יותר בפעם הבאה! מוזמן לנסות שוב";
    }

    document.getElementById('result').textContent = `${message} הציון שלך הוא: ${score} מתוך ${totalQuestions}`;
    document.getElementById('result-container').classList.remove('hidden');
    document.getElementById('question-container').classList.add('hidden');
}

function restartQuiz() {
    currentQuestion = 0;
    score = 0;
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('question-container').classList.remove('hidden');
    loadQuestion();
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('question-container').classList.remove('hidden');
    loadQuestion();
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('start-screen').classList.remove('hidden');
});