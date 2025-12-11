// API Base URL
const API_BASE = '/api/v1/admin';

// State
let data = {
    stats: null,
    pendingHospitals: [],
    verifiedHospitals: [],
    pendingBloodBanks: [],
    verifiedBloodBanks: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// Load all data
async function loadData() {
    showLoading(true);
    try {
        await Promise.all([
            loadStats(),
            loadPendingHospitals(),
            loadVerifiedHospitals(),
            loadPendingBloodBanks(),
            loadVerifiedBloodBanks()
        ]);
        showToast('Data loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    } finally {
        showLoading(false);
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();
        data.stats = stats;
        updateStatsUI(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load pending hospitals
async function loadPendingHospitals() {
    try {
        const response = await fetch(`${API_BASE}/hospitals/pending`);
        const result = await response.json();
        data.pendingHospitals = result.hospitals || [];
        renderHospitals('pending-hospitals-list', data.pendingHospitals, true);
        updateTabBadge('tab-badge-ph', result.count || 0);
    } catch (error) {
        console.error('Error loading pending hospitals:', error);
    }
}

// Load verified hospitals
async function loadVerifiedHospitals() {
    try {
        const response = await fetch(`${API_BASE}/hospitals/verified`);
        const result = await response.json();
        data.verifiedHospitals = result.hospitals || [];
        renderHospitals('verified-hospitals-list', data.verifiedHospitals, false);
    } catch (error) {
        console.error('Error loading verified hospitals:', error);
    }
}

// Load pending blood banks
async function loadPendingBloodBanks() {
    try {
        const response = await fetch(`${API_BASE}/blood-banks/pending`);
        const result = await response.json();
        data.pendingBloodBanks = result.bloodBanks || [];
        renderBloodBanks('pending-bloodbanks-list', data.pendingBloodBanks, true);
        updateTabBadge('tab-badge-pb', result.count || 0);
    } catch (error) {
        console.error('Error loading pending blood banks:', error);
    }
}

// Load verified blood banks
async function loadVerifiedBloodBanks() {
    try {
        const response = await fetch(`${API_BASE}/blood-banks/verified`);
        const result = await response.json();
        data.verifiedBloodBanks = result.bloodBanks || [];
        renderBloodBanks('verified-bloodbanks-list', data.verifiedBloodBanks, false);
    } catch (error) {
        console.error('Error loading verified blood banks:', error);
    }
}

// Update stats UI
function updateStatsUI(stats) {
    document.getElementById('hospitals-pending').textContent = stats.hospitals.pending;
    document.getElementById('hospitals-verified').textContent = stats.hospitals.verified;
    document.getElementById('hospitals-total').textContent = stats.hospitals.total;

    document.getElementById('bloodbanks-pending').textContent = stats.bloodBanks.pending;
    document.getElementById('bloodbanks-verified').textContent = stats.bloodBanks.verified;
    document.getElementById('bloodbanks-total').textContent = stats.bloodBanks.total;
}

// Update tab badge
function updateTabBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.textContent = count;
    }
}

// Render hospitals
function renderHospitals(containerId, hospitals, showActions) {
    const container = document.getElementById(containerId);

    if (hospitals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏥</div>
                <p class="empty-state-text">No hospitals found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = hospitals.map(hospital => `
        <div class="facility-card">
            <div class="facility-header">
                <div>
                    <h3 class="facility-name">${hospital.hospitalName}</h3>
                    <p class="facility-type">${formatHospitalType(hospital.hospitalType)}</p>
                </div>
                <span class="status-badge ${hospital.verificationStatus}">${hospital.verificationStatus}</span>
            </div>
            
            <div class="facility-details">
                <div class="detail-row">
                    <span class="detail-icon">📧</span>
                    <div class="detail-content">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${hospital.email}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📞</span>
                    <div class="detail-content">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${hospital.phoneNumber}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <div class="detail-content">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">${hospital.address}, ${hospital.city}, ${hospital.district}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">🆔</span>
                    <div class="detail-content">
                        <div class="detail-label">Registration ID</div>
                        <div class="detail-value">${hospital.hospitalRegistrationId}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">👤</span>
                    <div class="detail-content">
                        <div class="detail-label">Contact Person</div>
                        <div class="detail-value">${hospital.contactPerson}</div>
                    </div>
                </div>
            </div>
            
            <div class="facility-features">
                ${hospital.bloodBankFacility ? '<span class="feature-tag">🏛️ Blood Bank Facility</span>' : ''}
                ${hospital.emergencyService24x7 ? '<span class="feature-tag">🚨 24x7 Emergency</span>' : ''}
            </div>
            
            ${showActions ? `
                <div class="facility-actions">
                    <button class="btn btn-approve" onclick="verifyHospital('${hospital._id}')">
                        <span>✓</span>
                        <span>Approve</span>
                    </button>
                    <button class="btn btn-reject" onclick="rejectHospital('${hospital._id}')">
                        <span>✗</span>
                        <span>Reject</span>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Render blood banks
function renderBloodBanks(containerId, bloodBanks, showActions) {
    const container = document.getElementById(containerId);

    if (bloodBanks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏛️</div>
                <p class="empty-state-text">No blood banks found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = bloodBanks.map(bank => `
        <div class="facility-card">
            <div class="facility-header">
                <div>
                    <h3 class="facility-name">${bank.bloodBankName}</h3>
                    <p class="facility-type">Blood Bank</p>
                </div>
                <span class="status-badge ${bank.verificationStatus}">${bank.verificationStatus}</span>
            </div>
            
            <div class="facility-details">
                <div class="detail-row">
                    <span class="detail-icon">📧</span>
                    <div class="detail-content">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${bank.email}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📞</span>
                    <div class="detail-content">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${bank.phoneNumber}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <div class="detail-content">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">${bank.fullAddress}, ${bank.city}, ${bank.district}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">🆔</span>
                    <div class="detail-content">
                        <div class="detail-label">Registration Number</div>
                        <div class="detail-value">${bank.registrationNumber}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">👤</span>
                    <div class="detail-content">
                        <div class="detail-label">Contact Person</div>
                        <div class="detail-value">${bank.contactPerson} (${bank.designation})</div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📦</span>
                    <div class="detail-content">
                        <div class="detail-label">Storage Capacity</div>
                        <div class="detail-value">${bank.storageCapacity} units</div>
                    </div>
                </div>
            </div>
            
            <div class="facility-features">
                ${bank.emergencyService24x7 ? '<span class="feature-tag">🚨 24x7 Emergency</span>' : ''}
                ${bank.componentSeparation ? '<span class="feature-tag">🧪 Component Separation</span>' : ''}
                ${bank.apheresisService ? '<span class="feature-tag">💉 Apheresis Service</span>' : ''}
            </div>
            
            ${showActions ? `
                <div class="facility-actions">
                    <button class="btn btn-approve" onclick="verifyBloodBank('${bank._id}')">
                        <span>✓</span>
                        <span>Approve</span>
                    </button>
                    <button class="btn btn-reject" onclick="rejectBloodBank('${bank._id}')">
                        <span>✗</span>
                        <span>Reject</span>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Verify hospital
async function verifyHospital(id) {
    if (!confirm('Are you sure you want to approve this hospital?')) return;

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/hospitals/${id}/verify`, {
            method: 'PUT'
        });

        if (response.ok) {
            showToast('Hospital verified successfully', 'success');
            await loadData();
        } else {
            throw new Error('Failed to verify hospital');
        }
    } catch (error) {
        console.error('Error verifying hospital:', error);
        showToast('Failed to verify hospital', 'error');
    } finally {
        showLoading(false);
    }
}

// Reject hospital
async function rejectHospital(id) {
    const reason = prompt('Please enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/hospitals/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        if (response.ok) {
            showToast('Hospital rejected', 'success');
            await loadData();
        } else {
            throw new Error('Failed to reject hospital');
        }
    } catch (error) {
        console.error('Error rejecting hospital:', error);
        showToast('Failed to reject hospital', 'error');
    } finally {
        showLoading(false);
    }
}

// Verify blood bank
async function verifyBloodBank(id) {
    if (!confirm('Are you sure you want to approve this blood bank?')) return;

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/blood-banks/${id}/verify`, {
            method: 'PUT'
        });

        if (response.ok) {
            showToast('Blood bank verified successfully', 'success');
            await loadData();
        } else {
            throw new Error('Failed to verify blood bank');
        }
    } catch (error) {
        console.error('Error verifying blood bank:', error);
        showToast('Failed to verify blood bank', 'error');
    } finally {
        showLoading(false);
    }
}

// Reject blood bank
async function rejectBloodBank(id) {
    const reason = prompt('Please enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/blood-banks/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        if (response.ok) {
            showToast('Blood bank rejected', 'success');
            await loadData();
        } else {
            throw new Error('Failed to reject blood bank');
        }
    } catch (error) {
        console.error('Error rejecting blood bank:', error);
        showToast('Failed to reject blood bank', 'error');
    } finally {
        showLoading(false);
    }
}

// Switch tab
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.closest('.tab').classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// Show loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '✗'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Format hospital type
function formatHospitalType(type) {
    const types = {
        'government': 'Government Hospital',
        'private': 'Private Hospital',
        'teaching': 'Teaching Hospital',
        'community': 'Community Hospital'
    };
    return types[type] || type;
}
