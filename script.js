document.addEventListener("DOMContentLoaded", () => {
  // Cart functionality
  const cartIcon = document.querySelector(".cart-icon")
  const cartSidebar = document.querySelector(".cart-sidebar")
  const cartOverlay = document.querySelector(".cart-overlay")
  const closeCart = document.querySelector(".close-cart")
  const cartItemsContainer = document.querySelector(".cart-items")
  const cartTotal = document.querySelector(".total-amount")
  const cartCount = document.querySelector(".cart-count")
  const checkoutForm = document.querySelector(".checkout-form")
  const successMsg = document.querySelector(".checkout-success")
  const authModal = document.querySelector(".auth-modal")
  const authOverlay = document.querySelector(".auth-modal-overlay")
  const loginBtn = document.querySelector(".login-btn")
  const signupBtn = document.querySelector(".signup-btn")
  const tabButtons = document.querySelectorAll(".tab-btn")
  const loginForm = document.querySelector(".login-form")
  const signupForm = document.querySelector(".signup-form")
  const loginFormEl = document.querySelector(".login-form")
  const signupFormEl = document.querySelector(".signup-form")
  const authButtons = document.querySelector(".auth-buttons")

  async function loadOrders() {
    try {
      const token = localStorage.getItem("token")
      const ordersSection = document.querySelector(".orders-list")
      const message = document.querySelector(".orders-message")

      if (!token) return

      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error("Failed to load orders")
      }

      const orders = await res.json()

      ordersSection.innerHTML = ""

      if (orders.length === 0) {
        ordersSection.innerHTML = "<p>No orders found.</p>"
        return
      }

      orders.forEach((order) => {
        const statusClass = order.status ? `status-${order.status.toLowerCase()}` : "status-pending"
        const status = order.status || "Pending"

        const card = document.createElement("div")
        card.className = `order-card ${statusClass}`
        card.innerHTML = `
        <h4>Order #${order.id}</h4>
        <p><strong>Status:</strong> <span class="order-status">${status}</span></p>
        <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Items:</strong></p>
        <ul>${order.cart.map((item) => `<li>${item.name} x${item.quantity}</li>`).join("")}</ul>
      `
        ordersSection.appendChild(card)
      })
    } catch (error) {
      console.error("Error loading orders:", error)
      const ordersSection = document.querySelector(".orders-list")
      ordersSection.innerHTML = `<p class="error">Error loading orders: ${error.message}</p>`
    }
  }

  function updateCheckoutForm() {
    const userEmail = localStorage.getItem("userEmail")
    const emailField = checkoutForm.querySelector('input[name="email"]')

    if (userEmail && emailField) {
      const hiddenInput = document.createElement("input")
      hiddenInput.type = "hidden"
      hiddenInput.name = "email"
      hiddenInput.value = userEmail

      emailField.parentNode.replaceChild(hiddenInput, emailField)
    }
  }

  function setLoggedIn(email) {
    authButtons.innerHTML = `
    <div class="user-dropdown">
      <div class="user-email">
        <span>👋 ${email}</span>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="dropdown-menu">
        <a href="#orders" class="dropdown-menu-item">
          <i class="fas fa-shopping-bag"></i>
          My Orders
        </a>
        <div class="dropdown-divider"></div>
        <a href="#" class="dropdown-menu-item logout">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </a>
      </div>
    </div>
  `

    const userDropdown = document.querySelector(".user-dropdown")
    const userEmail = document.querySelector(".user-email")

    userEmail.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("active")
    })

    document.addEventListener("click", () => {
      userDropdown.classList.remove("active")
    })

    document.querySelector(".dropdown-menu-item.logout").addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })

    updateCheckoutForm()

    if (email === "admin@freshmart.com") {
      const cartIcon = document.querySelector(".cart-icon")
      if (cartIcon) cartIcon.style.display = "none"

      const ordersSection = document.getElementById("orders")
      if (ordersSection) ordersSection.style.display = "none"

      const productsSection = document.getElementById("products")
      if (productsSection) productsSection.style.display = "none"

      const specialsSection = document.getElementById("specials")
      if (specialsSection) specialsSection.style.display = "none"
    }
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    location.reload()
  }

  async function registerUser(e) {
    e.preventDefault()
    const email = signupFormEl.email.value
    const password = signupFormEl.password.value
    const confirm = signupFormEl.confirmPassword.value

    if (password !== confirm) {
      alert("Passwords do not match!")
      return
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (res.ok) {
        alert("Signup successful! You can now log in.")
        switchTab("login")
      } else {
        alert(data.error || "Signup failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("An error occurred during registration. Please try again.")
    }
  }

  async function loginUser(e) {
    e.preventDefault()
    const email = loginFormEl.email.value
    const password = loginFormEl.password.value

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (res.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("userEmail", email)
        closeAuthModal()
        setLoggedIn(email)

        if (email === "admin@freshmart.com") {
          const adminDashboard = document.getElementById("admin-dashboard")
          if (adminDashboard) {
            adminDashboard.style.display = "block"
            loadAdminOrders()
          }
        }

        loadOrders()
      } else {
        alert(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("An error occurred during login. Please try again.")
    }
  }

  async function loadAdminOrders(statusFilter = "all") {
    try {
      const token = localStorage.getItem("token");
      const container = document.querySelector(".admin-orders");
      const ordersContainer = document.querySelector(".orders-container");
  
      if (!token) {
        container.innerHTML = "<p>Please log in to view orders</p>";
        return;
      }
  
      container.innerHTML = "<p>Loading orders...</p>";
  
      const response = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load orders");
      }
  
      let orders = await response.json();
  
      const filterNav = document.createElement("div");
      filterNav.className = "admin-filter-nav";
      filterNav.innerHTML = `
        <h3>Filter Orders</h3>
        <div class="admin-filter-buttons">
          <button class="admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-status="all">All Orders</button>
          <button class="admin-filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-status="pending">Pending</button>
          <button class="admin-filter-btn ${statusFilter === 'completed' ? 'active' : ''}" data-status="completed">Completed</button>
          <button class="admin-filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}" data-status="cancelled">Cancelled</button>
        </div>
      `;
  
      container.innerHTML = "";
  
      const existingFilterNav = document.querySelector(".admin-filter-nav");
      if (existingFilterNav) {
        existingFilterNav.remove();
      }
  
      ordersContainer.insertBefore(filterNav, container);
  
      if (!orders || orders.length === 0) {
        container.innerHTML = "<p>No orders found</p>";
        return;
      }
  
      const statusPriority = {
        'Pending': 1,
        'Completed': 2,
        'Cancelled': 3
      };
  
      let filteredOrders = orders;
  
      if (statusFilter !== "all") {
        filteredOrders = orders.filter((order) => {
          const orderStatus = order.status || "Pending";
          return orderStatus.toLowerCase() === statusFilter.toLowerCase();
        });
      } else {
        filteredOrders.sort((a, b) => {
          const statusA = a.status || "Pending";
          const statusB = b.status || "Pending";
  
          if (statusPriority[statusA] !== statusPriority[statusB]) {
            return statusPriority[statusA] - statusPriority[statusB];
          }
  
          return new Date(b.date) - new Date(a.date);
        });
      }
  
      if (filteredOrders.length === 0) {
        container.innerHTML = `<p>No ${statusFilter} orders found</p>`;
      
        document.querySelectorAll(".admin-filter-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const status = e.target.dataset.status;
            loadAdminOrders(status);
          });
        });
      
        return;
      }
      
      filteredOrders.forEach((order) => {
        const card = document.createElement("div");
        card.className = `order-card status-${(order.status || "Pending").toLowerCase()}`;
  
        card.innerHTML = `
          <div class="order-header">
            <h4>Order #${order.id}</h4>
            <span class="order-status">${order.status || "Pending"}</span>
          </div>
          <div class="order-details">
            <div class="order-detail">
              <span class="detail-label">User:</span>
              <span class="detail-value">${order.email}</span>
            </div>
            <div class="order-detail">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(order.date).toLocaleString()}</span>
            </div>
            <div class="order-detail">
              <span class="detail-label">Customer:</span>
              <span class="detail-value">${order.name}</span>
            </div>
            <div class="order-detail">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${order.address}</span>
            </div>
            <div class="order-items">
              <p class="items-title">Items:</p>
              <ul class="items-list">
                ${order.cart.map((item) => `<li>${item.name} x${item.quantity}</li>`).join("")}
              </ul>
            </div>
          </div>
          <div class="admin-actions">
            <button class="admin-btn complete-btn" data-id="${order.id}">
              <i class="fas fa-check-circle"></i> Complete
            </button>
            <button class="admin-btn cancel-btn" data-id="${order.id}">
              <i class="fas fa-times-circle"></i> Cancel
            </button>
            <button class="admin-btn edit-btn" data-id="${order.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
          </div>
        `;
  
        container.appendChild(card);
      });
  
      document.querySelectorAll(".admin-filter-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const status = e.target.dataset.status;
          loadAdminOrders(status);
        });
      });
  
      document.querySelectorAll(".complete-btn").forEach((btn) => {
        btn.addEventListener("click", updateOrderStatus);
      });
      document.querySelectorAll(".cancel-btn").forEach((btn) => {
        btn.addEventListener("click", updateOrderStatus);
      });
      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", editOrder);
      });
  
    } catch (error) {
      console.error("Error loading admin orders:", error);
      const container = document.querySelector(".admin-orders");
      container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  
      if (error.message.includes("token") || error.message.includes("Invalid")) {
        alert("Session expired. Please log in again.");
        logout();
      }
    }
  }
  

  async function updateOrderStatus(e) {
    const orderId = e.target.dataset.id;
    const status = e.target.classList.contains("complete-btn") ? "Completed" : "Cancelled";
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update order");
      }
  
      alert(`Order marked as ${status}`);
      loadAdminOrders(); // Refresh view
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }
  

  async function editOrder(e) {
    const orderId = e.target.dataset.id
    const orderCard = e.target.closest(".order-card")

    const name = orderCard.querySelector("p:nth-of-type(4)").textContent.replace("Name:", "").trim()
    const address = orderCard.querySelector("p:nth-of-type(5)").textContent.replace("Address:", "").trim()

    const editForm = document.createElement("div")
    editForm.className = "edit-order-form"
    editForm.innerHTML = `
      <h4>Edit Order #${orderId}</h4>
      <label>
        Customer Name:
        <input type="text" name="name" value="${name}" required>
      </label>
      <label>
        Delivery Address:
        <textarea name="address" required>${address}</textarea>
      </label>
      <div class="edit-form-actions">
        <button type="button" class="save-edit-btn" data-id="${orderId}">Save Changes</button>
        <button type="button" class="cancel-edit-btn">Cancel</button>
      </div>
    `

    const adminActions = orderCard.querySelector(".admin-actions")
    adminActions.style.display = "none"
    orderCard.appendChild(editForm)

    orderCard.querySelector(".save-edit-btn").addEventListener("click", saveOrderEdit)
    orderCard.querySelector(".cancel-edit-btn").addEventListener("click", () => {
      orderCard.removeChild(editForm)
      adminActions.style.display = "flex"
    })
  }

  async function saveOrderEdit(e) {
    const orderId = e.target.dataset.id;
    const orderCard = e.target.closest(".order-card");
    const name = orderCard.querySelector('input[name="name"]').value;
    const address = orderCard.querySelector('textarea[name="address"]').value;
  
    try {
      const token = localStorage.getItem("token");
  
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, address }),
      });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update order");
      }
  
      alert("Order info updated");
      loadAdminOrders(); // Refresh list
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }  

  if (loginFormEl) {
    loginFormEl.addEventListener("submit", loginUser)
  }

  if (signupFormEl) {
    signupFormEl.addEventListener("submit", registerUser)
  }

  function openAuthModal(defaultTab = "login") {
    authModal.classList.add("active")
    authOverlay.classList.add("active")

    switchTab(defaultTab)
  }

  function closeAuthModal() {
    authModal.classList.remove("active")
    authOverlay.classList.remove("active")
  }

  function switchTab(tab) {
    tabButtons.forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add("active")

    loginForm.classList.remove("active")
    signupForm.classList.remove("active")
    if (tab === "login") loginForm.classList.add("active")
    else signupForm.classList.add("active")
  }

  if (loginBtn) loginBtn.addEventListener("click", () => openAuthModal("login"))
  if (signupBtn) signupBtn.addEventListener("click", () => openAuthModal("signup"))

  authOverlay.addEventListener("click", closeAuthModal)

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab)
    })
  })

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const token = localStorage.getItem("token")
    const userEmail = localStorage.getItem("userEmail")

    if (!token || !userEmail) {
      alert("Please log in to place an order")
      openAuthModal("login")
      return
    }

    const formData = new FormData(checkoutForm)
    const order = {
      name: formData.get("name"),
      email: userEmail,
      address: formData.get("address"),
      cart: cart,
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      })

      if (res.ok) {
        cart = []
        saveCart()
        updateCart()
        checkoutForm.reset()
        updateCheckoutForm()
        successMsg.style.display = "block"
        setTimeout(() => {
          successMsg.style.display = "none"
        }, 3000)
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Error placing order. Please try again.")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Network error. Please try again.")
    }
  })

  let cart = []
  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart))
  }

  function loadCart() {
    cart = JSON.parse(localStorage.getItem("cart")) || []
    updateCart()
  }

  function toggleCart() {
    cartSidebar.classList.toggle("open")
    cartOverlay.classList.toggle("active")
    document.body.style.overflow = cartSidebar.classList.contains("open") ? "hidden" : "auto"
  }

  cartIcon.addEventListener("click", toggleCart)
  closeCart.addEventListener("click", toggleCart)
  cartOverlay.addEventListener("click", toggleCart)

  function updateCart() {
    cartItemsContainer.innerHTML = ""
    let total = 0

    cart.forEach((item, index) => {
      const cartItemElement = document.createElement("div")
      cartItemElement.className = "cart-item"

      const img = document.createElement("img")
      img.className = "cart-item-img"
      img.src = item.image
      img.alt = item.name

      const details = document.createElement("div")
      details.className = "cart-item-details"

      const title = document.createElement("h4")
      title.className = "cart-item-title"
      title.textContent = item.name

      const price = document.createElement("p")
      price.className = "cart-item-price"
      price.textContent = `$${item.price.toFixed(2)}`

      const actions = document.createElement("div")
      actions.className = "cart-item-actions"

      const minusBtn = document.createElement("button")
      minusBtn.className = "quantity-btn minus"
      minusBtn.dataset.id = index
      minusBtn.textContent = "-"

      const quantitySpan = document.createElement("span")
      quantitySpan.className = "cart-item-quantity"
      quantitySpan.textContent = item.quantity

      const plusBtn = document.createElement("button")
      plusBtn.className = "quantity-btn plus"
      plusBtn.dataset.id = index
      plusBtn.textContent = "+"

      const removeBtn = document.createElement("button")
      removeBtn.className = "remove-item"
      removeBtn.dataset.id = index
      const trashIcon = document.createElement("i")
      trashIcon.className = "fas fa-trash"
      removeBtn.appendChild(trashIcon)

      actions.appendChild(minusBtn)
      actions.appendChild(quantitySpan)
      actions.appendChild(plusBtn)
      actions.appendChild(removeBtn)

      details.appendChild(title)
      details.appendChild(price)
      details.appendChild(actions)

      cartItemElement.appendChild(img)
      cartItemElement.appendChild(details)
      cartItemsContainer.appendChild(cartItemElement)

      total += item.price * item.quantity
    })

    document.querySelectorAll(".quantity-btn.minus").forEach((btn) => {
      btn.addEventListener("click", decreaseQuantity)
    })

    document.querySelectorAll(".quantity-btn.plus").forEach((btn) => {
      btn.addEventListener("click", increaseQuantity)
    })

    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", removeItem)
    })

    cartTotal.textContent = `$${total.toFixed(2)}`

    const count = cart.reduce((sum, item) => sum + item.quantity, 0)
    cartCount.textContent = count
    cartCount.style.display = count > 0 ? "flex" : "none"
  }

  function addToCart(product) {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        ...product,
        quantity: 1,
      })
    }

    updateCart()
    saveCart()

    if (!cartSidebar.classList.contains("open")) {
      toggleCart()
    }
  }

  function increaseQuantity(e) {
    const index = e.target.getAttribute("data-id")
    cart[index].quantity += 1
    updateCart()
    saveCart()
  }

  function decreaseQuantity(e) {
    const index = e.target.getAttribute("data-id")
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1
    } else {
      cart.splice(index, 1)
    }
    updateCart()
    saveCart()
  }

  function removeItem(e) {
    const index = e.target.closest(".remove-item").getAttribute("data-id")
    cart.splice(index, 1)
    updateCart()
    saveCart()
  }

  const imagePath = "images/"

  let products = []

  async function loadProducts(category = "all") {
    try {
      const res = await fetch("/api/products")
      if (!res.ok) {
        throw new Error(`Failed to load products: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      products = data

      renderProducts(category)
    } catch (error) {
      console.error("Error loading products:", error)
      const productsGrid = document.querySelector(".products-grid")
      if (productsGrid) {
        productsGrid.innerHTML = `<p class="error">Error loading products: ${error.message}</p>`
      }
    }
  }

  const productsGrid = document.querySelector(".products-grid")
  const categoryTabs = document.querySelectorAll(".category-tab")

  function renderProducts(category = "all") {
    if (!productsGrid) return
  
    productsGrid.innerHTML = ""
  
    if (!products || products.length === 0) {
      productsGrid.innerHTML = "<p>No products available</p>"
      return
    }
  
    const filteredProducts = category === "all" ? products : products.filter((p) => p.category === category)
  
    if (filteredProducts.length === 0) {
      productsGrid.innerHTML = `<p>No products found in category: ${category}</p>`
      return
    }
  
    filteredProducts.forEach((product) => {
      const productCard = document.createElement("div")
      productCard.className = "product-card"
      productCard.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>Fresh and delicious ${product.name.toLowerCase()}</p>
          <div class="product-price">$${product.price.toFixed(2)}</div>
          <button class="add-to-cart" data-id="${product._id}">Add to Cart</button>
        </div>
      `
      productsGrid.appendChild(productCard)
    })
  
    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.getAttribute("data-id")
        const product = products.find((p) => p._id === id)
        if (product) {
          addToCart({
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
          })
          this.textContent = "Added!"
          this.style.backgroundColor = "#4CAF50"
          setTimeout(() => {
            this.textContent = "Add to Cart"
            this.style.backgroundColor = ""
          }, 1000)
        }
      })
    })
  }
  

  loadCart()
  loadProducts()

  if (categoryTabs) {
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        categoryTabs.forEach((t) => t.classList.remove("active"))
        this.classList.add("active")
        const category = this.getAttribute("data-category")
        renderProducts(category)
      })
    })
  }

  document.querySelectorAll(".special-offer .add-to-cart").forEach((btn) => {
    btn.addEventListener("click", function () {
      const offer = this.closest(".special-offer")
      const name = offer.querySelector("h3").textContent
      const priceText = offer.querySelector(".discounted-price").textContent
      let price

      if (priceText.includes("$")) {
        price = Number.parseFloat(priceText.replace("$", ""))
      } else {
        price = Number.parseFloat(offer.querySelector(".original-price").textContent.replace("$", ""))
      }

      let imageName
      switch (name) {
        case "Organic Apples":
          imageName = "apple.png"
          break
        case "Fresh Bread":
          imageName = "whole-wheat-bread.png"
          break
        case "Organic Milk":
          imageName = "milk-bottle.png"
          break
        default:
          imageName = "apple.png"
      }

      const image = `${imagePath}${imageName}`

      addToCart({
        id: Date.now(),
        name,
        price,
        image,
        category: "specials",
      })

      this.textContent = "Added!"
      this.style.backgroundColor = "#FF5722"
      setTimeout(() => {
        this.textContent = "Add to Cart"
        this.style.backgroundColor = ""
      }, 1000)
    })
  })

  const newsletterForm = document.querySelector(".newsletter-form")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault()
      const email = this.querySelector("input").value

      if (email.includes("@") && email.includes(".")) {
        alert("Thank you for subscribing to our newsletter!")
        this.reset()
      } else {
        alert("Please enter a valid email address.")
      }
    })
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        })
      }
    })
  })

  function animateOnScroll() {
    const elements = document.querySelectorAll(".products-section, .specials-section, .newsletter-section")

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top
      const screenPosition = window.innerHeight / 1.3

      if (elementPosition < screenPosition) {
        element.style.opacity = "1"
        element.style.transform = "translateY(0)"
      }
    })
  }

  document.querySelectorAll(".products-section, .specials-section, .newsletter-section").forEach((element) => {
    element.style.opacity = "0"
    element.style.transform = "translateY(20px)"
    element.style.transition = "opacity 0.5s ease, transform 0.5s ease"
  })

  const savedEmail = localStorage.getItem("userEmail")
  const savedToken = localStorage.getItem("token")

  if (savedEmail && savedToken) {
    setLoggedIn(savedEmail)
    loadOrders()

    if (savedEmail === "admin@freshmart.com") {
      const adminDashboard = document.getElementById("admin-dashboard")
      if (adminDashboard) {
        adminDashboard.style.display = "block"

        const adminOrdersContainer = document.querySelector(".admin-orders")
        if (adminOrdersContainer) {
          const existingTabs = adminDashboard.querySelector(".admin-filter-nav")
          if (existingTabs) {
            existingTabs.remove()
          }

          const filterNav = document.createElement("div")
          filterNav.className = "admin-filter-nav"
          filterNav.innerHTML = `
        <h3>Filter Orders</h3>
        <div class="admin-filter-buttons">
          <button class="admin-filter-btn active" data-status="all">All Orders</button>
          <button class="admin-filter-btn" data-status="pending">Pending</button>
          <button class="admin-filter-btn" data-status="completed">Completed</button>
          <button class="admin-filter-btn" data-status="cancelled">Cancelled</button>
        </div>
      `

          adminOrdersContainer.parentNode.insertBefore(filterNav, adminOrdersContainer)

          document.querySelectorAll(".admin-filter-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
              document.querySelectorAll(".admin-filter-btn").forEach((b) => b.classList.remove("active"))
              this.classList.add("active")

              const status = this.dataset.status
              loadAdminOrders(status)
            })
          })

          loadAdminOrders()
        }
      }
    }
  }

  window.addEventListener("scroll", animateOnScroll)
  animateOnScroll()
})