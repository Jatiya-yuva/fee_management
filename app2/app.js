// Initialize Lucide icons
lucide.createIcons();

// Data structure
let members = JSON.parse(localStorage.getItem('school-members')) || [];
let paymentRecords = JSON.parse(localStorage.getItem('school-payments')) || [];
let currentMonthYear = getCurrentMonthYear();
let editingMemberId = null;
let currentFilter = 'all';
let searchTerm = '';
let viewingHistoryFor = null;

// DOM Elements
const memberCountEl = document.getElementById('member-count');
const paidCountEl = document.getElementById('paid-count');
const unpaidCountEl = document.getElementById('unpaid-count');
const paymentPercentageEl = document.getElementById('payment-percentage');
const progressBarEl = document.getElementById('progress-bar');
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const saveMemberBtn = document.getElementById('save-member');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitleEl = document.getElementById('form-title');
const formIconEl = document.getElementById('form-icon');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const membersListEl = document.getElementById('members-list');
const emptyStateEl = document.getElementById('empty-state');
const filteredCountEl = document.getElementById('filtered-count');
const showingCountEl = document.getElementById('showing-count');
const totalCountEl = document.getElementById('total-count');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history');
const historyTitleEl = document.getElementById('history-title');
const historyContentEl = document.getElementById('history-content');

// Initialize the app
function init() {
  updateStats();
  renderMembers();
  updateCurrentMonthDisplay();
  
  // Event listeners
  prevMonthBtn.addEventListener('click', () => changeMonth('prev'));
  nextMonthBtn.addEventListener('click', () => changeMonth('next'));
  saveMemberBtn.addEventListener('click', handleAddMember);
  cancelEditBtn.addEventListener('click', cancelEditing);
  searchInput.addEventListener('input', handleSearch);
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
  });
  closeHistoryBtn.addEventListener('click', closeHistoryModal);
}

// Helper functions
function getCurrentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(monthYear) {
  const [year, month] = monthYear.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function getPaymentStatus(memberId) {
  const record = paymentRecords.find(
    r => r.memberId === memberId && r.monthYear === currentMonthYear
  );
  return record ? record.paid : false;
}

function getPaymentHistory(memberId) {
  return paymentRecords
    .filter(r => r.memberId === memberId)
    .sort((a, b) => b.monthYear.localeCompare(a.monthYear));
}

// Data functions
function updateStats() {
  const paidCount = members.filter(m => getPaymentStatus(m.id)).length;
  const unpaidCount = members.length - paidCount;
  const paymentPercentage = members.length > 0 ? Math.round((paidCount / members.length) * 100) : 0;

  memberCountEl.textContent = members.length;
  paidCountEl.textContent = paidCount;
  unpaidCountEl.textContent = unpaidCount;
  paymentPercentageEl.textContent = `${paymentPercentage}%`;
  progressBarEl.style.width = `${paymentPercentage}%`;
}

function saveData() {
  localStorage.setItem('school-members', JSON.stringify(members));
  localStorage.setItem('school-payments', JSON.stringify(paymentRecords));
}

// UI functions
function updateCurrentMonthDisplay() {
  currentMonthEl.textContent = formatMonthYear(currentMonthYear);
}

function renderMembers() {
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         member.phone.includes(searchTerm);
    const isPaid = getPaymentStatus(member.id);
    
    switch (currentFilter) {
      case 'paid': return matchesSearch && isPaid;
      case 'unpaid': return matchesSearch && !isPaid;
      default: return matchesSearch;
    }
  });

  if (filteredMembers.length === 0) {
    emptyStateEl.classList.remove('hidden');
    membersListEl.innerHTML = '';
    membersListEl.appendChild(emptyStateEl);
  } else {
    emptyStateEl.classList.add('hidden');
    membersListEl.innerHTML = '';
    
    filteredMembers.forEach(member => {
      const isPaid = getPaymentStatus(member.id);
      const paymentHistory = getPaymentHistory(member.id);
      
      const memberEl = document.createElement('div');
      memberEl.className = 'p-4 hover:bg-indigo-50 transition-colors';
      memberEl.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium flex items-center gap-2">
              <i data-lucide="user" class="h-4 w-4 text-indigo-600"></i>
              ${member.name}
            </p>
            <p class="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <i data-lucide="phone" class="h-3 w-3"></i>
              ${member.phone}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="flex gap-2">
              <button
                data-member-id="${member.id}"
                class="toggle-fee ${isPaid ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700'} px-3 py-1 rounded-md text-sm font-medium flex items-center"
              >
                <i data-lucide="${isPaid ? 'check' : 'x'}" class="h-4 w-4 mr-1"></i>
                ${isPaid ? 'Paid' : 'Pending'}
              </button>
              <button
                data-member-id="${member.id}"
                class="whatsapp-btn border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md text-sm font-medium"
              >
                <i data-lucide="message-square" class="h-4 w-4"></i>
              </button>
              ${paymentHistory.length > 0 ? `
                <button
                  data-member-id="${member.id}"
                  class="history-btn border border-purple-200 text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-md text-sm font-medium"
                >
                  <i data-lucide="history" class="h-4 w-4"></i>
                </button>
              ` : ''}
            </div>
            <div class="flex gap-2">
              <button
                data-member-id="${member.id}"
                class="edit-btn border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-sm font-medium flex items-center"
              >
                <i data-lucide="edit" class="h-4 w-4 mr-1"></i> Edit
              </button>
              <button
                data-member-id="${member.id}"
                class="delete-btn border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium flex items-center"
              >
                <i data-lucide="trash-2" class="h-4 w-4 mr-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
      membersListEl.appendChild(memberEl);
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.toggle-fee').forEach(btn => {
      btn.addEventListener('click', (e) => {
        toggleFeeStatus(e.target.closest('button').dataset.memberId);
      });
    });

    document.querySelectorAll('.whatsapp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const memberId = e.target.closest('button').dataset.memberId;
        const member = members.find(m => m.id === memberId);
        sendWhatsAppMessage(member.phone, getPaymentStatus(memberId));
      });
    });

    document.querySelectorAll('.history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const memberId = e.target.closest('button').dataset.memberId;
        viewHistory(memberId);
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const memberId = e.target.closest('button').dataset.memberId;
        startEditing(memberId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const memberId = e.target.closest('button').dataset.memberId;
        deleteMember(memberId);
      });
    });
  }

  filteredCountEl.textContent = filteredMembers.length;
  showingCountEl.textContent = filteredMembers.length;
  totalCountEl.textContent = members.length;
  
  // Refresh icons
  lucide.createIcons();
}

function viewHistory(memberId) {
  const member = members.find(m => m.id === memberId);
  viewingHistoryFor = member;
  historyTitleEl.textContent = `Payment History for ${member.name}`;
  
  const history = getPaymentHistory(memberId);
  historyContentEl.innerHTML = '';
  
  if (history.length === 0) {
    historyContentEl.innerHTML = '<p class="text-gray-500 text-center py-4">No payment history found</p>';
  } else {
    history.forEach(record => {
      const recordEl = document.createElement('div');
      recordEl.className = 'flex justify-between items-center p-3 border rounded-lg hover:bg-indigo-50';
      recordEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full ${record.paid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
            <i data-lucide="${record.paid ? 'check' : 'x'}" class="h-4 w-4"></i>
          </div>
          <div>
            <p class="font-medium">${formatMonthYear(record.monthYear)}</p>
            <p class="text-sm text-gray-500">
              ${formatDate(record.dateUpdated)}
            </p>
          </div>
        </div>
        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${record.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${record.paid ? 'Paid' : 'Pending'}
        </span>
      `;
      historyContentEl.appendChild(recordEl);
    });
  }
  
  historyModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeHistoryModal() {
  historyModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  viewingHistoryFor = null;
}

// Event handlers
function handleAddMember() {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  if (members.length >= 250) {
    alert('Maximum number of members (250) reached. Cannot add more.');
    return;
  }

  if (!name || !phone) {
    alert('Please enter both name and phone number');
    return;
  }

  if (members.some(m => m.phone === phone && m.id !== editingMemberId)) {
    alert('A member with this phone number already exists');
    return;
  }

  if (editingMemberId) {
    // Update existing member
    members = members.map(member => 
      member.id === editingMemberId 
        ? { ...member, name, phone }
        : member
    );
    cancelEditing();
  } else {
    // Add new member
    const member = {
      id: Date.now().toString(),
      name,
      phone,
      active: true
    };
    members.push(member);
    nameInput.value = '';
    phoneInput.value = '';
  }

  saveData();
  updateStats();
  renderMembers();
}

function toggleFeeStatus(memberId) {
  const existingIndex = paymentRecords.findIndex(
    r => r.memberId === memberId && r.monthYear === currentMonthYear
  );

  if (existingIndex >= 0) {
    paymentRecords[existingIndex] = { 
      ...paymentRecords[existingIndex], 
      paid: !paymentRecords[existingIndex].paid,
      dateUpdated: new Date().toISOString()
    };
  } else {
    paymentRecords.push({
      id: Date.now().toString(),
      memberId,
      monthYear: currentMonthYear,
      paid: true,
      dateUpdated: new Date().toISOString(),
    });
  }

  saveData();
  updateStats();
  renderMembers();
}

function sendWhatsAppMessage(phone, paid) {
  const message = paid 
    ? `Hello, the fees for ${formatMonthYear(currentMonthYear)} have been paid. Thank you!` 
    : `Reminder: The fees for ${formatMonthYear(currentMonthYear)} are still pending. Please make the payment soon.`;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

function changeMonth(direction) {
  const [year, month] = currentMonthYear.split('-').map(Number);
  let newYear = year;
  let newMonth = month;
  
  if (direction === 'prev') {
    newMonth = month === 1 ? 12 : month - 1;
    newYear = month === 1 ? year - 1 : year;
  } else {
    newMonth = month === 12 ? 1 : month + 1;
    newYear = month === 12 ? year + 1 : year;
  }
  
  currentMonthYear = `${newYear}-${String(newMonth).padStart(2, '0')}`;
  updateCurrentMonthDisplay();
  updateStats();
  renderMembers();
}

function deleteMember(memberId) {
  if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
    members = members.filter(member => member.id !== memberId);
    paymentRecords = paymentRecords.filter(record => record.memberId !== memberId);
    saveData();
    updateStats();
    renderMembers();
  }
}

function startEditing(memberId) {
  const member = members.find(m => m.id === memberId);
  if (member) {
    editingMemberId = memberId;
    nameInput.value = member.name;
    phoneInput.value = member.phone;
    formTitleEl.textContent = 'Edit Student';
    formIconEl.setAttribute('data-lucide', 'edit');
    cancelEditBtn.classList.remove('hidden');
    saveMemberBtn.innerHTML = '<i data-lucide="check" class="h-4 w-4 mr-2"></i> Save Changes';
    lucide.createIcons();
  }
}

function cancelEditing() {
  editingMemberId = null;
  nameInput.value = '';
  phoneInput.value = '';
  formTitleEl.textContent = 'Add New Student';
  formIconEl.setAttribute('data-lucide', 'plus');
  cancelEditBtn.classList.add('hidden');
  saveMemberBtn.innerHTML = '<i data-lucide="plus" class="h-4 w-4 mr-2"></i> Add Student';
  lucide.createIcons();
}

function handleSearch(e) {
  searchTerm = e.target.value.toLowerCase();
  renderMembers();
}

function handleFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('bg-indigo-600', 'text-white');
      btn.classList.remove('bg-gray-100', 'text-gray-700');
    } else {
      btn.classList.remove('bg-indigo-600', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    }
  });
  renderMembers();
}

// Initialize the app
init();