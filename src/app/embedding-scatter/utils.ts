// If you are using DOM types (like Image, Blob), ensure TypeScript recognizes them. If not, you may need to set "dom" in the "lib" compiler option in your tsconfig.json

// export function saveAsPng(scatterplot: any): void { // You might want to replace 'any' with the appropriate type
//     const imageObject = new Image();
//     imageObject.onload = () => {
//         scatterplot.get('canvas').toBlob((blob: Blob) => {
//             downloadBlob(blob, 'scatter.png');
//         });
//     };
//     imageObject.src = scatterplot.get('canvas').toDataURL();
// }

export function closeModal(): void {
    const modal = document.querySelector('#modal') as HTMLElement;
    const modalText = document.querySelector('#modal-text') as HTMLElement;
    if (modal && modalText) {
        modal.style.display = 'none';
        modalText.textContent = '';
    }
}

export function showModal(text: string, isError: boolean, isClosable: boolean): void {
    const modal = document.querySelector('#modal') as HTMLElement;
    const modalText = document.querySelector('#modal-text') as HTMLElement;
    const modalClose = document.querySelector('#modal-close') as HTMLElement;
    if (modal && modalText && modalClose) {
        modal.style.display = 'flex';
        modalText.style.color = isError ? '#cc79A7' : '#bbb';
        modalText.textContent = text;
        console.log("isClosable")
        if (isClosable) {
            modalClose.style.display = 'block';
            modalClose.style.background = isError ? '#cc79A7' : '#bbb';
            modalClose.addEventListener('click', closeModal, { once: true });
        } else {
            modalClose.style.display = 'none';
        }
    }
}

export function checkSupport(scatterplot: any): void { // You might want to replace 'any' with the appropriate type
    if (!scatterplot.isSupported) {
        showModal(
            'Your browser does not support all necessary WebGL features. The scatter plot might not render properly.',
            true,
            true
        );
    }
    // console.log("checkSupport")
}

// Assuming that downloadBlob function is defined somewhere, or imported.
