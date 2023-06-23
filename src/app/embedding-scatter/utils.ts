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

// function to darken a color
export function darkenColor(color: string, amount: number): string {
    const num = parseInt(color.replace("#",""), 16),
          amt = Math.round(2.55 * amount),
          R = (num >> 16) - amt,
          B = ((num >> 8) & 0x00FF) - amt,
          G = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
}

// function to lighten a color
export function lightenColor(color: string, amount: number): string {
    const num = parseInt(color.replace("#",""), 16),
          amt = Math.round(2.55 * amount),
          R = (num >> 16) + amt,
          B = ((num >> 8) & 0x00FF) + amt,
          G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
}

// function to draw a point with border
export function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, thickness: number): void {
    const lighterColor = lightenColor(color, 30);  // lighten by 20 units
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);  // Draw the point as a circle with given radius
    ctx.fillStyle = lighterColor;
    ctx.fill();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = lightenColor(color, 10);
    ctx.stroke();
}




// Assuming that downloadBlob function is defined somewhere, or imported.
