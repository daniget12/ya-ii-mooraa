document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addParticipantForm');
    const tableBody = document.getElementById('participantsTableBody');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const formMessage = document.getElementById('formMessage');

    // Global variable to store participant data for PDF generation
    let participantsData = [];

    // Fetch and display participants on load
    fetchParticipants();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const college = document.getElementById('college').value;
        const gender = document.getElementById('gender').value;
        const department = document.getElementById('department').value;

        // Visual feedback
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Registering...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/participants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, college, gender, department })
            });

            if (response.ok) {
                // Clear form
                form.reset();
                showMessage('Participant added successfully!', 'text-green-600');
                // Refresh list
                fetchParticipants();
            } else {
                const data = await response.json();
                showMessage(`Error: ${data.error}`, 'text-red-600');
            }
        } catch (error) {
            showMessage('Error connecting to the server.', 'text-red-600');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Handle PDF Download
    downloadPdfBtn.addEventListener('click', () => {
        if (participantsData.length === 0) {
            alert('No participants available to download.');
            return;
        }

        // Ensure jsPDF is loaded
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text('Gibi Gubae Participants List', 14, 22);
        
        // Add Date and Total count
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Total Registered: ${participantsData.length}`, 14, 36);

        // Prepare table data
        const tableColumn = ["#", "Name", "Phone Number", "Gender", "Department", "College"];
        const tableRows = [];

        participantsData.forEach((participant, index) => {
            const participantData = [
                index + 1,
                participant.name,
                participant.phone,
                participant.gender || 'N/A',
                participant.department || 'N/A',
                formatCollege(participant.college)
            ];
            tableRows.push(participantData);
        });

        // Generate Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 42,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // Save PDF
        doc.save('gibi_gubae_participants.pdf');
    });

    // Fetch participants from server
    async function fetchParticipants() {
        try {
            const response = await fetch('/api/participants');
            
            if (response.ok) {
                const result = await response.json();
                participantsData = result.data;
                renderTable(participantsData);
            } else {
                tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error loading data from server.</td></tr>`;
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Server offline or connection error.</td></tr>`;
        }
    }

    // Render table rows
    function renderTable(data) {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-gray-500">No participants registered yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        data.forEach((p, index) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition-colors";
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHTML(p.name)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">${escapeHTML(p.phone)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${escapeHTML(p.gender || 'N/A')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${escapeHTML(p.department || 'N/A')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getCollegeBadgeColor(p.college)}">
                        ${escapeHTML(formatCollege(p.college))}
                    </span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Helper functions
    function formatCollege(college) {
        if (college === '4kilo') return '4 kilo (CNCS)';
        if (college === '5kilo') return '5 kilo(CTBE)';
        if (college === '6kilo') return '6 Kilo';
        return college;
    }
    
    function getCollegeBadgeColor(college) {
        if (college === '4kilo') return 'bg-blue-100 text-blue-800';
        if (college === '5kilo') return 'bg-purple-100 text-purple-800';
        if (college === '6kilo') return 'bg-emerald-100 text-emerald-800';
        return 'bg-gray-100 text-gray-800';
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }

    function showMessage(msg, colorClass) {
        formMessage.textContent = msg;
        formMessage.className = `text-sm text-center mt-3 ${colorClass} block animate-fade-in`;
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 4000);
    }
});
