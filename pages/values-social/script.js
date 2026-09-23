document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof window.loadActivities === 'function') {
      window.loadActivities();
    }
  }, 300);
});
