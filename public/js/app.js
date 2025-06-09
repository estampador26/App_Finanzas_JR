// Tu configuración de Firebase REAL.
const firebaseConfig = {
    apiKey: "AIzaSyC6jlFj0JO-U05fqvOr1JE39Umf0XLmYpM",
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

let unsubscribeBudgets = null; // Para desuscribirse de los cambios de presupuestos (NUEVO)

// Elementos del DOM (variables que representan elementos HTML)
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

// Elementos para la asignación de deudas en el formulario de registro
const typeSelect = document.getElementById('type');
const categoryContainer = document.getElementById('category-container');
const categoryInput = document.getElementById('category');
const debtSelectionContainer = document.getElementById('debt-selection-container');
const debtSelector = document.getElementById('debt-selector');

// Elementos para los filtros de historial en la pestaña de Registro
const filterMonthSelect = document.getElementById('filter-month');
const filterYearSelect = document.getElementById('filter-year');
const filterCategoryInput = document.getElementById('filter-category');
const applyFiltersButton = document.getElementById('apply-filters-button');
const clearFiltersButton = document.getElementById('clear-filters-button');

// Elementos para la gestión de Presupuestos en su pestaña
const budgetForm = document.getElementById('budget-form');
const budgetCategoryInput = document.getElementById('budget-category');
const budgetAmountInput = document.getElementById('budget-amount');
const budgetIdInput = document.getElementById('budget-id');
const budgetsList = document.getElementById('budgets-list');
const cancelBudgetEditButton = document.getElementById('cancel-budget-edit');

// Elementos para el progreso de presupuestos en Dashboard
const budgetProgressList = document.getElementById('budget-progress-list');
const noBudgetsMessage = document.getElementById('no-budgets-message');

let expensesChart; // Variable global para la instancia del gráfico (Chart.js)

// --- Funciones de Autenticación y UI ---
authButton.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Usuario logeado:', result.user.displayName);
        })
        .catch((error) => {
            console.error('Error de autenticación:', error);
            alert('Error al iniciar sesión con Google. Revisa la consola para más detalles.');
        });
});

signOutButton.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            console.log('Usuario deslogeado.');
            updateUIForSignedOutUser();
        })
        .catch((error) => {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión. Revisa la consola.');
        });
});

// Listener para el estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        updateUIForSignedOutUser(); // Se llama primero para ocultar el botón de iniciar sesión
        updateUIForSignedInUser(user); // Luego se actualiza la UI para el usuario logeado
        // Todas las cargas de datos se inician desde updateUIForSignedInUser -> showTab('dashboard')
        // o directamente desde showTab si se cambia de pestaña.
        // loadTransactions(); // Se llama desde showTab
        // loadDebts(); // Se llama desde showTab
        // loadDashboardData(); // Se llama desde showTab
        // loadBudgets(); // Se llama desde showTab
        loadDebtsForSelector(); // Esta es una carga de apoyo para el selector
        updateFormVisibility(); // Asegurarse de que el formulario de registro tenga la visibilidad correcta
        loadFilterYears(); // Cargar años para el filtro
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
    showTab('dashboard'); // Mostrar la pestaña de dashboard por defecto al iniciar sesión
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
    budgetsList.innerHTML = ''; // Limpiar presupuestos al cerrar sesión
    budgetProgressList.innerHTML = ''; // Limpiar progreso de presupuestos
    noBudgetsMessage.style.display = 'none'; // Ocultar mensaje
    resetDashboard();
    if (unsubscribeBudgets) { // Desuscribirse de presupuestos al cerrar sesión (NUEVO)
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

// Cierre del modal de edición
closeButton.addEventListener('click', () => {
    editTransactionModal.style.display = 'none';
    editTransactionModal.classList.remove('active-modal');
});

// Cierra el modal si el usuario hace clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target == editTransactionModal) {
        editTransactionModal.style.display = 'none';
        editTransactionModal.classList.remove('active-modal');
    }
});
// --- Funciones de Navegación entre Pestañas ---
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
    // Recargar datos para la pestaña activa
    if (currentUser) { // Solo si hay usuario logeado
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

// --- Funciones para la Lógica de Mostrar/Ocultar Selector de Deudas en el Formulario de Registro ---
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

// --- Funciones de Gestión de Transacciones (Pestaña Registro) ---
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    let category;
    const description = document.getElementById('description').value.trim();

    const selectedDebtId = debtSelector.value; 

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
        
        try {
            const debtRef = db.collection('users').doc(currentUser.uid).collection('debts').doc(selectedDebtId);
            await db.runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(debtRef);
                if (!sfDoc.exists) {
                    throw "La deuda seleccionada no existe!";
                }
                const newAmount = sfDoc.data().currentAmount - amount;
                if (newAmount < 0) {
                    console.warn("Pago excede el monto de la deuda. Deuda restante: " + newAmount);
                }
                transaction.update(debtRef, { currentAmount: newAmount });
            });
            console.log("Deuda actualizada con el pago.");
        } catch (e) {
            console.error("Fallo la transacción para actualizar deuda:", e);
            alert("Error al actualizar la deuda. Revisa la consola para más detalles.");
            return;
        }
    } else {
        category = document.getElementById('category').value.trim();
        if (!category) {
            alert('Por favor, introduce una categoría.');
            return;
        }
    }

    try {
        await db.collection('users').doc(currentUser.uid).collection('transactions').add({
            amount: amount,
            type: type,
            category: category,
            description: description,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            debtId: (type === 'pago_de_deudas') ? selectedDebtId : null
        });
        transactionForm.reset();
        updateFormVisibility();
        alert('Movimiento guardado con éxito!');
        loadDashboardData(); // Actualizar dashboard
        loadDebts(); // Actualizar lista de deudas
        loadBudgets(); // Actualizar presupuestos (por si el gasto afecta un presupuesto)
    } catch (error) {
        console.error('Error al guardar movimiento:', error);
        alert('Hubo un error al guardar el movimiento.');
    }
});

// Listener para guardar los cambios del formulario de edición
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
        loadBudgets(); // Para asegurar que cualquier cambio en gastos afecte el presupuesto del dashboard
    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        alert('Hubo un error al actualizar el movimiento.');
    }
});
// --- Funciones para cargar años en el filtro (Pestaña Registro) ---
async function loadFilterYears() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('transactions')
            .orderBy('timestamp', 'asc')
            .get();

        const years = new Set();
        snapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.timestamp) {
                years.add(transaction.timestamp.toDate().getFullYear());
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

    let transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');

    if (selectedYear) {
        const startOfYear = new Date(parseInt(selectedYear), 0, 1);
        const endOfYear = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
        transactionsRef = transactionsRef.where('timestamp', '>=', startOfYear).where('timestamp', '<=', endOfYear);
    }

    if (selectedMonth !== "" && selectedYear) {
        const startOfMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
        const endOfMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0, 23, 59, 59);
        transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions')
            .where('timestamp', '>=', startOfMonth)
            .where('timestamp', '<=', endOfMonth);
    } else if (selectedMonth !== "" && !selectedYear) {
        console.warn("Filtrar solo por mes sin año puede no ser preciso en Firestore para grandes volúmenes de datos sin un campo de mes dedicado.");
    }

    transactionsRef.orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            transactionsList.innerHTML = '';
            let filteredTransactionsCount = 0;

            snapshot.forEach((doc) => {
                const transaction = doc.data();
                const transactionCategory = transaction.category ? transaction.category.toLowerCase() : '';
                const transactionMonth = transaction.timestamp ? transaction.timestamp.toDate().getMonth().toString() : '';

                if (filterCategory && !transactionCategory.includes(filterCategory)) {
                    return;
                }

                if (selectedMonth !== "" && !selectedYear && transactionMonth !== selectedMonth) {
                    return;
                }

                filteredTransactionsCount++;

                const li = document.createElement('li');
                li.classList.add(transaction.type === 'ingreso' ? 'ingreso' : 'gasto');
                const date = transaction.timestamp ? transaction.timestamp.toDate().toLocaleDateString() : 'N/A';
                
                let displaySign = (transaction.type === 'ingreso') ? '+' : '-';

                li.innerHTML = `
                    <span>${date} - ${displaySign} ${transaction.amount}€ (${transaction.category}) ${transaction.description ? `(${transaction.description})` : ''}</span>
                    <div>
                        <button class="edit-button" data-id="${doc.id}">Editar</button>
                        <button class="delete-button" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                transactionsList.appendChild(li);
            });

            if (filteredTransactionsCount === 0 && (selectedMonth !== "" || selectedYear !== "" || filterCategory !== "")) {
                transactionsList.innerHTML = '<li style="text-align:center; padding:20px; color:#6c757d;">No hay transacciones que coincidan con los filtros aplicados.</li>';
            } else if (filteredTransactionsCount === 0 && selectedMonth === "" && selectedYear === "" && filterCategory === "") {
                 transactionsList.innerHTML = '<li style="text-align:center; padding:20px; color:#6c757d;">No hay transacciones registradas.</li>';
            }


            transactionsList.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const transactionId = e.target.dataset.id;
                    deleteTransaction(transactionId);
                });
            });

            transactionsList.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const transactionId = e.target.dataset.id;
                    await openEditModal(transactionId);
                });
            });
        });
}

// Event Listeners para los botones de filtro
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
            loadBudgets(); // Para asegurar que cualquier cambio en gastos afecte el presupuesto del dashboard
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
// --- Funciones de Gestión de Deudas (Pestaña Control de Deudas) ---
debtForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const name = document.getElementById('debt-name').value.trim();
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    if (!name || isNaN(amount) || amount <= 0) {
        alert('Por favor, introduce un nombre y monto inicial válido para la deuda.');
        return;
    }

    try {
        await db.collection('users').doc(currentUser.uid).collection('debts').add({
            name: name,
            initialAmount: amount,
            currentAmount: amount,
            createdAt: timestamp
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
                button.addEventListener('click', (e) => {
                    const debtId = e.target.dataset.id;
                    deleteDebt(debtId);
                });
            });
        });
}

async function deleteDebt(id) {
    if (!currentUser) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta deuda? Esto no revertirá los pagos registrados.')) {
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

// Listener para refrescar datos cuando cambian pagos de deudas
db.collection('users').doc(currentUser?.uid || 'placeholder').collection('transactions')
    .where('type', '==', 'pago_de_deudas')
    .onSnapshot(async (snapshot) => {
        if (!currentUser) return;
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added" || change.type === "modified" || change.type === "removed") {
                loadDebts();
                loadDashboardData();
            }
        });
    });

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
        .where('timestamp', '>=', startOfMonth)
        .where('timestamp', '<=', endOfMonth)
        .orderBy('timestamp', 'asc')
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
    await updateBudgetProgress(); // Llamada para actualizar el progreso de presupuestos en el dashboard
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
        } else {
            console.log("Total de deudas pendientes:", totalPendingDebt.toFixed(2));
        }
    } catch (error) {
        console.error("Error al calcular total de deudas pendientes:", error);
    }
}

async function updateBudgetProgress() { // FUNCIÓN para el progreso de presupuestos
    if (!currentUser) return;
    budgetProgressList.innerHTML = ''; // Limpiar la lista antes de añadir
    noBudgetsMessage.style.display = 'none'; // Ocultar mensaje por defecto

    try {
        const budgetsSnapshot = await db.collection('users').doc(currentUser.uid).collection('budgets').get();
        if (budgetsSnapshot.empty) {
            noBudgetsMessage.style.display = 'block'; // Mostrar mensaje si no hay presupuestos
            return;
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Obtener todos los gastos del mes actual para calcular el progreso
        // NOTA: Asegúrate de que tienes un índice en Firestore para 'type' (asc) y 'timestamp' (asc)
        // Y posiblemente otro para 'type' (asc) y 'timestamp' (desc) si usas ambas.
        const expensesSnapshot = await db.collection('users').doc(currentUser.uid).collection('transactions')
            .where('type', 'in', ['gasto', 'pago_de_deudas'])
            .where('timestamp', '>=', startOfMonth)
            .where('timestamp', '<=', endOfMonth)
            .get();
        
        const monthlyExpensesByCategory = {};
        expensesSnapshot.forEach(doc => {
            const transaction = doc.data();
            // Normalizar categoría a minúsculas para coincidir con presupuestos
            const category = (transaction.category ? transaction.category.toLowerCase() : 'sin categoría');
            monthlyExpensesByCategory[category] = (monthlyExpensesByCategory[category] || 0) + transaction.amount;
        });

        budgetsSnapshot.forEach(budgetDoc => {
            const budget = budgetDoc.data();
            // Normalizar categoría del presupuesto a minúsculas
            const budgetCategory = budget.category.toLowerCase();
            const budgetAmount = budget.amount;
            const spentAmount = monthlyExpensesByCategory[budgetCategory] || 0;
            const remainingAmount = budgetAmount - spentAmount;
            const percentageUsed = (spentAmount / budgetAmount) * 100;

            const budgetItem = document.createElement('div');
            budgetItem.classList.add('budget-item');
            
            // Lógica para los colores de la barra de progreso (1-99% naranja, >=100% rojo)
            let progressBarClass = '';
            if (percentageUsed >= 100) {
                budgetItem.classList.add('over-budget'); // Borde rojo para todo el item
                progressBarClass = 'over-budget'; // Barra roja
            } else if (percentageUsed > 0 && percentageUsed < 100) { // Naranja si está entre 1% y 99%
                progressBarClass = 'warning-budget'; // Barra naranja (necesita estilo en CSS)
            }
            // Si es 0%, no se añade ninguna clase extra, queda el color por defecto (verde)


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
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                    '#C9CBCF', '#7FCDDA', '#FAEBD7', '#8A2BE2', '#A52A2A'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Gastos por Categoría'
                }
            }
        }
    });
}

function updateCategoryBreakdown(categoryExpenses) {
    categoryBreakdownDiv.innerHTML = '<h3>Desglose Detallado</h3>';
    for (const category in categoryExpenses) {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${category}</strong>: ${categoryExpenses[category].toFixed(2)}€`;
        div.style.borderColor = '#28a745';
        categoryBreakdownDiv.appendChild(div);
    }
    if (Object.keys(categoryExpenses).length === 0) {
        categoryBreakdownDiv.innerHTML += '<p>No hay gastos registrados para este mes.</p>';
    }
}

// --- Funciones para la Gestión de Presupuestos (Pestaña Presupuestos) ---
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const category = budgetCategoryInput.value.trim();
    const amount = parseFloat(budgetAmountInput.value);
    const budgetId = budgetIdInput.value;

    // Normalizar la categoría a minúsculas antes de guardar
    const normalizedCategory = category.toLowerCase();

    if (!category || isNaN(amount) || amount <= 0) {
        alert('Por favor, introduce una categoría y un monto válido para el presupuesto.');
        return;
    }

    try {
        // Opcional: Evitar categorías duplicadas
        const existingBudget = await db.collection('users').doc(currentUser.uid).collection('budgets')
            .where('category', '==', normalizedCategory)
            .limit(1)
            .get();

        if (existingBudget.empty || existingBudget.docs[0].id === budgetId) {
            if (budgetId) {
                // Editar presupuesto existente
                await db.collection('users').doc(currentUser.uid).collection('budgets').doc(budgetId).update({
                    category: normalizedCategory,
                    amount: amount
                });
                alert('Presupuesto actualizado con éxito!');
            } else {
                // Añadir nuevo presupuesto
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
            loadBudgets(); // Recargar la lista de presupuestos
            loadDashboardData(); // Refrescar dashboard para posibles actualizaciones de presupuestos
        } else {
            alert(`Ya existe un presupuesto para la categoría "${category}". Por favor, edítalo o elige otra categoría.`);
        }
    } catch (error) {
        console.error('Error al guardar presupuesto:', error);
        alert('Hubo un error al guardar el presupuesto.');
    }
});

function loadBudgets() {
    if (!currentUser) return;
    db.collection('users').doc(currentUser.uid).collection('budgets')
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
                    const id = e.target.dataset.id;
                    const category = e.target.dataset.category;
                    const amount = parseFloat(e.target.dataset.amount);
                    
                    budgetIdInput.value = id;
                    budgetCategoryInput.value = category;
                    budgetAmountInput.value = amount;
                    cancelBudgetEditButton.style.display = 'inline-block';
                });
            });

            budgetsList.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const budgetId = e.target.dataset.id;
                    deleteBudget(budgetId);
                });
            });
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
            loadDashboardData(); // Refrescar dashboard
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

// Cargar datos iniciales si el usuario ya está logeado al cargar la página
auth.onAuthStateChanged((user) => {
    if (user) {
        loadDashboardData();
    }
});