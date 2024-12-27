let clickCount = 0;

function updateClickCount() {
    const countDisplay = document.getElementById('clickCount');
    countDisplay.textContent = clickCount;
}

function incrementCount() {
    clickCount++;
    updateClickCount();
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('clickButton');
    button.addEventListener('click', incrementCount);
    updateClickCount();
});