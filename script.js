let apiData = null;
let externalStats = null;
let currentPage = 1;

function timeline() {
    fetch('https://maganghub.kemnaker.go.id/be/v1/api/timeline')
        .then(res => res.json())
        .then(data => {
            let heading = document.getElementById("heading");
            heading.textContent = `Info Maganghub ${data.data.timeline.name}`
            const jadwal = data.data.timeline.schedules;
            const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
            function formatDate(s) {
                const [datePart, timePart] = (s || "").split(" ");
                const [y, m, d] = datePart.split("-");
                return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
            }

            let jadwalContainer = document.getElementById("jadwalContainer");
            const total = jadwal.length;
            const connectorWidth = 40; // px width for the connector between items
            const connectorTotal = Math.max(0, (total - 1) * connectorWidth);

            jadwal.forEach((item, idx) => {
                const itemWidth = `calc((100% - ${connectorTotal}px) / ${total})`;
                jadwalContainer.innerHTML += `
                    <li class="list-group-item border-0 d-flex flex-column align-items-center text-center" role="listitem"
                        style="flex: 0 0 ${itemWidth}; max-width: ${itemWidth};">
                        <span class="badge bg-primary rounded-circle p-3 mb-2" aria-hidden="true"></span>
                        <h6 class="mb-1">${item.title}</h6>
                        <small class="text-muted">${formatDate(item.started_at)} - ${formatDate(item.finished_at)}</small>
                    </li>
                    ${idx !== total - 1
                        ? `<li class="list-group-item border-0 d-flex align-items-center justify-content-center" aria-hidden="true"
                                style="flex: 0 0 ${connectorWidth}px; max-width: ${connectorWidth}px;">
                                <div class="w-100 border-top"></div>
                            </li>`
                        : ``}
                `;
            });
        })
};

timeline();

function statFrontPage() {
    fetch('https://maganghub.kemnaker.go.id/be/v1/api/statistik_front_page')
        .then(res => res.json())
        .then(data => {
            externalStats = data
            updateStats(externalStats);
        });
};



function formatNumber(n) {
    return (typeof n === "number") ? n.toLocaleString("id-ID") : n;
}

function updateStats(payload) {
    const d = payload && payload.data ? payload.data : {};

    const elPelamar = document.getElementById("jumlahPelamar");
    const elPerusahaan = document.getElementById("jumlahPerusahaan");
    const elLowongan = document.getElementById("jumlahLowongan");

    if (elPelamar) elPelamar.textContent = formatNumber(d["Jumlah Pelamar"] ?? "—");
    if (elPerusahaan) elPerusahaan.textContent = formatNumber(d["Jumlah Perusahaan"] ?? "—");
    if (elLowongan) elLowongan.textContent = formatNumber(d["Jumlah Lowongan"] ?? "—");

    // Create an extra row to show the remaining stats
    const container = document.querySelector(".container");
    if (!container) return;

    const extraKeys = [
        "Jumlah Lowongan Terverifikasi",
        "Jumlah Pendaftar Magang",
        "Jumlah Peserta Magang"
    ];

    // Avoid adding duplicates if the script runs multiple times
    if (document.getElementById("extra-stats-row")) {
        extraKeys.forEach(key => {
            const valEl = document.querySelector(`#extra-stats-row .stat-box[data-key="${key}"] .stat-value`);
            if (valEl) valEl.textContent = formatNumber(d[key] ?? "—");
        });
        return;
    }

    const extraRow = document.createElement("div");
    extraRow.className = "row mt-3";
    extraRow.id = "extra-stats-row";

    extraKeys.forEach(key => {
        const col = document.createElement("div");
        col.className = "col-md-4";

        const box = document.createElement("div");
        box.className = "stat-box";
        box.setAttribute("data-key", key);

        const title = document.createElement("div");
        title.className = "stat-title";
        title.textContent = key;

        const value = document.createElement("div");
        value.className = "stat-value";
        value.textContent = formatNumber(d[key] ?? "—");

        box.appendChild(title);
        box.appendChild(value);
        col.appendChild(box);
        extraRow.appendChild(col);
    });

    // Insert extra row after the first stats row (assumes first .row contains the original stats)
    const firstRow = container.querySelector(".row");
    if (firstRow && firstRow.parentNode) {
        firstRow.parentNode.insertBefore(extraRow, firstRow.nextSibling);
    } else {
        container.appendChild(extraRow);
    }
}

statFrontPage();

function fetchData(page = 1) {
    currentPage = page;
    const url = `https://maganghub.kemnaker.go.id/be/v1/api/list/vacancies-aktif?order_by=created_at&order_direction=desc&page=${page}&limit=20&kode_provinsi=35`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            apiData = data;
            displayJobListings(apiData);
            const totalPages = (apiData && apiData.meta && apiData.meta.pagination && apiData.meta.pagination.last_page) ? apiData.meta.pagination.last_page : 1;
            setupPagination(totalPages, currentPage);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
    });
}

fetchData();


function displayJobListings(data) {
    const apiDataDiv = document.getElementById("apiData");
    apiDataDiv.innerHTML = "";
    
    if (!data.data.length) {
        apiDataDiv.innerHTML = `<div class="alert alert-secondary">Tidak ada lowongan yang sesuai.</div>`;
        return;
    }

    // Group items into rows with 2 columns each
    let currentRow = null;
    data.data.forEach((job, idx) => {
        if (idx % 2 === 0) {
            currentRow = document.createElement("div");
            currentRow.className = "row";
            apiDataDiv.appendChild(currentRow);
        }

        const col = document.createElement("div");
        col.className = "col-md-6";

        const jobCard = document.createElement("div");
        jobCard.classList.add("job-card");

        const programStudiArray = JSON.parse(job.program_studi || "[]");
        const vacancyUrl = 'https://maganghub.kemnaker.go.id/lowongan/view/' + job.id_posisi;

        jobCard.innerHTML = `
            <h5>${job.posisi}</h5>
            <div class="company-name">${job.perusahaan?.nama_perusahaan || "—"}</div>
            <div class="job-info">
                <strong>Alamat:</strong> ${job.perusahaan?.alamat || "—"} <br>
                <strong>Jumlah Pelamar:</strong> ${job.jumlah_terdaftar ?? "—"} <br>
                <strong>Jumlah Kebutuhan:</strong> ${job.jumlah_kuota ?? "—"} <br>
                <strong>Program Studi:</strong> ${programStudiArray.map(ps => ps.title).join(", ") || "—"} <br>
                <strong>Status:</strong> ${job.ref_status_posisi?.nama_status_posisi || "—"} <br>
                <strong>Dibuat tanggal:</strong> ${job.created_at || "—"}
            </div>
            <div class="mt-3">
                ${vacancyUrl 
                    ? `<a href="${vacancyUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Lihat Lowongan</a>` 
                    : `<button class="btn btn-sm btn-secondary" disabled>Tidak ada link</button>`}
            </div>
        `;
        col.appendChild(jobCard);
        currentRow.appendChild(col);
    });
}

function setupPagination(totalPages, current = 1) {
    const paginationElement = document.getElementById("pagination");
    paginationElement.innerHTML = "";

    // Helper to create page item
    function createPageItem(page, text = null, disabled = false, active = false) {
        const li = document.createElement("li");
        li.classList.add("page-item");
        if (disabled) li.classList.add("disabled");
        if (active) li.classList.add("active");
        const a = document.createElement("a");
        a.classList.add("page-link");
        a.href = "#";
        a.textContent = text === null ? String(page) : text;
        a.addEventListener("click", (e) => {
            e.preventDefault();
            if (disabled || active) return;
            fetchData(page);
        });
        li.appendChild(a);
        return li;
    }

    // Previous Button
    const prevDisabled = current <= 1;
    const prevItem = createPageItem(Math.max(1, current - 1), "«", prevDisabled, false);
    paginationElement.appendChild(prevItem);

    // Determine window of pages to show (max ~7 visible)
    const maxVisible = 7;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    // If there's a gap before start, show first and ellipsis
    if (start > 1) {
        paginationElement.appendChild(createPageItem(1, "1", false, current === 1));
        if (start > 2) {
            const ellipsis = document.createElement("li");
            ellipsis.classList.add("page-item", "disabled");
            ellipsis.innerHTML = `<span class="page-link">…</span>`;
            paginationElement.appendChild(ellipsis);
        }
    }

    // Page number buttons
    for (let i = start; i <= end; i++) {
        const isActive = i === current;
        paginationElement.appendChild(createPageItem(i, null, false, isActive));
    }

    // If there's a gap after end, show ellipsis and last
    if (end < totalPages) {
        if (end < totalPages - 1) {
            const ellipsis = document.createElement("li");
            ellipsis.classList.add("page-item", "disabled");
            ellipsis.innerHTML = `<span class="page-link">…</span>`;
            paginationElement.appendChild(ellipsis);
        }
        paginationElement.appendChild(createPageItem(totalPages, String(totalPages), false, current === totalPages));
    }

    // Next Button
    const nextDisabled = current >= totalPages;
    const nextItem = createPageItem(Math.min(totalPages, current + 1), "»", nextDisabled, false);
    paginationElement.appendChild(nextItem);
}