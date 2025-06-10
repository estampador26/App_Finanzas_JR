// Tu configuración de Firebase REAL Y CORRECTA.
const firebaseConfig = {
    apiKey: "AIzaSyAS0gueh4j4mrgHECmP7LVYxwLNYHucOL4",
    authDomain: "myfinanzasjr-ec294.firebaseapp.com",
    projectId: "myfinanzasjr-ec294",
    storageBucket: "myfinanzasjr-ec294.firebasestorage.app",
    messagingSenderId: "389983903472",
    appId: "1:389983903472:web:2f47a71ee7eacc98932c35"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

let unsubscribeBudgets = null;

// Elementos del DOM
const authButton = document.getElementById('auth-button');
const signOutButton = document.getElementById('sign-out-button');
const userInfoSpan = document.getElementById('user-info');
const mainNav = document.getElementById('main-nav');
const appContent = document.getElementById('app-content');
const navButtons = document.querySelectorAll('.nav-button');
const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
const debtForm = document.getElementById('debt-form');
const debtsList = document.getElementById('debts-list');
const monthlyIncomeSpan = document.getElementById('monthly-income');
const monthlyExpensesSpan = document.getElementById('monthly-expenses');
const monthlyBalanceSpan = document.getElementById('monthly-balance');
const expensesChartCanvas = document.getElementById('expenses-chart');
const categoryBreakdownDiv = document.getElementById('category-breakdown');
const totalDebtsPendingSpan = document.getElementById('total-debts-pending');
document.getElementById('date').valueAsDate = new Date();

// Elementos del Modal de Edición
const editTransactionModal = document.getElementById('edit-transaction-modal');
const closeButton = editTransactionModal.querySelector('.close-button');
const editTransactionForm = document.getElementById('edit-transaction-form');
const editTransactionId = document.getElementById('edit-transaction-id');
const editAmount = document.getElementById('edit-amount');
const editType = document.getElementById('edit-type');
const editCategory = document.getElementById('edit-category');
const editDescription = document.getElementById('edit-description');

// Elementos para la asignación de deudas
const typeSelect = document.getElementById('type');
const categoryContainer = document.getElementById('category-container');
const categoryInput = document.getElementById('category');
const debtSelectionContainer = document.getElementById('debt-selection-container');
const debtSelector = document.getElementById('debt-selector');

// Elementos para los filtros de historial
const filterMonthSelect = document.getElementById('filter-month');
const filterYearSelect = document.getElementById('filter-year');
const filterCategoryInput = document.getElementById('filter-category');
const applyFiltersButton = document.getElementById('apply-filters-button');
const clearFiltersButton = document.getElementById('clear-filters-button');

// Elementos para la gestión de Presupuestos
const budgetForm = document.getElementById('budget-form');
const budgetCategoryInput = document.getElementById('budget-category');
const budgetAmountInput = document.getElementById('budget-amount');
const budgetIdInput = document.getElementById('budget-id');
const budgetsList = document.getElementById('budgets-list');
const cancelBudgetEditButton = document.getElementById('cancel-budget-edit');

// Elementos para la gestión de Pagos Programados (NUEVO)
const recurringPaymentForm = document.getElementById('recurring-payment-form');
const recurringIdInput = document.getElementById('recurring-id');
const recurringNameInput = document.getElementById('recurring-name');
const recurringAmountInput = document.getElementById('recurring-amount');
const recurringCategoryInput = document.getElementById('recurring-category');
const recurringDayInput = document.getElementById('recurring-day');
const recurringTypeSelect = document.getElementById('recurring-type');
const recurringInstallmentsContainer = document.getElementById('recurring-installments-container');
const recurringTotalInstallmentsInput = document.getElementById('recurring-total-installments');
const cancelRecurringEditButton = document.getElementById('cancel-recurring-edit');
const recurringPaymentsList = document.getElementById('recurring-payments-list');

// Elementos para el progreso de presupuestos en Dashboard
const budgetProgressList = document.getElementById('budget-progress-list');
const noBudgetsMessage = document.getElementById('no-budgets-message');

let expensesChart;

// --- Funciones de Autenticación y UI ---
authButton.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error('Error de autenticación:', error);
        alert('Error al iniciar sesión con Google. Revisa la consola para más detalles.');
    });
});

signOutButton.addEventListener('click', () => {
    auth.signOut().catch((error) => {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Revisa la consola.');
    });
});

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        updateUIForSignedInUser(user);
        loadDebtsForSelector();
        updateFormVisibility();
        loadFilterYears();
    } else {
        currentUser = null;
        updateUIForSignedOutUser();
    }
});

function updateUIForSignedInUser(user) {
    authButton.style.display = 'none';
    signOutButton.style.display = 'inline-block';
    userInfoSpan.style.display = 'inline-block';
    userInfoSpan.textContent = `Bienvenido, ${user.displayName}`;
    mainNav.style.display = 'flex';
    appContent.style.display = 'block';
    showTab('dashboard');
}

function updateUIForSignedOutUser() {
    authButton.style.display = 'inline-block';
    signOutButton.style.display = 'none';
    userInfoSpan.style.display = 'none';
    userInfoSpan.textContent = '';
    mainNav.style.display = 'none';
    appContent.style.display = 'none';
    transactionsList.innerHTML = '';
    debtsList.innerHTML = '';
    budgetsList.innerHTML = '';
    budgetProgressList.innerHTML = '';
    noBudgetsMessage.style.display = 'none';
    resetDashboard();
    if (unsubscribeBudgets) {
        unsubscribeBudgets();
        unsubscribeBudgets = null;
    }
}

function resetDashboard() {
    monthlyIncomeSpan.textContent = '0';
    monthlyExpensesSpan.textContent = '0';
    monthlyBalanceSpan.textContent = '0';
    categoryBreakdownDiv.innerHTML = '';
    if (totalDebtsPendingSpan) {
        totalDebtsPendingSpan.textContent = '0';
    }
    if (expensesChart) {
        expensesChart.destroy();
    }
}

closeButton.addEventListener('click', () => {
    editTransactionModal.style.display = 'none';
    editTransactionModal.classList.remove('active-modal');
});

window.addEventListener('click', (e) => {
    if (e.target == editTransactionModal) {
        editTransactionModal.style.display = 'none';
        editTransactionModal.classList.remove('active-modal');
    }
});

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        showTab(tab);
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    if (currentUser) {
        switch (tabId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'registro':
                loadTransactions();
                break;
            case 'deudas':
                loadDebts();
                break;
            case 'presupuestos':
                loadBudgets();
                break;
        }
    }
}

typeSelect.addEventListener('change', updateFormVisibility);

function updateFormVisibility() {
    if (typeSelect.value === 'pago_de_deudas') {
        categoryContainer.style.display = 'none';
        categoryInput.removeAttribute('required');
        categoryInput.value = '';
        debtSelectionContainer.style.display = 'block';
        debtSelector.setAttribute('required', 'required');
        loadDebtsForSelector();
    } else {
        categoryContainer.style.display = 'block';
        categoryInput.setAttribute('required', 'required');
        debtSelectionContainer.style.display = 'none';
        debtSelector.removeAttribute('required');
        debtSelector.value = '';
    }
}

async function loadDebtsForSelector() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('debts').get();
        debtSelector.innerHTML = '<option value="">Selecciona una deuda</option>';
        if (snapshot.empty) {
            debtSelector.innerHTML += '<option value="" disabled>No hay deudas registradas</option>';
            return;
        }
        snapshot.forEach(doc => {
            const debt = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${debt.name} (${debt.currentAmount.toFixed(2)}€)`;
            debtSelector.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar deudas para el selector:", error);
    }
}

// --- Lógica para el formulario de Pagos Programados (NUEVO) ---

// --- Lógica para el formulario de Pagos Programados (NUEVO Y MEJORADO) ---

// Verificamos que los elementos del formulario existen antes de añadirles lógica
if (recurringTypeSelect && recurringPaymentForm) {

    // Listener para mostrar/ocultar el campo de cuotas
    recurringTypeSelect.addEventListener('change', () => {
        if (recurringTypeSelect.value === 'Cuotas') {
            recurringInstallmentsContainer.style.display = 'block';
            recurringTotalInstallmentsInput.setAttribute('required', 'required');
        } else {
            recurringInstallmentsContainer.style.display = 'none';
            recurringTotalInstallmentsInput.removeAttribute('required');
        }
    });

    // Listener para guardar un nuevo pago programado
    recurringPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Debes iniciar sesión para guardar un pago.");
            return;
        }

        const name = recurringNameInput.value.trim();
        const amount = parseFloat(recurringAmountInput.value);
        const category = recurringCategoryInput.value.trim();
        const paymentDay = parseInt(recurringDayInput.value);
        const type = recurringTypeSelect.value;

        if (!name || !category || isNaN(amount) || amount <= 0 || isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) {
            alert("Por favor, rellena todos los campos con valores válidos.");
            return;
        }

        const paymentData = {
            name,
            amount,
            category: category.toLowerCase(),
            paymentDay,
            type,
            isActive: true,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Añadimos fecha de creación
        };

        if (type === 'Cuotas') {
            const totalInstallments = parseInt(recurringTotalInstallmentsInput.value);
            if (isNaN(totalInstallments) || totalInstallments <= 0) {
                alert("Por favor, introduce un número total de cuotas válido.");
                return;
            }
            paymentData.totalInstallments = totalInstallments;
            paymentData.paidInstallments = 0;
        }

        try {
            await db.collection('users').doc(currentUser.uid).collection('recurringPayments').add(paymentData);

            alert('¡Pago programado guardado con éxito!');
            recurringPaymentForm.reset();
            recurringTypeSelect.dispatchEvent(new Event('change'));

            // loadRecurringPayments(); // Lo añadiremos más tarde

        } catch (error) {
            console.error("Error al guardar el pago programado:", error);
            alert("Hubo un error al guardar el pago programado. Revisa la consola.");
        }
    });

} else {
    console.warn("Los elementos del formulario de pagos programados no se encontraron en esta página.");
}

// --- Funciones de Gestión de Transacciones (Pestaña Registro) ---
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;
        let category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        const debtSelector = document.getElementById('debt-selector');
        const selectedDebtId = debtSelector.value;
        const dateString = document.getElementById('date').value;

        if (!dateString) {
            alert('Por favor, selecciona una fecha.');
            return;
        }
        const selectedDate = new Date(dateString + 'T00:00:00');
        const transactionTimestamp = firebase.firestore.Timestamp.fromDate(selectedDate);

        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, introduce un monto válido.');
            return;
        }

        if (type === 'pago_de_deudas') {
            if (!selectedDebtId) {
                alert('Por favor, selecciona la deuda a la que se aplica este pago.');
                return;
            }
            const selectedDebtName = debtSelector.options[debtSelector.selectedIndex].text.split('(')[0].trim();
            category = `Pago de Deudas (${selectedDebtName})`;
        }

        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            if (type === 'pago_de_deudas') {
                const debtRef = db.collection('users').doc(userId).collection('debts').doc(selectedDebtId);
                await db.runTransaction(async (transaction) => {
                    const debtDoc = await transaction.get(debtRef);
                    if (!debtDoc.exists) throw "La deuda seleccionada no existe!";
                    const newAmount = debtDoc.data().currentAmount - amount;
                    transaction.update(debtRef, { currentAmount: newAmount < 0 ? 0 : newAmount });
                });
            }

            const transactionsRef = db.collection('users').doc(userId).collection('transactions');
            const transactionData = {
                amount,
                type,
                category: category.toLowerCase(),
                description,
                createdAt: transactionTimestamp,
                userId,
                ...(type === 'pago_de_deudas' && { debtId: selectedDebtId })
            };
            
            await transactionsRef.add(transactionData);
            
            transactionForm.reset();
            document.getElementById('date').valueAsDate = new Date();
            
            loadDashboardData(userId); // Recargamos dashboard que a su vez llama a otros
        }
    } catch (error) {
        console.error("Error al guardar la transacción:", error);
        alert("Ha ocurrido un error inesperado al guardar. Revisa la consola.");
    }
});

editTransactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const transactionId = editTransactionId.value;
    const amount = parseFloat(editAmount.value);
    const type = editType.value;
    const category = editCategory.value.trim();
    const description = editDescription.value.trim();

    if (isNaN(amount) || amount <= 0) {
        alert('Por favor, introduce un monto válido.');
        return;
    }
    if (!category) {
        alert('Por favor, introduce una categoría.');
        return;
    }

    try {
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transactionId).update({
            amount: amount,
            type: type,
            category: category,
            description: description,
        });
        editTransactionModal.style.display = 'none';
        editTransactionModal.classList.remove('active-modal');
        alert('Movimiento actualizado con éxito!');
        loadDashboardData();
        loadDebts();
        loadBudgets();
    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        alert('Hubo un error al actualizar el movimiento.');
    }
});

async function loadFilterYears() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('transactions')
            .orderBy('createdAt', 'asc') // CORREGIDO
            .get();

        const years = new Set();
        snapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.createdAt) { // CORREGIDO
                years.add(transaction.createdAt.toDate().getFullYear()); // CORREGIDO
            }
        });

        filterYearSelect.innerHTML = '<option value="">Todos</option>';
        Array.from(years).sort((a, b) => b - a).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            filterYearSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar años para el filtro:", error);
    }
}

function loadTransactions() {
    if (!currentUser) return;

    const selectedMonth = filterMonthSelect.value;
    const selectedYear = filterYearSelect.value;
    const filterCategory = filterCategoryInput.value.trim().toLowerCase();

    let query = db.collection('users').doc(currentUser.uid).collection('transactions');

    if (selectedYear) {
        const startOfYear = new Date(parseInt(selectedYear), 0, 1);
        const endOfYear = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
        query = query.where('createdAt', '>=', startOfYear).where('createdAt', '<=', endOfYear); // CORREGIDO
    }

    if (selectedMonth !== "" && selectedYear) {
        const startOfMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
        const endOfMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0, 23, 59, 59);
        // Reiniciamos la query para evitar conflictos de 'where' en diferentes campos
        query = db.collection('users').doc(currentUser.uid).collection('transactions')
            .where('createdAt', '>=', startOfMonth) // CORREGIDO
            .where('createdAt', '<=', endOfMonth); // CORREGIDO
    }

    query.orderBy('createdAt', 'desc') // CORREGIDO
        .onSnapshot((snapshot) => {
            transactionsList.innerHTML = '';
            let transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });

            // Filtrado por categoría y mes (si no hay año) se hace en el cliente
            if (filterCategory) {
                transactions = transactions.filter(t => t.category && t.category.toLowerCase().includes(filterCategory));
            }
            if (selectedMonth !== "" && !selectedYear) {
                transactions = transactions.filter(t => t.createdAt && t.createdAt.toDate().getMonth().toString() === selectedMonth);
            }

            if (transactions.length === 0) {
                 if (selectedMonth || selectedYear || filterCategory) {
                    transactionsList.innerHTML = '<li style="text-align:center; padding:20px; color:#6c757d;">No hay transacciones que coincidan con los filtros.</li>';
                } else {
                    transactionsList.innerHTML = '<li style="text-align:center; padding:20px; color:#6c757d;">No hay transacciones registradas.</li>';
                }
                return;
            }

            transactions.forEach(transaction => {
                const li = document.createElement('li');
                li.classList.add(transaction.type === 'ingreso' ? 'ingreso' : 'gasto');
                const date = transaction.createdAt ? transaction.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A'; // CORREGIDO
                
                let displaySign = (transaction.type === 'ingreso') ? '+' : '-';

                li.innerHTML = `
                    <span>${date} - ${displaySign} ${transaction.amount.toFixed(2)}€ (${transaction.category}) ${transaction.description ? `(${transaction.description})` : ''}</span>
                    <div>
                        <button class="edit-button" data-id="${transaction.id}">Editar</button>
                        <button class="delete-button" data-id="${transaction.id}">Eliminar</button>
                    </div>
                `;
                transactionsList.appendChild(li);
            });

            transactionsList.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (e) => deleteTransaction(e.target.dataset.id));
            });

            transactionsList.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
            });
        }, (error) => {
            console.error("Error al cargar transacciones: ", error);
            transactionsList.innerHTML = '<li style="text-align:center; padding:20px; color:#cc0000;">Error al cargar transacciones. Verifique los permisos y los índices en Firestore.</li>';
        });
}

applyFiltersButton.addEventListener('click', loadTransactions);
clearFiltersButton.addEventListener('click', () => {
    filterMonthSelect.value = '';
    filterYearSelect.value = '';
    filterCategoryInput.value = '';
    loadTransactions();
});

async function deleteTransaction(id) {
    if (!currentUser) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(id).delete();
            alert('Transacción eliminada.');
            loadDashboardData();
            loadDebts();
            loadFilterYears();
            loadBudgets();
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            alert('Hubo un error al eliminar la transacción.');
        }
    }
}

async function openEditModal(transactionId) {
    if (!currentUser) return;
    try {
        const doc = await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transactionId).get();
        if (doc.exists) {
            const transaction = doc.data();
            editTransactionId.value = doc.id;
            editAmount.value = transaction.amount;
            editType.value = transaction.type;
            editCategory.value = transaction.category;
            editDescription.value = transaction.description;
            editTransactionModal.style.display = 'flex';
            editTransactionModal.classList.add('active-modal');
        } else {
            console.error("No se encontró la transacción para editar.");
            alert("No se pudo encontrar la transacción para editar.");
        }
    } catch (error) {
        console.error('Error al cargar la transacción para editar:', error);
        alert('Hubo un error al cargar los datos de la transacción.');
    }
}
// --- Funciones de Gestión de Deudas ---
debtForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const name = document.getElementById('debt-name').value.trim();
    const amount = parseFloat(document.getElementById('debt-amount').value);

    if (!name || isNaN(amount) || amount <= 0) {
        alert('Por favor, introduce un nombre y monto inicial válido.');
        return;
    }

    try {
        await db.collection('users').doc(currentUser.uid).collection('debts').add({
            name: name,
            initialAmount: amount,
            currentAmount: amount,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        debtForm.reset();
        alert('Deuda añadida con éxito!');
        loadDebts();
        loadDebtsForSelector();
    } catch (error) {
        console.error('Error al añadir deuda:', error);
        alert('Hubo un error al añadir la deuda.');
    }
});

function loadDebts() {
    if (!currentUser) return;
    db.collection('users').doc(currentUser.uid).collection('debts')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            debtsList.innerHTML = '';
            snapshot.forEach((doc) => {
                const debt = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${debt.name}: ${debt.currentAmount.toFixed(2)}€ (Inicial: ${debt.initialAmount.toFixed(2)}€)</span>
                    <button data-id="${doc.id}">Eliminar Deuda</button>
                `;
                debtsList.appendChild(li);
            });
            debtsList.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => deleteDebt(e.target.dataset.id));
            });
        });
}

async function deleteDebt(id) {
    if (!currentUser) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta deuda?')) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('debts').doc(id).delete();
            alert('Deuda eliminada.');
            loadDebtsForSelector();
            loadDashboardData();
        } catch (error) {
            console.error('Error al eliminar deuda:', error);
            alert('Hubo un error al eliminar la deuda.');
        }
    }
};

// --- Funciones para el Dashboard ---
async function loadDashboardData() {
    if (!currentUser) {
        resetDashboard();
        return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');

    const snapshot = await transactionsRef
        .where('createdAt', '>=', startOfMonth) // CORREGIDO
        .where('createdAt', '<=', endOfMonth) // CORREGIDO
        .get();

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryExpenses = {};

    snapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.type === 'ingreso') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'gasto' || transaction.type === 'pago_de_deudas') {
            totalExpenses += transaction.amount;
            const category = transaction.category || 'Sin Categoría';
            categoryExpenses[category] = (categoryExpenses[category] || 0) + transaction.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    monthlyIncomeSpan.textContent = totalIncome.toFixed(2);
    monthlyExpensesSpan.textContent = totalExpenses.toFixed(2);
    monthlyBalanceSpan.textContent = balance.toFixed(2);

    updateExpensesChart(categoryExpenses);
    updateCategoryBreakdown(categoryExpenses);

    await updateOverallDebtBalance();
    await updateBudgetProgress();
}

async function updateOverallDebtBalance() {
    if (!currentUser) return;
    let totalPendingDebt = 0;
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('debts').get();
        snapshot.forEach(doc => {
            const debt = doc.data();
            totalPendingDebt += debt.currentAmount;
        });
        const totalDebtsPendingSpan = document.getElementById('total-debts-pending');
        if(totalDebtsPendingSpan){
            totalDebtsPendingSpan.textContent = totalPendingDebt.toFixed(2);
        }
    } catch (error) {
        console.error("Error al calcular total de deudas pendientes:", error);
    }
}

async function updateBudgetProgress() {
    if (!currentUser) return;
    budgetProgressList.innerHTML = '';
    noBudgetsMessage.style.display = 'none';

    try {
        const budgetsSnapshot = await db.collection('users').doc(currentUser.uid).collection('budgets').get();
        if (budgetsSnapshot.empty) {
            noBudgetsMessage.style.display = 'block';
            return;
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const expensesSnapshot = await db.collection('users').doc(currentUser.uid).collection('transactions')
            .where('type', 'in', ['gasto', 'pago_de_deudas'])
            .where('createdAt', '>=', startOfMonth) // CORREGIDO
            .where('createdAt', '<=', endOfMonth) // CORREGIDO
            .get();
        
        const monthlyExpensesByCategory = {};
        expensesSnapshot.forEach(doc => {
            const transaction = doc.data();
            const category = (transaction.category ? transaction.category.toLowerCase() : 'sin categoría');
            monthlyExpensesByCategory[category] = (monthlyExpensesByCategory[category] || 0) + transaction.amount;
        });

        budgetsSnapshot.forEach(budgetDoc => {
            const budget = budgetDoc.data();
            const budgetCategory = budget.category.toLowerCase();
            const budgetAmount = budget.amount;
            const spentAmount = monthlyExpensesByCategory[budgetCategory] || 0;
            const remainingAmount = budgetAmount - spentAmount;
            const percentageUsed = (spentAmount / budgetAmount) * 100;

            const budgetItem = document.createElement('div');
            budgetItem.classList.add('budget-item');
            
            let progressBarClass = '';
            if (percentageUsed >= 100) {
                budgetItem.classList.add('over-budget');
                progressBarClass = 'over-budget';
            } else if (percentageUsed > 0 && percentageUsed < 100) {
                progressBarClass = 'warning-budget';
            }

            budgetItem.innerHTML = `
                <h4>${budget.category}</h4>
                <div class="budget-values">
                    <span>Gastado: ${spentAmount.toFixed(2)}€</span>
                    <span>Presupuesto: ${budgetAmount.toFixed(2)}€</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${progressBarClass}" style="width: ${Math.min(percentageUsed, 100)}%;"></div>
                </div>
                <div class="budget-values">
                    <span>Restante: ${remainingAmount.toFixed(2)}€</span>
                </div>
            `;
            budgetProgressList.appendChild(budgetItem);
        });

    } catch (error) {
        console.error("Error al cargar el progreso de presupuestos:", error);
        noBudgetsMessage.style.display = 'block';
    }
}

function updateExpensesChart(categoryExpenses) {
    const ctx = expensesChartCanvas.getContext('2d');
    if (expensesChart) {
        expensesChart.destroy();
    }

    const labels = Object.keys(categoryExpenses);
    const data = Object.values(categoryExpenses);

    expensesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7FCDDA', '#FAEBD7', '#8A2BE2', '#A52A2A'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Gastos por Categoría' }
            }
        }
    });
}

function updateCategoryBreakdown(categoryExpenses) {
    categoryBreakdownDiv.innerHTML = '<h3>Desglose Detallado</h3>';
    if (Object.keys(categoryExpenses).length === 0) {
        categoryBreakdownDiv.innerHTML += '<p>No hay gastos registrados para este mes.</p>';
    } else {
        for (const category in categoryExpenses) {
            const div = document.createElement('div');
            div.innerHTML = `<strong>${category}</strong>: ${categoryExpenses[category].toFixed(2)}€`;
            categoryBreakdownDiv.appendChild(div);
        }
    }
}

// --- Funciones para la Gestión de Presupuestos ---
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const category = budgetCategoryInput.value.trim();
    const amount = parseFloat(budgetAmountInput.value);
    const budgetId = budgetIdInput.value;
    const normalizedCategory = category.toLowerCase();

    if (!category || isNaN(amount) || amount <= 0) {
        alert('Por favor, introduce una categoría y un monto válido.');
        return;
    }

    try {
        const existingBudget = await db.collection('users').doc(currentUser.uid).collection('budgets')
            .where('category', '==', normalizedCategory)
            .limit(1)
            .get();

        if (existingBudget.empty || existingBudget.docs[0].id === budgetId) {
            if (budgetId) {
                await db.collection('users').doc(currentUser.uid).collection('budgets').doc(budgetId).update({
                    category: normalizedCategory,
                    amount: amount
                });
                alert('Presupuesto actualizado con éxito!');
            } else {
                await db.collection('users').doc(currentUser.uid).collection('budgets').add({
                    category: normalizedCategory,
                    amount: amount,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Presupuesto añadido con éxito!');
            }
            budgetForm.reset();
            budgetIdInput.value = '';
            cancelBudgetEditButton.style.display = 'none';
            loadBudgets();
            loadDashboardData();
        } else {
            alert(`Ya existe un presupuesto para la categoría "${category}".`);
        }
    } catch (error) {
        console.error('Error al guardar presupuesto:', error);
        alert('Hubo un error al guardar el presupuesto.');
    }
});

function loadBudgets() {
    if (!currentUser) return;
    if (unsubscribeBudgets) unsubscribeBudgets(); // Desuscribirse si ya hay una escucha activa

    unsubscribeBudgets = db.collection('users').doc(currentUser.uid).collection('budgets')
        .orderBy('category', 'asc')
        .onSnapshot((snapshot) => {
            budgetsList.innerHTML = '';
            if (snapshot.empty) {
                budgetsList.innerHTML = '<li style="text-align:center; padding:20px; color:#6c757d;">No hay presupuestos registrados.</li>';
                return;
            }
            snapshot.forEach((doc) => {
                const budget = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${budget.category}: ${budget.amount.toFixed(2)}€</span>
                    <div>
                        <button class="edit-budget-button" data-id="${doc.id}" data-category="${budget.category}" data-amount="${budget.amount}">Editar</button>
                        <button class="delete-button" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                budgetsList.appendChild(li);
            });

            budgetsList.querySelectorAll('.edit-budget-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    budgetIdInput.value = e.target.dataset.id;
                    budgetCategoryInput.value = e.target.dataset.category;
                    budgetAmountInput.value = parseFloat(e.target.dataset.amount);
                    cancelBudgetEditButton.style.display = 'inline-block';
                });
            });

            budgetsList.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (e) => deleteBudget(e.target.dataset.id));
            });
        }, (error) => {
            console.error("Error en la escucha de presupuestos:", error);
        });
}

async function deleteBudget(id) {
    if (!currentUser) return;
    if (confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('budgets').doc(id).delete();
            alert('Presupuesto eliminado.');
            budgetForm.reset();
            budgetIdInput.value = '';
            cancelBudgetEditButton.style.display = 'none';
            loadDashboardData();
        } catch (error) {
            console.error('Error al eliminar presupuesto:', error);
            alert('Hubo un error al eliminar el presupuesto.');
        }
    }
}

cancelBudgetEditButton.addEventListener('click', () => {
    budgetForm.reset();
    budgetIdInput.value = '';
    cancelBudgetEditButton.style.display = 'none';
});

// Duplicado de onAuthStateChanged al final del archivo, puede causar problemas.
// Se recomienda tener un solo listener onAuthStateChanged.
// auth.onAuthStateChanged((user) => {
//     if (user) {
//         loadDashboardData();
//     }
// });