let currentQuestion = 0;
let score = 0;

const questions = [
    {
        question: "כיצד ניתן לזהות פרופיל מזויף ברשתות חברתיות?",
        options: [
            { text: "אם הפרופיל לא מפרסם תמונה של חתול או ציטוטים חכמים, כנראה שזה פרופיל אמיתי.", isCorrect: false },
            { text: "פרופיל ללא תמונה ברורה, מעט חברים, מעט תוכן אישי, ותאריך הצטרפות חדש עלול להיות מזויף.", isCorrect: true },
            { text: "אם יש לפרופיל הרבה תמונות סלפי, זה בדרך כלל פרופיל אמיתי.", isCorrect: false },
            { text: "אם יש לפרופיל עשרות אלפי עוקבים, הוא כנראה אמיתי.", isCorrect: false }
        ]
    },
    {
        question: "מה תעשה אם אדם שאתה לא מכיר פונה אליך ומבקש מידע אישי?",
        options: [
            { text: "אשלח לו את כל הפרטים שלי, כולל מספר תעודת זהות, סיסמאות לחשבונות, וכל מה שהוא ביקש. למה לא בעצם?", isCorrect: false },
            { text: "לא משתף מידע אישי, חוסם את האדם, ואם צריך - מדווח עליו לרשת החברתית.", isCorrect: true },
            { text: "אשאל אותו למה הוא צריך את המידע ואז אשלח את כל מה שהוא מבקש.", isCorrect: false },
            { text: " מתעלם ממנו ולא עושה כלום.. בטוח כולם חכמים כמוני ברשת, הם גם ישימו לב .", isCorrect: false }
        ]
    },
    {
        question: "מה הסיכונים בפתיחת קישורים לא מוכרים שקיבלת בהודעה או במייל?",
        options: [
            { text: "אין שום בעיה. אפתח הכל, במיוחד אם כתוב 'אתה זכה בפרס! לחץ כאן!' מה יכול להיות רע בזה?", isCorrect: false },
            { text: "הקישור עלול להוביל לאתר מזויף או להורדת וירוס. בודקים את הקישור בכלי כמו VirusTotal או נמנעים לחלוטין.", isCorrect: true },
            { text: "זה בסדר, תמיד אוכל להוריד את הקובץ ולסרוק אותו מאוחר יותר.", isCorrect: false },
            { text: "הקישור בטח בטוח אם הוא נראה כמו משהו שאני מכיר.", isCorrect: false }
        ]
    },
    {
        question: "מה עלול לקרות אם אשתף סיסמאות עם חברים או אשתמש באותה סיסמה לכל האתרים?",
        options: [
            { text: "סיסמאות עלולות להיגנב, ופריצה לשירות אחד עלולה לסכן את כל החשבונות שלי.", isCorrect: true },
            { text: "בסך הכל כולם חברים, נכון? אין שום סיבה לא לשתף סיסמאות.", isCorrect: false },
            { text: "אוכל לשתף סיסמאות עם כל חבר שאני סומך/ת עליו, אין בזה בעיה.", isCorrect: false },
            { text: "אוכל לשתף סיסמאות עם אנשים שאני מכיר/ה דרך עבודה, זה בסדר.", isCorrect: false }
        ]
    },
    {
        question: "מדוע כדאי להימנע משיתוף מידע אישי כמו כתובת, תמונות, או מספר טלפון ברשתות חברתיות?",
        options: [
            { text: "לחלוק הכל עם כולם, זה בדיוק מה שמחבר אותנו כעולם אחד גדול. יותר חברים, יותר טוב!", isCorrect: false },
            { text: "מידע כזה יכול לשמש מתחזים או פושעים לצורך הונאות, גניבה או פגיעה בפרטיות.", isCorrect: true },
            { text: "זה לא משנה אם אשתף את המידע, כל אחד יכול למצוא את זה בכל מקרה.", isCorrect: false },
            { text: " לא צריך לדאוג, כי  בטוח שלא אפול למלכודת.", isCorrect: false }
        ]
    },
    {
        question: "כיצד תוודא שמישהו שאתה מדבר איתו באינטרנט הוא מי שהוא טוען שהוא?",
        options: [
            { text: "אם הוא אומר שהוא סלב, זה בטוח נכון. לא צריך לבדוק שום דבר נוסף, חוץ מההודעה שלו.", isCorrect: false },
            { text: "מבקשים שיחת וידאו, בודקים ברשתות חברתיות אחרות, ולא משתפים מידע רגיש לפני שמוודאים.", isCorrect: true },
            { text: "אם הוא כותב בצורה חיננית או מצחיקה, זה כנראה אמיתי.", isCorrect: false },
            { text: "אולי תוכל לשלוח לו כמה שאלות אישיות ולראות האם יש לכם תחומי עניין.", isCorrect: false }
        ]
    },
    {
        question: "מה תעשה אם קיבלת הודעה שמודיעה שזכית בפרס אך מבקשת פרטים אישיים או תשלום?",
        options: [
            { text: "תשלח להם את כל הפרטים שלך. גם אם זה נשמע מוזר, מי לא רוצה לזכות בפרס, נכון?", isCorrect: false },
            { text: "זו כנראה הונאה. לא משתפים מידע ולא מעבירים כסף. מדווחים על ההודעה.", isCorrect: true },
            { text: "תבדוק אם זה פרס שקשור לחברה שאתה מכיר ואז תשלח את המידע.", isCorrect: false },
            { text: "אם זה משהו שנראה טוב מדי, כדאי להאמין להם ולשלוח את המידע.", isCorrect: false }
        ]
    },
    {
        question: "איך היית מסביר לחבר מהי פישינג ?",
        options: [
            { text: "פישינג הוא ניסיון לגנוב מידע רגיש (כמו סיסמאות) באמצעות הודעות או אתרים שנראים לגיטימיים.", isCorrect: true },
            { text: "פישינג הוא פשוט סוג של דגיגון שנמצא באינטרנט.", isCorrect: false },
            { text: "פישינג הוא דרך להוריד אפליקציות מבלי לשלם.", isCorrect: false },
            { text: "פישינג הוא רק הודעות דואר אלקטרוני עם פרסומות.", isCorrect: false }
        ]
    },
    {
        question: "מה החשיבות של הגדרות פרטיות ברשתות חברתיות?",
        options: [
            { text: "הגדרות פרטיות מגבילות מי יכול לראות את המידע שלך ומקטינות סיכונים לחשיפה לא רצויה.", isCorrect: true },
            { text: "הגדרות פרטיות זה בשביל ה'חלשים'. אני משתף את כל החיים שלי, מה יש להסתיר?", isCorrect: false },
            { text: "הגדרות פרטיות חשובות רק אם אתה מפורסם או סלב.", isCorrect: false },
            { text: "הגדרות פרטיות עוזרות לך לסנן פרסומות שמגיעות אליך.", isCorrect: false }
        ]
    },
    {
        question: "מה תעשה אם מישהו מאיים עליך ברשת או מתנהג באופן פוגעני?",
        options: [
            { text: "תענה לו בחזרה עם אייקונים מצחיקים או תעשה לייק להודעה. אין צורך להכביר במילים.", isCorrect: false },
            { text: "שומרים הוכחות (צילומי מסך), חוסמים את האדם, מדווחים לרשת החברתית ופונים לעזרה אם צריך.", isCorrect: true },
            { text: "תענה לו בהודעות זועמות ותסביר לו למה הוא טועה.", isCorrect: false },
            { text: "תתעלם ממנו ותחכה עד שהוא יעזוב אותך.", isCorrect: false }
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
        message = "עבודה מעולה!! אין ספק שזכית בתואר חכם ברשת";
    } else {
        message = "כדי להבטיח את הביטחות שלך ברשת, כדאי לך לעבור על הלומדה ולשחק מחדש לאחר מכן!";
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