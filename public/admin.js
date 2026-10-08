document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('adminTableBody');
    const refreshBtn = document.getElementById('refreshBtn');
    
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const cancelEdit = document.getElementById('cancelEdit');
    
    let participants = [];

    // Helper to properly display strings
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

    function formatCollege(college) {
        if (college === '4kilo') return '4 kilo (CNCS)';
        if (college === '5kilo') return '5 kilo(CTBE)';
        if (college === '6kilo') return '6 Kilo (Main Campus)';
        return college;
    }

    async function fetchParticipants() {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Loading...</td></tr>`;
        try {
            const response = await fetch('/api/participants');
            if (response.ok) {
                const result = await response.json();
                participants = result.data;
                renderTable();
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading data</td></tr>`;
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Connection error</td></tr>`;
        }
    }

    function renderTable() {
        if (participants.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">No participants found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        participants.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition-colors";
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHTML(p.name)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">${escapeHTML(p.phone)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${escapeHTML(p.gender || 'N/A')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${escapeHTML(p.department || 'N/A')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                        ${escapeHTML(formatCollege(p.college))}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3 edit-btn" data-id="${p.id}">Edit</button>
                    <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${p.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteParticipant(e.target.dataset.id));
        });
    }

    async function deleteParticipant(id) {
        if (!confirm('Are you sure you want to delete this participant?')) return;
        
        try {
            // Support both server.js routing (/api/participants/:id) and Vercel routing (/api/participants?id=X)
            const response = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
            if (!response.ok && response.status === 404) {
                // Try Vercel style query route if /:id failed
                await fetch(`/api/participants?id=${id}`, { method: 'DELETE' });
            }
            fetchParticipants();
        } catch (error) {
            alert('Failed to delete participant');
        }
    }

    function openEditModal(id) {
        const p = participants.find(x => x.id == id);
        if (!p) return;
        
        document.getElementById('editId').value = p.id;
        document.getElementById('editName').value = p.name || '';
        document.getElementById('editPhone').value = p.phone || '';
        document.getElementById('editGender').value = p.gender || 'Male';
        document.getElementById('editDepartment').value = p.department || '';
        document.getElementById('editCollege').value = p.college || '4kilo';
        
        editModal.classList.remove('hidden');
    }

    cancelEdit.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const payload = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            gender: document.getElementById('editGender').value,
            department: document.getElementById('editDepartment').value,
            college: document.getElementById('editCollege').value,
        };

        const submitBtn = editForm.querySelector('button[type="submit"]');
        submitBtn.innerText = 'Saving...';
        submitBtn.disabled = true;

        try {
            let response = await fetch(`/api/participants/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok && response.status === 404) {
                 response = await fetch(`/api/participants?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            if (response.ok) {
                editModal.classList.add('hidden');
                fetchParticipants();
            } else {
                alert('Failed to save changes.');
            }
        } catch (error) {
            alert('Connection error');
        } finally {
            submitBtn.innerText = 'Save Changes';
            submitBtn.disabled = false;
        }
    });

    refreshBtn.addEventListener('click', fetchParticipants);

    // Initial load
    fetchParticipants();
});
