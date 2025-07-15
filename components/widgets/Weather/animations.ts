import gsap from 'gsap';

export function applyWeatherIconAnimation(element: HTMLElement, animationType: 'bounce' | 'spin' | 'fade') {
    switch (animationType) {
        case 'bounce':
            gsap.to(element, { y: -10, duration: 0.5, yoyo: true, repeat: -1 });
            break;
        case 'spin':
            gsap.to(element, { rotation: 360, duration: 2, repeat: -1, ease: 'linear' });
            break;
        case 'fade':
            gsap.to(element, { opacity: 0, duration: 1, yoyo: true, repeat: -1 });
            break;
        default:
            return; // No animation
    }
}