// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()

// Programmatic toast helper
function showToast(message, type = "success") {
    const container = document.getElementById("wl-toasts");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `wl-toast wl-toast-${type}`;
    toast.setAttribute("role", "alert");
    
    const iconClass = type === "success" 
        ? "fa-circle-check" 
        : type === "info" 
            ? "fa-circle-info" 
            : "fa-circle-exclamation";
            
    toast.innerHTML = `
      <i class="fa-solid ${iconClass} wl-toast-icon"></i>
      <div class="wl-toast-body">
        <p class="wl-toast-message">${message}</p>
      </div>
      <button class="wl-toast-close" onclick="dismissToast(this)">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('wl-toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Dismiss toast manually when user clicks × 
function dismissToast(btn) {
    const toast = btn.closest('.wl-toast');
    if (!toast) return;
    toast.classList.add('wl-toast-out');
    setTimeout(() => toast.remove(), 300);
}

// Toggle wishlist item via AJAX
async function toggleWishlist(button) {
    const listingId = button.getAttribute("data-listing-id");
    if (!listingId) return;
    
    try {
        const response = await fetch(`/wishlist/toggle/${listingId}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        
        if (response.redirected) {
            // User was redirected (e.g. to /login because not logged in)
            window.location.href = response.url;
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            if (data.added) {
                button.classList.add("wishlisted");
                showToast("Saved to wishlist!", "success");
            } else {
                button.classList.remove("wishlisted");
                showToast("Removed from wishlist", "info");
                
                // If we are on the wishlist page itself, fade out and remove the card
                const wlCard = button.closest(".wl-card");
                if (wlCard && window.location.pathname === "/wishlist") {
                    wlCard.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                    wlCard.style.opacity = "0";
                    wlCard.style.transform = "scale(0.9)";
                    setTimeout(() => {
                        wlCard.remove();
                        // If no cards left, reload to show empty state
                        const grid = document.getElementById("listingsGrid");
                        if (grid && grid.querySelectorAll(".wl-card").length === 0) {
                            location.reload();
                        }
                    }, 400);
                }
            }
        } else {
            showToast("Failed to update wishlist", "error");
        }
    } catch (err) {
        console.error("Wishlist error:", err);
        window.location.href = "/login";
    }
}

// Toggle wishlist item on show page details
async function toggleWishlistDetail(button) {
    const listingId = button.getAttribute("data-listing-id");
    if (!listingId) return;
    
    try {
        const response = await fetch(`/wishlist/toggle/${listingId}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        
        if (response.redirected) {
            window.location.href = response.url;
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            const icon = button.querySelector(".heart-icon");
            const text = button.querySelector(".btn-text");
            
            if (data.added) {
                button.classList.add("wishlisted-btn");
                if (icon) {
                    icon.className = "fa-solid fa-heart heart-icon";
                    icon.style.color = "var(--wl-primary)";
                }
                if (text) text.textContent = "Saved";
                showToast("Saved to wishlist!", "success");
            } else {
                button.classList.remove("wishlisted-btn");
                if (icon) {
                    icon.className = "fa-regular fa-heart heart-icon";
                    icon.style.color = "";
                }
                if (text) text.textContent = "Save";
                showToast("Removed from wishlist", "info");
            }
        } else {
            showToast("Failed to update wishlist", "error");
        }
    } catch (err) {
        console.error("Wishlist error:", err);
        window.location.href = "/login";
    }
}