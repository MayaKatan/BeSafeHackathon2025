let flippedCards = []; // מאחסן את הכרטיסים המהפכים
let locked = false; // מונע את הבחירה בכרטיס נוסף אם יש זוגות פתוחים

// פונקציה להפוך את הכרטיס
function flipCard(card) {
    if (locked || card.classList.contains('flipped')) return; // אם הכרטיס כבר הפוך או שהמשחק נעול, אל תעשה כלום
    card.querySelector('.card-inner').classList.add('flipped');
    flippedCards.push(card);

    // אם יש שני כרטיסים הפוכים, השווה ביניהם
    if (flippedCards.length === 2) {
        locked = true; // מנע לחיצה על כרטיסים נוספים בזמן השוואה
        setTimeout(checkMatch, 1000); // בדוק אם יש התאמה אחרי 1 שניה
    }
}

// פונקציה להשוות בין שני כרטיסים
function checkMatch() {
    const [card1, card2] = flippedCards;

    // אם הכרטיסים תואמים (אותו "id"), הסר אותם
    if (card1.dataset.id === card2.dataset.id) {
        card1.style.visibility = 'hidden';
        card2.style.visibility = 'hidden';
    } else {
        // אם הכרטיסים לא תואמים, הפוך אותם חזרה
        card1.querySelector('.card-inner').classList.remove('flipped');
        card2.querySelector('.card-inner').classList.remove('flipped');
    }

    // אפס את רשימת הכרטיסים המהפכים ופתח את המשחק מחדש
    flippedCards = [];
    locked = false;


    // Add event listeners to all cards
    document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
    card.addEventListener('click', () => flipCard(card));
    });
});
}
