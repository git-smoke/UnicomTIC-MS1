    let users = [];
    let motorbikes = [];
    let rentals = [];
    const categories = ['Bike', 'Sport', 'Touring'];

    function loadData() {
        users = JSON.parse(localStorage.getItem('users')) || [];
        motorbikes = JSON.parse(localStorage.getItem('motorbikes')) || [];
        rentals = JSON.parse(localStorage.getItem('rentals')) || [];
    }

    function saveData() {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('motorbikes', JSON.stringify(motorbikes));
        localStorage.setItem('rentals', JSON.stringify(rentals));
    }

    function login(username, password, role) {
        const user = users.find(u => u.username === username && u.password === password && u.role === role);
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    }

    function register(username, password, nic, role) {
        if (users.some(u => u.username === username)) {
            return false;
        }
        const newUser = { username, password, nic, role };
        users.push(newUser);
        saveData();
        return true;
    }

    function logout() {
        sessionStorage.removeItem('currentUser');
    }

    function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('currentUser'));
    }

    function addMotorbike(regNumber, brand, model, category, imageData) {
        const newMotorbike = { regNumber, brand, model, category, imageData };
        motorbikes.push(newMotorbike);
        saveData();
        updateMotorbikeTable();
        updateAvailableMotorbikes();
    }

    function removeMotorbike(index) {
        motorbikes.splice(index, 1);
        saveData();
        updateMotorbikeTable();
        updateAvailableMotorbikes();
    }

    function updateRentalRequests() {
        const rentalRequestsTableBody = document.getElementById('rentalRequestsTableBody');
        const rentalRequests = JSON.parse(localStorage.getItem('rentalRequests')) || [];
        const currentUser = getCurrentUser();

        if (rentalRequestsTableBody) {
            rentalRequestsTableBody.innerHTML = '';
            rentalRequests.forEach((request, index) => {
                if (currentUser.role === 'manager' || request.username === currentUser.username) {
                    const motorbike = motorbikes.find(mb => mb.regNumber === request.regNumber);
                    if (motorbike) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${request.username}</td>
                            <td>${motorbike.regNumber}</td>
                            <td>${motorbike.brand}</td>
                            <td>${motorbike.model}</td>
                            <td>${new Date(request.requestDate).toLocaleString()}</td>
                            <td>${request.status}</td>
                            ${currentUser.role === 'manager' && request.status === 'pending' ? 
                                `<td><button class="btn btn-success btn-sm" onclick="approveRental(${index})">Approve</button></td>` : 
                                '<td></td>'}
                        `;
                        rentalRequestsTableBody.appendChild(row);
                    }
                }
            });
        }
    }

    function rentMotorbike(regNumber) {
        const currentUser = getCurrentUser();
        const rentalRequest = {
            regNumber,
            username: currentUser.username,
            requestDate: new Date().toISOString(),
            status: 'pending'
        };
        const rentalRequests = JSON.parse(localStorage.getItem('rentalRequests')) || [];
        rentalRequests.push(rentalRequest);
        localStorage.setItem('rentalRequests', JSON.stringify(rentalRequests));
        updateAvailableMotorbikes();
        updateRentalRequests();
    }

    function approveRental(index) {
        const rentalRequests = JSON.parse(localStorage.getItem('rentalRequests')) || [];
        const request = rentalRequests[index];
        request.status = 'approved';
        request.approvalDate = new Date().toISOString();
        
        // Add to rentals
        rentals.push({
            regNumber: request.regNumber,
            username: request.username,
            rentDate: request.approvalDate
        });
        
        localStorage.setItem('rentalRequests', JSON.stringify(rentalRequests));
        saveData();
        updateRentalRequests();
        updateCustomerRentals();
        updateAvailableMotorbikes();
    }

    function returnMotorbike(index) {
        const rental = rentals[index];
        const returnDate = new Date().toISOString();
        const orderHistoryItem = { ...rental, returnDate };
        
        // Add to order history
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
        orderHistory.push(orderHistoryItem);
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        
        rentals.splice(index, 1);
        saveData();
        updateAvailableMotorbikes();
        updateCustomerRentals();
        updateOrderHistory();
    }

    function isMotorbikeRented(regNumber) {
        return rentals.some(rental => rental.regNumber === regNumber);
    }

    function updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const currentUser = getCurrentUser();
        if (userInfo && currentUser) {
            userInfo.textContent = `Logged in as: ${currentUser.username} (${currentUser.role})`;
        }
    }

    function updateOrderHistory() {
        const orderHistoryTableBody = document.getElementById('orderHistoryTableBody');
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
        const currentUser = getCurrentUser();

        if (orderHistoryTableBody) {
            orderHistoryTableBody.innerHTML = '';
            orderHistory.forEach((order) => {
                if (currentUser.role === 'manager' || order.username === currentUser.username) {
                    const motorbike = motorbikes.find(mb => mb.regNumber === order.regNumber);
                    if (motorbike) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${motorbike.regNumber}</td>
                            <td>${motorbike.brand}</td>
                            <td>${motorbike.model}</td>
                            <td>${new Date(order.rentDate).toLocaleString()}</td>
                            <td>${new Date(order.returnDate).toLocaleString()}</td>
                        `;
                        orderHistoryTableBody.appendChild(row);
                    }
                }
            });
        }
    }

    function updateMotorbikeTable() {
        const motorbikeTableBody = document.getElementById('motorbikeTableBody');
        if (motorbikeTableBody) {
            motorbikeTableBody.innerHTML = '';
            motorbikes.forEach((motorbike, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${motorbike.regNumber}</td>
                    <td>${motorbike.brand}</td>
                    <td>${motorbike.model}</td>
                    <td>${motorbike.category}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="updateMotorbike(${index})">Update</button>
                        <button class="btn btn-danger btn-sm" onclick="removeMotorbike(${index})">Remove</button>
                    </td>
                `;
                motorbikeTableBody.appendChild(row);
            });
        }
    }

    function updateAvailableMotorbikes() {
        const availableMotorbikeTableBody = document.getElementById('availableMotorbikeTableBody');
        const rentalRequests = JSON.parse(localStorage.getItem('rentalRequests')) || [];
        if (availableMotorbikeTableBody) {
            availableMotorbikeTableBody.innerHTML = '';
            motorbikes.forEach((motorbike) => {
                if (!isMotorbikeRented(motorbike.regNumber) && !rentalRequests.some(r => r.regNumber === motorbike.regNumber && r.status === 'pending')) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${motorbike.regNumber}</td>
                        <td>${motorbike.brand}</td>
                        <td>${motorbike.model}</td>
                        <td>${motorbike.category}</td>
                        <td>
                            ${motorbike.imageData ? `<img src="${motorbike.imageData}" alt="${motorbike.brand} ${motorbike.model}" style="width: 100px; height: auto;">` : 'No image'}
                        </td>
                        <td><button class="btn btn-primary btn-sm" onclick="rentMotorbike('${motorbike.regNumber}')">Request Rental</button></td>
                    `;
                    availableMotorbikeTableBody.appendChild(row);
                }
            });
        }
    }

    function updateCustomerRentals() {
        const myRentalsTableBody = document.getElementById('myRentalsTableBody');
        const customerRentalsTableBody = document.getElementById('customerRentalsTableBody');
        const currentUser = getCurrentUser();

        if (myRentalsTableBody) {
            myRentalsTableBody.innerHTML = '';
            rentals.forEach((rental, index) => {
                if (rental.username === currentUser.username) {
                    const motorbike = motorbikes.find(mb => mb.regNumber === rental.regNumber);
                    if (motorbike) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${motorbike.regNumber}</td>
                            <td>${motorbike.brand}</td>
                            <td>${motorbike.model}</td>
                            <td>${motorbike.category}</td>
                            <td>${new Date(rental.rentDate).toLocaleString()}</td>
                            <td><button class="btn btn-danger btn-sm" onclick="returnMotorbike(${index})">Return</button></td>
                        `;
                        myRentalsTableBody.appendChild(row);
                    }
                }
            });
        }

        if (customerRentalsTableBody) {
            customerRentalsTableBody.innerHTML = '';
            rentals.forEach((rental) => {
                const motorbike = motorbikes.find(mb => mb.regNumber === rental.regNumber);
                if (motorbike) {
                    const row = document.createElement('tr');
                    const rentDate = new Date(rental.rentDate);
                    const currentDate = new Date();
                    const minutesDiff = (currentDate - rentDate) / (1000 * 60);
                    
                    let statusClass = minutesDiff > 1 ? 'table-danger' : 'table-success';
                    let statusText = minutesDiff > 1 ? 'Overdue' : 'Active';

                    row.className = statusClass;
                    row.innerHTML = `
                        <td>${rental.username}</td>
                        <td>${motorbike.regNumber}</td>
                        <td>${motorbike.brand}</td>
                        <td>${motorbike.model}</td>
                        <td>${new Date(rental.rentDate).toLocaleString()}</td>
                        <td>${statusText}</td>
                    `;
                    customerRentalsTableBody.appendChild(row);
                }
            });
        }
    }

    function checkOverdueRentals() {
        const currentDate = new Date();
        const overdueRentals = rentals.filter(rental => {
            const rentDate = new Date(rental.rentDate);
            const minutesDiff = (currentDate - rentDate) / (1000 * 60);
            return minutesDiff > 1;
        });

        if (overdueRentals.length > 0) {
            alert(`There are ${overdueRentals.length} overdue rentals!`);
        }
    }

    function updateMotorbike(index) {
        const motorbike = motorbikes[index];
        const updateForm = document.getElementById('updateMotorbikeForm');
        document.getElementById('updateRegNumber').value = motorbike.regNumber;
        document.getElementById('updateBrand').value = motorbike.brand;
        document.getElementById('updateModel').value = motorbike.model;
        const updateCategorySelect = document.getElementById('updateCategory');
        updateCategorySelect.innerHTML = ''; 
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            updateCategorySelect.appendChild(option);
        });
        
        // Set the correct category
        updateCategorySelect.value = motorbike.category;
        // Show the update popup
        document.getElementById('updateMotorbikeModal').style.display = 'block';
        
        // Set the current index for the update operation
        updateForm.dataset.index = index;
    }

    function saveUpdatedMotorbike(event) {
        event.preventDefault();
        const index = parseInt(event.target.dataset.index);
        const updatedMotorbike = {
            regNumber: document.getElementById('updateRegNumber').value,
            brand: document.getElementById('updateBrand').value,
            model: document.getElementById('updateModel').value,
            category: document.getElementById('updateCategory').value,
            imageData: motorbikes[index].imageData // Keep the existing image
        };
        
        motorbikes[index] = updatedMotorbike;
        saveData();
        updateMotorbikeTable();
        updateAvailableMotorbikes();
        
        // Hide the update popup
        document.getElementById('updateMotorbikeModal').style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadData();

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const addMotorbikeForm = document.getElementById('addMotorbikeForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const updateMotorbikeForm = document.getElementById('updateMotorbikeForm');

        if (updateMotorbikeForm) {
            updateMotorbikeForm.addEventListener('submit', saveUpdatedMotorbike);
        }

        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const username = document.getElementById('loginUsername').value;
                const password = document.getElementById('loginPassword').value;
                const role = document.getElementById('loginRole').value;
                if (login(username, password, role)) {
                    location.href = role === 'manager' ? 'd-manager.html' : 'd-customer.html'        
                } else {
                    alert('Invalid Username or Password');
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const username = document.getElementById('registerUsername').value;
                const password = document.getElementById('registerPassword').value;
                const nic = document.getElementById('registerNIC').value;
                const role = document.getElementById('registerRole').value;
                if (register(username, password, nic, role)) {
                    alert('Registration successful. Please login.');
                    registerForm.reset();
                } else {
                    alert('Username already exists');
                }
            });
        }

        if (addMotorbikeForm) {
            const categorySelect = document.getElementById('category');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            addMotorbikeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const regNumber = document.getElementById('regNumber').value;
                const brand = document.getElementById('brand').value;
                const model = document.getElementById('model').value;
                const category = document.getElementById('category').value;
                const imageFile = document.getElementById('bikeImage').files[0];
        
                if (imageFile) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        addMotorbike(regNumber, brand, model, category, event.target.result);
                    };
                    reader.readAsDataURL(imageFile);
                } else {
                    addMotorbike(regNumber, brand, model, category, null);
                }
                addMotorbikeForm.reset();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                logout();
                location.href = 'index.html';
            });
        }

        updateUserInfo();
        updateMotorbikeTable();
        updateAvailableMotorbikes();    
        checkOverdueRentals();
        updateOrderHistory();
        updateRentalRequests();
        updateCustomerRentals();

    });





// start: Tab
(function () {
    const panes = document.querySelectorAll("[data-tab-pane]");
    const pages = document.querySelectorAll("[data-tab-page]");
    panes.forEach(function (item, i) {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(
                '[data-tab-page="' + item.dataset.tabPane + '"]'
            );
            const active = document.querySelector("[data-tab-pane].active");
            if (active) {
                const activeIndex = Array.from(panes).indexOf(active);
                panes.forEach(function (el, x) {
                    el.classList.remove("active");
                    el.classList.toggle("before", x < i);
                    el.classList.toggle("after", x > i);
                    el.classList.toggle(
                        "slow",
                        Math.abs(activeIndex - x) > 0 && item !== el
                    );
                    el.style.setProperty(
                        "--delay",
                        `${
                            active === el
                                ? 0
                                : (Math.abs(activeIndex - x) - 1) * 150
                        }ms`
                    );
                });
            }
            if (target) {
                pages.forEach(function (el) {
                    el.classList.remove("active");
                });
                target.classList.add("active");
            }
            item.classList.add("active");
        });
    });
})();
// end: Tab
