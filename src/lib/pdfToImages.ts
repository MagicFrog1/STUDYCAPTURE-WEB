export async function pdfFileToImages(file: File, maxPages = 5, scale = 1.5): Promise<File[]> {
	// Sólo en cliente
	if (typeof window === "undefined") return [];

	// Cargamos pdfjs (ESM) y configuramos el worker para evitar el error
	// "No GlobalWorkerOptions.workerSrc specified."
	const pdfjs = (await import("pdfjs-dist")) as any;
	const { getDocument, GlobalWorkerOptions, version } = pdfjs;

	// Si no hay worker configurado, usamos el worker oficial servido desde un CDN
	// Esto evita el error "No GlobalWorkerOptions.workerSrc specified."
	if (!GlobalWorkerOptions.workerSrc) {
		GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
	}

	const data = await file.arrayBuffer();
	const loadingTask = getDocument({ data });

	const pdf = await loadingTask.promise;
	const pageCount = Math.min(pdf.numPages, maxPages);
	const imageFiles: File[] = [];

	for (let i = 1; i <= pageCount; i++) {
		const page = await pdf.getPage(i);
		const viewport = page.getViewport({ scale });
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) continue;
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		await page.render({ canvasContext: ctx as any, viewport } as any).promise;

		const blob: Blob = await new Promise((resolve, reject) => {
			canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo convertir canvas a blob"))), "image/jpeg", 0.92);
		});
		const imgFile = new File([blob], `${file.name.replace(/\.pdf$/i, "")}-p${i}.jpg`, { type: "image/jpeg" });
		imageFiles.push(imgFile);
	}

	return imageFiles;
}

